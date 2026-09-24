import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

let mockUser = { isLoaded: true, isSignedIn: false };
jest.mock("@clerk/react", () => ({
  useUser: () => mockUser,
  useClerk: () => ({}),
}));
jest.mock("./components/Navbar", () => () => <nav />);
jest.mock("./components/WaveBackground/WaveBackground", () => () => null);
jest.mock("./components/Dashboard", () => () => <p>lounge</p>);
jest.mock("./components/DirectRoomJoin", () => () => <div />);
jest.mock("./components/LandingPage", () => () => <p>landing</p>);
jest.mock("./components/Profile", () => () => <p>profile</p>);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  mockUser = { isLoaded: true, isSignedIn: false };
});

test("signed-out visitors to the lounge land on the home page", () => {
  renderAt("/dashboard");
  expect(screen.getByText("landing")).toBeInTheDocument();
});

test("signed-out visitors to a profile land on the home page", () => {
  renderAt("/profile");
  expect(screen.getByText("landing")).toBeInTheDocument();
});

test("signed-in people reach the lounge", () => {
  mockUser = { isLoaded: true, isSignedIn: true };
  renderAt("/dashboard");
  expect(screen.getByText("lounge")).toBeInTheDocument();
});

test("nothing flashes while sign-in state is still loading", () => {
  mockUser = { isLoaded: false, isSignedIn: false };
  renderAt("/dashboard");
  expect(screen.queryByText("landing")).toBeNull();
  expect(screen.queryByText("lounge")).toBeNull();
});

test("the privacy policy is reachable at /privacy without logging in", () => {
  render(
    <MemoryRouter initialEntries={["/privacy"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole("heading", { level: 1, name: /privacy policy/i })).toBeInTheDocument();
});

test("the terms of service are reachable at /terms without logging in", () => {
  render(
    <MemoryRouter initialEntries={["/terms"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole("heading", { level: 1, name: /terms of service/i })).toBeInTheDocument();
});

test("an unknown address shows a not-found page with a way home", () => {
  renderAt("/no-such-page");
  expect(screen.getByRole("heading", { name: "Nothing here" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
});
