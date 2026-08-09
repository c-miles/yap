import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import DirectRoomJoin from "./DirectRoomJoin";

jest.mock("@clerk/react", () => ({
  useUser: jest.fn(),
  useClerk: jest.fn(),
}));
jest.mock("./Room", () => () => <div data-testid="room" />);

const mockedUseUser = useUser as jest.Mock;
const mockedUseClerk = useClerk as jest.Mock;

function renderAt(path: string, state?: object) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/room/:roomId" element={<DirectRoomJoin />} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows an auth spinner while Clerk is still loading", () => {
  mockedUseUser.mockReturnValue({ isLoaded: false, isSignedIn: false });
  mockedUseClerk.mockReturnValue({ redirectToSignIn: jest.fn() });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
});

test("logged-out users are sent to login with a returnTo for this room", () => {
  const redirectToSignIn = jest.fn();
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false });
  mockedUseClerk.mockReturnValue({ redirectToSignIn });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(redirectToSignIn).toHaveBeenCalledWith({
    signInForceRedirectUrl: "/room/507f1f77bcf86cd799439011",
    signUpForceRedirectUrl: "/room/507f1f77bcf86cd799439011",
  });
});

test("authenticated users with a room id render the room", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedUseClerk.mockReturnValue({ redirectToSignIn: jest.fn() });
  renderAt("/room/507f1f77bcf86cd799439011");
  expect(await screen.findByTestId("room")).toBeInTheDocument();
});

test("authenticated users arriving from the dashboard render the room immediately", async () => {
  mockedUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true });
  mockedUseClerk.mockReturnValue({ redirectToSignIn: jest.fn() });
  renderAt("/room/507f1f77bcf86cd799439011", { isHost: true, friendlyName: "brave-blue-fox" });
  expect(await screen.findByTestId("room")).toBeInTheDocument();
});
