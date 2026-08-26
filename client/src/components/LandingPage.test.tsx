import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

jest.mock("@clerk/react", () => ({ useUser: () => ({ isSignedIn: false }) }));
jest.mock("./WaveBackground/WaveBackground", () => () => <div data-testid="wave" />);
jest.mock("./AuthenticationButton", () => () => <button>Get started</button>);

test("shows the plainer tagline and no marketing filler", () => {
  render(<MemoryRouter><LandingPage /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: "yap" })).toBeInTheDocument();
  expect(screen.getByText(/share a link and hop in/i)).toBeInTheDocument();
  expect(screen.queryByText(/go-to video conferencing solution/i)).toBeNull();
});
