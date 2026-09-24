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
  unreadCount: 0,
};

test("renders all five controls, each named for what it does", () => {
  render(<ControlBar {...base} />);
  expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Turn off camera" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Share room" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Leave call" })).toBeInTheDocument();
});

test("a muted mic offers to unmute", () => {
  render(<ControlBar {...base} audioEnabled={false} />);
  expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
});

test("leave fires onLeaveRoom", () => {
  render(<ControlBar {...base} />);
  fireEvent.click(screen.getByRole("button", { name: "Leave call" }));
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

test("chat button click fires toggleMessageThread", () => {
  const toggleMessageThread = jest.fn();
  render(<ControlBar {...base} toggleMessageThread={toggleMessageThread} />);
  fireEvent.click(screen.getByRole("button", { name: /chat/i }));
  expect(toggleMessageThread).toHaveBeenCalled();
});
