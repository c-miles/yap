import { renderHook, act } from "@testing-library/react";
import { useChat } from "./useChat";

function mockSocket() {
  const handlers: Record<string, Function> = {};
  return {
    emit: jest.fn(),
    on: (e: string, cb: Function) => { handlers[e] = cb; },
    off: jest.fn(),
    fire: (e: string, payload?: any) => handlers[e]?.(payload),
  };
}
const msg = (id: string, text: string) => ({ _id: id, message: text, username: "ann", timestamp: new Date() });

test("requests history on mount and replaces on roomMessages", () => {
  const s = mockSocket();
  const { result } = renderHook(() => useChat(s, "r1", "me", false));
  expect(s.emit).toHaveBeenCalledWith("getRoomMessages");
  act(() => s.fire("roomMessages", [msg("1", "hi")]));
  expect(result.current.messages).toHaveLength(1);
});

test("appends on receiveMessage", () => {
  const s = mockSocket();
  const { result } = renderHook(() => useChat(s, "r1", "me", false));
  act(() => s.fire("receiveMessage", msg("1", "hi")));
  expect(result.current.messages[0].message).toBe("hi");
});

test("unread increments while closed, resets on open", () => {
  const s = mockSocket();
  const { result, rerender } = renderHook(
    ({ open }) => useChat(s, "r1", "me", open),
    { initialProps: { open: false } }
  );
  act(() => s.fire("receiveMessage", msg("1", "a")));
  act(() => s.fire("receiveMessage", msg("2", "b")));
  expect(result.current.unreadCount).toBe(2);
  expect(result.current.latestUnread?.message).toBe("b");
  rerender({ open: true });
  expect(result.current.unreadCount).toBe(0);
  expect(result.current.latestUnread).toBeNull();
});

test("does not increment unread while open", () => {
  const s = mockSocket();
  const { result } = renderHook(() => useChat(s, "r1", "me", true));
  act(() => s.fire("receiveMessage", msg("1", "a")));
  expect(result.current.unreadCount).toBe(0);
});

test("sendMessage emits with message + username", () => {
  const s = mockSocket();
  const { result } = renderHook(() => useChat(s, "r1", "me", true));
  act(() => result.current.sendMessage("yo"));
  expect(s.emit).toHaveBeenCalledWith("sendMessage", { message: "yo", username: "me" });
  expect(result.current.messages).toHaveLength(0); // server-echo model: no optimistic local append
});
