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

const backToRoom = {
  withSignUp: true,
  forceRedirectUrl: "/room/brave-blue-fox",
  signUpForceRedirectUrl: "/room/brave-blue-fox",
};

beforeEach(() => {
  mockUser = { isLoaded: true, isSignedIn: false };
});

test("leads with the wordmark and the tagline", () => {
  renderAt("/");
  expect(screen.getByRole("heading", { level: 1, name: "yap" })).toBeInTheDocument();
  expect(screen.getByText(/share a link and hop in/i)).toBeInTheDocument();
});

test("a plain visit waits for the visitor to start", () => {
  renderAt("/");
  expect(mockOpenSignIn).not.toHaveBeenCalled();
});

test("one Sign in button covers new and returning people", () => {
  renderAt("/");
  expect(screen.getAllByRole("button")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(mockOpenSignIn).toHaveBeenCalledWith({ withSignUp: true });
});

test("a room link opens sign-in straight away, set to come back to the room", () => {
  renderAt("/?room=brave-blue-fox");
  expect(mockOpenSignIn).toHaveBeenCalledWith(backToRoom);
});

test("a room link says which room you're joining", () => {
  renderAt("/?room=brave-blue-fox");
  expect(screen.getByText(/you're invited to/i)).toHaveTextContent("You're invited to brave-blue-fox");
});

test("reopening sign-in after closing it still comes back to the room", () => {
  renderAt("/?room=brave-blue-fox");
  mockOpenSignIn.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(mockOpenSignIn).toHaveBeenCalledWith(backToRoom);
});

test("a room id link doesn't read out the raw id", () => {
  renderAt("/?room=507f1f77bcf86cd799439011");
  expect(screen.queryByText(/you're invited to/i)).toBeNull();
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
