import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import { authFetch } from "../services/authFetch";
import DirectRoomJoin from "./DirectRoomJoin";

jest.mock("@clerk/react", () => ({ useUser: jest.fn() }));
jest.mock("./Room", () => () => <div data-testid="room" />);
jest.mock("./WaveBackground/WaveBackground", () => () => null);
jest.mock("../services/authFetch", () => ({ authFetch: jest.fn() }));

const mockedUseUser = useUser as jest.Mock;
const mockedAuthFetch = authFetch as jest.Mock;

const CurrentUrl = () => {
  const { pathname, search } = useLocation();
  return <p>at {pathname + search}</p>;
};

function renderAt(path: string, state?: object) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/room/:roomId" element={<DirectRoomJoin />} />
        <Route path="/" element={<CurrentUrl />} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows an auth spinner while Clerk is still loading", () => {
  mockedUseUser.mockReturnValue({ isLoaded: false, isSignedIn: false });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(screen.getByText(/checking your sign-in/i)).toBeInTheDocument();
});

test("logged-out users are sent to /?room=<id> to sign in", () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(screen.getByText("at /?room=507f1f77bcf86cd799439011")).toBeInTheDocument();
});

test("a bare room id link looks the room up so its name shows", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedAuthFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ roomId: "507f1f77bcf86cd799439011", friendlyName: "brave-blue-fox" }) });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(await screen.findByTestId("room")).toBeInTheDocument();
  expect(mockedAuthFetch).toHaveBeenCalledWith("/rooms/find-by-name/507f1f77bcf86cd799439011");
});

test("a room id that doesn't exist doesn't read out the id", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedAuthFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ message: "Room not found" }) });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(await screen.findByRole("heading", { name: "We couldn't find that room" })).toBeInTheDocument();
});

test("arriving with the room already looked up skips the lookup", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedAuthFetch.mockClear();
  renderAt("/room/brave-blue-fox", { friendlyName: "brave-blue-fox" });
  expect(await screen.findByTestId("room")).toBeInTheDocument();
  expect(mockedAuthFetch).not.toHaveBeenCalled();
});

test("a room name that doesn't resolve says so, with a way back", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedAuthFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ message: "Room not found" }) });
  renderAt("/room/jolly-red-fox");
  expect(await screen.findByRole("heading", { name: "We couldn't find jolly-red-fox" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to lounge" })).toHaveAttribute("href", "/dashboard");
});

test("a failed lookup says it couldn't join, with a way back", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedAuthFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: "boom" }) });
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderAt("/room/jolly-red-fox");
  expect(await screen.findByRole("heading", { name: "Couldn't join the room" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to lounge" })).toHaveAttribute("href", "/dashboard");
});
