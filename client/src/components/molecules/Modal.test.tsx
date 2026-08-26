import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Modal from "./Modal";

test("renders title and children when open", () => {
  render(<Modal open onClose={jest.fn()} title="Join Room"><p>body</p></Modal>);
  expect(screen.getByText("Join Room")).toBeInTheDocument();
  expect(screen.getByText("body")).toBeInTheDocument();
});

test("close button fires onClose", () => {
  const onClose = jest.fn();
  render(<Modal open onClose={onClose} title="X">c</Modal>);
  fireEvent.click(screen.getByRole("button", { name: /close/i }));
  expect(onClose).toHaveBeenCalled();
});

test("renders nothing visible when closed", () => {
  render(<Modal open={false} onClose={jest.fn()} title="Hidden">c</Modal>);
  expect(screen.queryByText("Hidden")).toBeNull();
});
