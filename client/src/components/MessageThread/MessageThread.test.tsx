import React from "react";
import { fireEvent, render, screen, act } from "@testing-library/react";
import MessageThreadContainer from "./index";

function fakeSocket() {
  const handlers = new Map<string, Function>();
  return {
    on: jest.fn((event: string, handler: Function) => handlers.set(event, handler)),
    off: jest.fn(),
    emit: jest.fn(),
    trigger: (event: string, payload: unknown) => handlers.get(event)?.(payload),
  };
}

test("sending emits to the server without an optimistic local append", () => {
  const socket = fakeSocket();
  render(<MessageThreadContainer roomId="r1" username="chris" socket={socket} />);

  fireEvent.change(screen.getByPlaceholderText(/type a message/i), { target: { value: "hey" } });
  fireEvent.click(screen.getByLabelText(/send message/i));

  expect(socket.emit).toHaveBeenCalledWith("sendMessage", expect.objectContaining({ message: "hey" }));
  expect(screen.queryByText("hey")).toBeNull(); // appears only via the server echo
});

test("identical repeated messages from the server all render", () => {
  const socket = fakeSocket();
  render(<MessageThreadContainer roomId="r1" username="chris" socket={socket} />);

  act(() => {
    socket.trigger("receiveMessage", { _id: "m1", message: "lol", username: "sam", timestamp: new Date() });
    socket.trigger("receiveMessage", { _id: "m2", message: "lol", username: "sam", timestamp: new Date() });
  });

  expect(screen.getAllByText(/lol/)).toHaveLength(2);
});
