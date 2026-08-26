import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PermissionErrorModal from "./PermissionErrorModal";

test("denied camera shows guidance and a retry", () => {
  render(<PermissionErrorModal open onClose={jest.fn()} onRetry={jest.fn()} errorType="denied" mediaType="video" />);
  expect(screen.getByText(/Camera Access/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
});

test("denied microphone offers a page refresh instead of retry", () => {
  render(<PermissionErrorModal open onClose={jest.fn()} onRetry={jest.fn()} errorType="denied" mediaType="audio" />);
  expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
});

test("video retry button calls onRetry", () => {
  const onRetry = jest.fn();
  render(<PermissionErrorModal open onClose={jest.fn()} onRetry={onRetry} errorType="denied" mediaType="video" />);
  fireEvent.click(screen.getByRole("button", { name: /try again/i }));
  expect(onRetry).toHaveBeenCalled();
});
