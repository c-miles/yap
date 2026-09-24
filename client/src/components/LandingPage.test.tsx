import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./LandingPage";

let mockUser = { isLoaded: true, isSignedIn: false };
const mockOpenSignIn = jest.fn();
jest.mock("@clerk/react", () => ({ useUser: () => mockUser, useClerk: () => ({ openSignIn: mockOpenSignIn }) }));
jest.mock("./WaveBackground/WaveBackground", () => () => <div data-testid="wave" />);

const CurrentPath = () => <p>at {useLocation().pathname}</p>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  mockUser = { isLoaded: true, isSignedIn: false };
});

test("shows the plainer tagline and no marketing filler", () => {
  renderAt("/");
  expect(screen.getByRole("heading", { name: "yap" })).toBeInTheDocument();
  expect(screen.getByText(/share a link and hop in/i)).toBeInTheDocument();
  expect(screen.queryByText(/go-to video conferencing solution/i)).toBeNull();
});

test("a plain visit waits for the Sign In button", () => {
  renderAt("/");
  expect(mockOpenSignIn).not.toHaveBeenCalled();
});

const backToRoom = { forceRedirectUrl: "/room/brave-blue-fox", signUpForceRedirectUrl: "/room/brave-blue-fox" };

test("a room link opens sign-in straight away, set to come back to the room", () => {
  renderAt("/?room=brave-blue-fox");
  expect(mockOpenSignIn).toHaveBeenCalledWith(backToRoom);
});

test("reopening sign-in after closing it still comes back to the room", () => {
  renderAt("/?room=brave-blue-fox");
  mockOpenSignIn.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
  expect(mockOpenSignIn).toHaveBeenCalledWith(backToRoom);
});

test("a plain Sign In has no room to come back to", () => {
  renderAt("/");
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
  expect(mockOpenSignIn).toHaveBeenCalledWith({});
});

test("signed-in visitors go to the dashboard", () => {
  mockUser = { isLoaded: true, isSignedIn: true };
  renderAt("/");
  expect(screen.getByText("at /dashboard")).toBeInTheDocument();
});

test("signed-in visitors with a room link go to that room", () => {
  mockUser = { isLoaded: true, isSignedIn: true };
  renderAt("/?room=brave-blue-fox");
  expect(screen.getByText("at /room/brave-blue-fox")).toBeInTheDocument();
});
