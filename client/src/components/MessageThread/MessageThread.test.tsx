import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageThread from "./MessageThread";

const messages = [{ _id: "1", message: "hi", username: "ann", timestamp: new Date() }];

test("renders messages", () => {
  render(<MessageThread messages={messages} onSendMessage={jest.fn()} />);
  expect(screen.getByText("hi")).toBeInTheDocument();
});

test("Enter sends and clears the input", () => {
  const onSend = jest.fn();
  render(<MessageThread messages={[]} onSendMessage={onSend} />);
  const box = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: "hello" } });
  fireEvent.keyDown(box, { key: "Enter", shiftKey: false });
  expect(onSend).toHaveBeenCalledWith("hello");
  expect(box.value).toBe("");
});

test("Shift+Enter does not send", () => {
  const onSend = jest.fn();
  render(<MessageThread messages={[]} onSendMessage={onSend} />);
  const box = screen.getByPlaceholderText(/type a message/i);
  fireEvent.change(box, { target: { value: "line1" } });
  fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
  expect(onSend).not.toHaveBeenCalled();
});

test("the message box has a label", () => {
  render(<MessageThread messages={[]} onSendMessage={jest.fn()} />);
  expect(screen.getByRole("textbox", { name: "Message" })).toBeInTheDocument();
});

test("links in a message open in a new tab", () => {
  const withLink = [{ _id: "2", message: "try yap.anomaly-labs.com.", username: "ann", timestamp: new Date() }];
  render(<MessageThread messages={withLink} onSendMessage={jest.fn()} />);
  const link = screen.getByRole("link", { name: "yap.anomaly-labs.com" });
  expect(link).toHaveAttribute("href", "https://yap.anomaly-labs.com");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});
