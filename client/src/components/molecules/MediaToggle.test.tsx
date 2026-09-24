import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MediaToggle from "./MediaToggle";

test("the mic button names what it will do", () => {
  const { rerender } = render(<MediaToggle kind="mic" off={false} onClick={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
  rerender(<MediaToggle kind="mic" off onClick={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
});

test("the camera button names what it will do", () => {
  const { rerender } = render(<MediaToggle kind="camera" off={false} onClick={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Turn off camera" })).toBeInTheDocument();
  rerender(<MediaToggle kind="camera" off onClick={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Turn on camera" })).toBeInTheDocument();
});

test("clicking toggles", () => {
  const onClick = jest.fn();
  render(<MediaToggle kind="mic" off={false} onClick={onClick} />);
  fireEvent.click(screen.getByRole("button", { name: "Mute" }));
  expect(onClick).toHaveBeenCalled();
});
