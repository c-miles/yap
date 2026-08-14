import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatToast from "./ChatToast";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
const msg = { _id: "1", message: "hello there", username: "ann", timestamp: new Date() };

test("renders nothing when message is null", () => {
  const { container } = render(<ChatToast message={null} />);
  expect(container).toBeEmptyDOMElement();
});

test("shows the message, then hides after the timeout", () => {
  const { container } = render(<ChatToast message={msg} />);
  const toast = container.querySelector(".chat-toast");

  // After render: message is present and toast is fully opaque
  expect(screen.getByText(/hello there/)).toBeInTheDocument();
  expect(screen.getByText("ann")).toBeInTheDocument();
  expect(toast).toHaveClass("opacity-100");

  // After timeout: toast fades (stays mounted, just transparent)
  act(() => { jest.advanceTimersByTime(5000); });
  expect(toast).toHaveClass("opacity-0");
  expect(screen.getByText(/hello there/)).toBeInTheDocument(); // still in DOM, just hidden
});
