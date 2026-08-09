import { renderHook, act, waitFor } from "@testing-library/react";
import { useUser } from "@clerk/react";
import useAuthUser from "./useAuthUser";

// Jest can't resolve @clerk/shared subpaths pulled in by the real package,
// so mock the module with an explicit factory rather than requireActual.
jest.mock("@clerk/react", () => ({ useUser: jest.fn() }));

const mockedUseUser = useUser as jest.Mock;

describe("useAuthUser retry", () => {
  beforeEach(() => {
    mockedUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "user_1",
        imageUrl: "",
        primaryEmailAddress: null,
      },
    });
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("network error"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("retryProfileLoad issues a second network request after a failed fetch", async () => {
    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.profileError).toBe(true));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retryProfileLoad();
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
