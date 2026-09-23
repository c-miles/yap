import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

const baseProps = {
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  handleUsernameSubmit: jest.fn(),
  isSubmitting: false,
  newUsername: "",
  setNewUsername: jest.fn(),
  usernameError: "",
  userInfo: null,
  userExists: null,
  onLogin: jest.fn(),
  profileError: false,
  onRetryProfile: jest.fn(),
  isCreating: false,
  isJoining: false,
  createError: "",
  joinError: "",
  clearJoinError: jest.fn(),
};

const signedInProps = {
  ...baseProps,
  isLoading: false,
  isAuthenticated: true,
  userExists: true,
  userInfo: { username: "ada" } as any,
};

const renderSignedIn = (overrides: Partial<typeof signedInProps> = {}) =>
  render(<Dashboard {...signedInProps} {...overrides} />, { wrapper: MemoryRouter });

afterEach(() => {
  jest.useRealTimers();
});

test("prompts logged-out visitors to log in instead of spinning forever", () => {
  render(<Dashboard {...baseProps} isLoading={false} isAuthenticated={false} />, { wrapper: MemoryRouter });
  expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
});

test("shows a spinner only while auth state is still loading", () => {
  const { container } = render(<Dashboard {...baseProps} isLoading={true} isAuthenticated={false} />, { wrapper: MemoryRouter });
  expect(container.querySelector("span")).not.toBeNull(); // BeatLoader renders spans
  expect(screen.queryByRole("button", { name: /log in/i })).toBeNull();
});

test("offers a retry instead of spinning forever when the profile fetch fails", () => {
  render(<Dashboard {...baseProps} isLoading={false} isAuthenticated={true} profileError={true} />, { wrapper: MemoryRouter });
  expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
});

test("joining by code opens the modal and submits the typed room name", () => {
  renderSignedIn();

  fireEvent.click(screen.getByRole("button", { name: /join by code/i }));

  const input = screen.getByPlaceholderText("Enter room name");
  fireEvent.change(input, { target: { value: "my-room" } });

  fireEvent.click(screen.getByRole("button", { name: /join room/i }));

  expect(baseProps.joinRoom).toHaveBeenCalledWith("my-room");
});

test("a failed join keeps the modal open and shows why", () => {
  // headless ui only unmounts a closed modal after its leave transition runs
  jest.useFakeTimers();
  const { rerender } = renderSignedIn();
  fireEvent.click(screen.getByRole("button", { name: /join by code/i }));
  fireEvent.change(screen.getByPlaceholderText("Enter room name"), { target: { value: "jolly-red-fox" } });
  fireEvent.click(screen.getByRole("button", { name: /join room/i }));

  rerender(<Dashboard {...signedInProps} joinError="Room not found. Check the name and try again." />);
  act(() => {
    jest.runAllTimers();
  });

  expect(screen.getByPlaceholderText("Enter room name")).toHaveValue("jolly-red-fox");
  expect(screen.getByRole("alert")).toHaveTextContent("Room not found. Check the name and try again.");
});

test("editing the room name clears a stale join error", () => {
  renderSignedIn({ joinError: "Room not found. Check the name and try again." });
  fireEvent.click(screen.getByRole("button", { name: /join by code/i }));

  fireEvent.change(screen.getByPlaceholderText("Enter room name"), { target: { value: "jolly-red-fox" } });

  expect(baseProps.clearJoinError).toHaveBeenCalled();
});

test("closing the join modal clears a stale join error", () => {
  renderSignedIn({ joinError: "Room not found. Check the name and try again." });
  fireEvent.click(screen.getByRole("button", { name: /join by code/i }));

  fireEvent.click(screen.getByRole("button", { name: /close/i }));

  expect(baseProps.clearJoinError).toHaveBeenCalled();
});

test("the join button is disabled and says so while the lookup runs", () => {
  renderSignedIn({ isJoining: true });
  fireEvent.click(screen.getByRole("button", { name: /join by code/i }));

  expect(screen.getByRole("button", { name: /joining/i })).toBeDisabled();
});

test("starting a room is disabled while one is being created", () => {
  renderSignedIn({ isCreating: true });

  expect(screen.getByRole("button", { name: /start a room/i })).toBeDisabled();
});

test("a failed create is announced on the dashboard", () => {
  renderSignedIn({ createError: "Couldn't start a room. Try again." });

  expect(screen.getByRole("alert")).toHaveTextContent("Couldn't start a room. Try again.");
});

test("links to the privacy policy and terms, even when logged out", () => {
  render(<Dashboard {...baseProps} isLoading={false} isAuthenticated={false} />, { wrapper: MemoryRouter });
  expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
});
