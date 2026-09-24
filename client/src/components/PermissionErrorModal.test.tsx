import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PermissionErrorModal from "./PermissionErrorModal";

test("a blocked camera explains how to allow it", () => {
  render(<PermissionErrorModal open onClose={jest.fn()} errorType="denied" />);
  expect(screen.getByRole("heading", { name: "Camera access needed" })).toBeInTheDocument();
  expect(screen.getByText(/site settings/i)).toBeInTheDocument();
});

test("one button closes it", () => {
  const onClose = jest.fn();
  render(<PermissionErrorModal open onClose={onClose} errorType="notfound" />);
  expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Got it" }));
  expect(onClose).toHaveBeenCalled();
});
