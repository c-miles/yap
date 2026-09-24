import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Profile from "./Profile";

const base = {
  username: "ada",
  setUsername: jest.fn(),
  handleSubmit: jest.fn(),
  error: "",
  userInfo: { username: "ada", picture: "", createdAt: new Date("2026-01-02") } as any,
  isEditing: false,
  setIsEditing: jest.fn(),
};

test("shows username and an edit affordance when not editing", () => {
  render(<Profile {...base} />);
  expect(screen.getByRole("heading", { level: 1, name: "ada" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument();
});

test("shows the username form when editing and submits via handleSubmit", () => {
  render(<Profile {...base} isEditing={true} />);
  const submit = screen.getByRole("button", { name: /update username/i });
  expect(submit).toBeInTheDocument();
  fireEvent.click(submit);
  expect(base.handleSubmit).toHaveBeenCalled();
});
