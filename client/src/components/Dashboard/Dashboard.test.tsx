import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

jest.mock("../WaveBackground/WaveBackground", () => () => null);

const baseProps = {
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  usernameForm: { username: "", setUsername: jest.fn(), error: "", isSubmitting: false, submit: jest.fn() },
  userInfo: null,
  userExists: null,
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
  userExists: true,
  userInfo: { username: "ada" } as any,
};

const renderSignedIn = (overrides: Partial<typeof signedInProps> = {}) =>
  render(<Dashboard {...signedInProps} {...overrides} />, { wrapper: MemoryRouter });

afterEach(() => {
  jest.useRealTimers();
});

test("shows a spinner while the profile loads", () => {
  render(<Dashboard {...baseProps} isLoading={true} />, { wrapper: MemoryRouter });
  expect(screen.getByLabelText("Loading")).toBeInTheDocument();
});

test("offers a retry instead of spinning forever when the profile fetch fails", () => {
  render(<Dashboard {...baseProps} isLoading={false} profileError={true} />, { wrapper: MemoryRouter });
  expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
});

test("joining by code opens the modal and submits the typed room name", () => {
  renderSignedIn();

  fireEvent.click(screen.getByRole("button", { name: /join by name/i }));

  const input = screen.getByPlaceholderText("Enter room name");
  fireEvent.change(input, { target: { value: "my-room" } });

  fireEvent.click(screen.getByRole("button", { name: /join room/i }));

  expect(baseProps.joinRoom).toHaveBeenCalledWith("my-room");
});

test("a failed join keeps the modal open and shows why", () => {
  // headless ui only unmounts a closed modal after its leave transition runs
  jest.useFakeTimers();
  const { rerender } = renderSignedIn();
  fireEvent.click(screen.getByRole("button", { name: /join by name/i }));
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
  fireEvent.click(screen.getByRole("button", { name: /join by name/i }));

  fireEvent.change(screen.getByPlaceholderText("Enter room name"), { target: { value: "jolly-red-fox" } });

  expect(baseProps.clearJoinError).toHaveBeenCalled();
});

test("closing the join modal clears a stale join error", () => {
  renderSignedIn({ joinError: "Room not found. Check the name and try again." });
  fireEvent.click(screen.getByRole("button", { name: /join by name/i }));

  fireEvent.click(screen.getByRole("button", { name: /close/i }));

  expect(baseProps.clearJoinError).toHaveBeenCalled();
});

test("the join button is disabled and says so while the lookup runs", () => {
  renderSignedIn({ isJoining: true });
  fireEvent.click(screen.getByRole("button", { name: /join by name/i }));

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

test("links to the privacy policy and terms", () => {
  render(<Dashboard {...baseProps} isLoading={false} userExists={true} userInfo={{ username: "ada" } as any} />, { wrapper: MemoryRouter });
  expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
});
