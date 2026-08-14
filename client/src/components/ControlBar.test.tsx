import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ControlBar from "./ControlBar";

const base = {
  audioEnabled: true,
  videoEnabled: true,
  isMessageThreadOpen: false,
  toggleAudio: jest.fn(),
  toggleVideo: jest.fn(),
  toggleMessageThread: jest.fn(),
  onShareRoom: jest.fn(),
  onLeaveRoom: jest.fn(),
};

test("renders all five controls with anchor + leave labels", () => {
  render(<ControlBar {...base} />);
  expect(screen.getByRole("button", { name: /mic/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /camera/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /chat/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /leave/i })).toBeInTheDocument();
});

test("mic toggle exposes pressed state when muted", () => {
  const { rerender } = render(<ControlBar {...base} audioEnabled={true} />);
  expect(screen.getByRole("button", { name: /mic/i })).toHaveAttribute("aria-pressed", "false");
  rerender(<ControlBar {...base} audioEnabled={false} />);
  expect(screen.getByRole("button", { name: /mic/i })).toHaveAttribute("aria-pressed", "true");
});

test("leave fires onLeaveRoom", () => {
  render(<ControlBar {...base} />);
  fireEvent.click(screen.getByRole("button", { name: /leave/i }));
  expect(base.onLeaveRoom).toHaveBeenCalled();
});

test("chat shows active state when the thread is open", () => {
  render(<ControlBar {...base} isMessageThreadOpen={true} />);
  expect(screen.getByRole("button", { name: /chat/i })).toHaveAttribute("aria-pressed", "true");
});

test("chat button shows the unread count when there are unreads", () => {
  render(<ControlBar {...base} unreadCount={3} />);
  const chat = screen.getByRole("button", { name: /chat/i });
  expect(chat).toHaveTextContent("3");
  expect(chat).toHaveAccessibleName(/3 unread/i);
});

test("no unread badge at zero", () => {
  render(<ControlBar {...base} unreadCount={0} />);
  expect(screen.getByRole("button", { name: /chat/i })).not.toHaveTextContent(/[0-9]/);
});
