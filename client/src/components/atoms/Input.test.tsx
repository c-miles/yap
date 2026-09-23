import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Input from "./Input";

test("an error is announced and tied to the input it describes", () => {
  render(<Input placeholder="Enter room name" error="Room not found. Check the name and try again." />);

  const input = screen.getByPlaceholderText("Enter room name");
  expect(screen.getByRole("alert")).toHaveTextContent("Room not found. Check the name and try again.");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Room not found. Check the name and try again.");
});

test("an input without an error isn't marked invalid", () => {
  render(<Input placeholder="Enter room name" />);

  expect(screen.getByPlaceholderText("Enter room name")).not.toHaveAttribute("aria-invalid");
  expect(screen.queryByRole("alert")).toBeNull();
});
