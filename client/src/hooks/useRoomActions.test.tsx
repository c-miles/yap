import React from "react";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { authFetch } from "../services/authFetch";
import useRoomActions from "./useRoomActions";

jest.mock("../services/authFetch", () => ({ authFetch: jest.fn() }));

const mockedAuthFetch = authFetch as jest.Mock;

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function renderRoomActions() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={["/dashboard"]}>{children}</MemoryRouter>
  );
  return renderHook(() => ({ actions: useRoomActions(), location: useLocation() }), { wrapper });
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("joinRoom", () => {
  test("looks up a pasted invite link by its room name and enters as a guest", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(200, { roomId: "room123", friendlyName: "jolly-red-fox" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom(" https://yap.example.com/room/Jolly-Red-Fox ");
    });

    expect(mockedAuthFetch).toHaveBeenCalledWith("/rooms/find-by-name/jolly-red-fox");
    expect(result.current.location.pathname).toBe("/room/room123");
    expect(result.current.location.state).toEqual({ isHost: false, friendlyName: "jolly-red-fox" });
  });

  test("looks up a link copied from the address bar by its room id", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(200, { roomId: "507f1f77bcf86cd799439011", friendlyName: "jolly-red-fox" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom("https://yap.example.com/room/507f1f77bcf86cd799439011");
    });

    expect(mockedAuthFetch).toHaveBeenCalledWith("/rooms/find-by-name/507f1f77bcf86cd799439011");
    expect(result.current.location.state).toEqual({ isHost: false, friendlyName: "jolly-red-fox" });
  });

  test("reports a missing room as not found and stays on the dashboard", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(404, { message: "Room not found" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom("jolly-red-fox");
    });

    expect(result.current.actions.joinError).toMatch(/not found/i);
    expect(result.current.location.pathname).toBe("/dashboard");
  });

  test("reports a server error as retryable instead of not found", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(500, { message: "boom" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom("jolly-red-fox");
    });

    expect(result.current.actions.joinError).toMatch(/couldn't join/i);
    expect(result.current.location.pathname).toBe("/dashboard");
  });

  test("reports a network failure as retryable", async () => {
    mockedAuthFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom("jolly-red-fox");
    });

    expect(result.current.actions.joinError).toMatch(/couldn't join/i);
  });

  test("asks for a name instead of looking up a blank one", async () => {
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom("   ");
    });

    expect(mockedAuthFetch).not.toHaveBeenCalled();
    expect(result.current.actions.joinError).toMatch(/enter a room name/i);
  });

  test("flags the lookup as in flight until it settles", async () => {
    const lookup = deferred<ReturnType<typeof jsonResponse>>();
    mockedAuthFetch.mockReturnValue(lookup.promise);
    const { result } = renderRoomActions();

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.actions.joinRoom("jolly-red-fox");
    });
    expect(result.current.actions.isJoining).toBe(true);

    await act(async () => {
      lookup.resolve(jsonResponse(404, { message: "Room not found" }));
      await pending;
    });
    expect(result.current.actions.isJoining).toBe(false);
  });

  test("clearJoinError wipes the last join error", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(404, { message: "Room not found" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.joinRoom("jolly-red-fox");
    });
    act(() => {
      result.current.actions.clearJoinError();
    });

    expect(result.current.actions.joinError).toBe("");
  });
});

describe("createRoom", () => {
  test("enters the new room as host", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(201, { roomId: "room456", friendlyName: "calm-blue-owl" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    expect(result.current.location.pathname).toBe("/room/room456");
    expect(result.current.location.state).toEqual({ isHost: true, friendlyName: "calm-blue-owl" });
  });

  test("shows an error instead of entering /room/undefined when the server fails", async () => {
    mockedAuthFetch.mockResolvedValue(jsonResponse(500, { message: "Unable to generate unique room name" }));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    expect(result.current.actions.createError).toMatch(/couldn't start a room/i);
    expect(result.current.location.pathname).toBe("/dashboard");
  });

  test("shows an error when the request never reaches the server", async () => {
    mockedAuthFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderRoomActions();

    await act(async () => {
      await result.current.actions.createRoom();
    });

    expect(result.current.actions.createError).toMatch(/couldn't start a room/i);
  });

  test("flags the create as in flight until it settles", async () => {
    const request = deferred<ReturnType<typeof jsonResponse>>();
    mockedAuthFetch.mockReturnValue(request.promise);
    const { result } = renderRoomActions();

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.actions.createRoom();
    });
    expect(result.current.actions.isCreating).toBe(true);

    await act(async () => {
      request.resolve(jsonResponse(500, { message: "boom" }));
      await pending;
    });
    expect(result.current.actions.isCreating).toBe(false);
  });
});
