import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

jest.mock("@clerk/react", () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: false }),
  useClerk: () => ({}),
}));
jest.mock("./components/Navbar", () => () => <nav />);
jest.mock("./components/Dashboard", () => () => <div />);
jest.mock("./components/DirectRoomJoin", () => () => <div />);
jest.mock("./components/LandingPage", () => () => <div />);
jest.mock("./components/Profile", () => () => <div />);

test("the privacy policy is reachable at /privacy without logging in", () => {
  render(
    <MemoryRouter initialEntries={["/privacy"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole("heading", { level: 1, name: /privacy policy/i })).toBeInTheDocument();
});
