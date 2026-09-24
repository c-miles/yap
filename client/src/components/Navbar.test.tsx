import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

const mockSignOut = jest.fn();
const mockNavigate = jest.fn();
let mockUser: { imageUrl: string; fullName: string } | null = { imageUrl: "", fullName: "Ada" };

jest.mock("@clerk/react", () => ({
  useUser: () => ({ user: mockUser }),
  useClerk: () => ({ signOut: () => mockSignOut() }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderNavbar = () => render(<MemoryRouter><Navbar /></MemoryRouter>);

beforeEach(() => {
  mockUser = { imageUrl: "", fullName: "Ada" };
});

test("the wordmark takes signed-in people to the lounge", () => {
  renderNavbar();
  expect(screen.getByRole("link", { name: "yap" })).toHaveAttribute("href", "/dashboard");
});

test("the wordmark takes signed-out visitors home", () => {
  mockUser = null;
  renderNavbar();
  expect(screen.getByRole("link", { name: "yap" })).toHaveAttribute("href", "/");
});

test("there's no separate Lounge button", () => {
  renderNavbar();
  expect(screen.queryByRole("button", { name: "Lounge" })).toBeNull();
});

test("opens the account menu with Profile and Sign out", () => {
  renderNavbar();
  fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
  expect(screen.getByText("Profile")).toBeInTheDocument();
  expect(screen.getByText("Sign out")).toBeInTheDocument();
});

test("clicking Sign out calls signOut", () => {
  renderNavbar();
  fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
  fireEvent.click(screen.getByText("Sign out"));
  expect(mockSignOut).toHaveBeenCalled();
});

test("clicking Profile navigates to /profile", () => {
  renderNavbar();
  fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
  fireEvent.click(screen.getByText("Profile"));
  expect(mockNavigate).toHaveBeenCalledWith("/profile");
});
