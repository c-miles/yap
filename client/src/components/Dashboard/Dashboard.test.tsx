import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";

const baseProps = {
  createRoom: jest.fn(),
  handleJoinRoom: jest.fn(),
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
};

test("prompts logged-out visitors to log in instead of spinning forever", () => {
  render(<Dashboard {...baseProps} isLoading={false} isAuthenticated={false} />);
  expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
});

test("shows a spinner only while auth state is still loading", () => {
  const { container } = render(<Dashboard {...baseProps} isLoading={true} isAuthenticated={false} />);
  expect(container.querySelector("span")).not.toBeNull(); // BeatLoader renders spans
  expect(screen.queryByRole("button", { name: /log in/i })).toBeNull();
});

test("offers a retry instead of spinning forever when the profile fetch fails", () => {
  render(<Dashboard {...baseProps} isLoading={false} isAuthenticated={true} profileError={true} />);
  expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
});

test("joining by code opens the modal and submits the typed room name", () => {
  render(
    <Dashboard
      {...baseProps}
      isLoading={false}
      isAuthenticated={true}
      userExists={true}
      profileError={false}
      userInfo={{ username: "ada" } as any}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /join by code/i }));

  const input = screen.getByPlaceholderText("Enter room name");
  fireEvent.change(input, { target: { value: "my-room" } });

  fireEvent.click(screen.getByRole("button", { name: /join room/i }));

  expect(baseProps.handleJoinRoom).toHaveBeenCalledWith("my-room");
});
