import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

const mockSignOut = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@clerk/react", () => ({
  useUser: () => ({ user: { imageUrl: "", fullName: "Ada" } }),
  useClerk: () => ({ signOut: () => mockSignOut() }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  mockSignOut.mockClear();
  mockNavigate.mockClear();
});

test("opens the account menu with Profile and Logout", () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
  expect(screen.getByText("Profile")).toBeInTheDocument();
  expect(screen.getByText("Logout")).toBeInTheDocument();
});

test("clicking Logout calls signOut", () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
  fireEvent.click(screen.getByText("Logout"));
  expect(mockSignOut).toHaveBeenCalled();
});

test("clicking Profile navigates to /profile", () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
  fireEvent.click(screen.getByText("Profile"));
  expect(mockNavigate).toHaveBeenCalledWith("/profile");
});
