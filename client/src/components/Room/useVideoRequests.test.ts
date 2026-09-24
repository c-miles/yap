import { act, renderHook } from "@testing-library/react";
import { useVideoRequests } from "./useVideoRequests";

const handlers = new Map<string, (payload: any) => void>();
const socket = {
  emit: jest.fn(),
  on: (event: string, handler: (payload: any) => void) => handlers.set(event, handler),
  off: (event: string) => handlers.delete(event),
};
const fire = (event: string, payload: any) => act(() => handlers.get(event)?.(payload));

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

const render = (ids: string[], tileHeight: number) =>
  renderHook(({ ids, tileHeight }) => useVideoRequests(socket as any, ids, tileHeight), {
    initialProps: { ids, tileHeight },
  });

const settle = () => act(() => jest.advanceTimersByTime(300));

beforeEach(() => {
  jest.useFakeTimers();
  window.devicePixelRatio = 2;
  setHidden(false);
});

afterEach(() => {
  jest.useRealTimers();
});

test("asks each remote peer for their snapped tile size", () => {
  render(["a", "b"], 270);
  settle();

  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "a", maxHeight: 540 });
  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "b", maxHeight: 540 });
});

test("only re-sends when the size changes", () => {
  const { rerender } = render(["a", "b"], 270);
  settle();
  socket.emit.mockClear();

  rerender({ ids: ["a", "b"], tileHeight: 270 });
  settle();
  expect(socket.emit).not.toHaveBeenCalled();

  rerender({ ids: ["a", "b"], tileHeight: 170 });
  settle();
  expect(socket.emit).toHaveBeenCalledTimes(2);
  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "a", maxHeight: 360 });
});

test("a newcomer gets the current size, others aren't re-asked", () => {
  const { rerender } = render(["a"], 270);
  settle();
  socket.emit.mockClear();

  rerender({ ids: ["a", "c"], tileHeight: 270 });
  settle();

  expect(socket.emit).toHaveBeenCalledTimes(1);
  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "c", maxHeight: 540 });
});

test("asks everyone to pause while the tab is hidden", () => {
  render(["a", "b"], 270);
  settle();
  socket.emit.mockClear();

  act(() => setHidden(true));
  settle();

  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "a", maxHeight: 0 });
  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "b", maxHeight: 0 });
});

test("resumes at the tile size when the tab comes back", () => {
  render(["a"], 270);
  settle();
  act(() => setHidden(true));
  settle();
  socket.emit.mockClear();

  act(() => setHidden(false));
  settle();

  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "a", maxHeight: 540 });
});

test("sends nothing before the grid has a size", () => {
  render(["a"], 0);
  settle();

  expect(socket.emit).not.toHaveBeenCalled();
});

test("re-sends to someone who rejoins, since they start without our request", () => {
  render(["a", "b"], 270);
  settle();
  socket.emit.mockClear();

  fire("userJoined", { userId: "a" });
  settle();

  expect(socket.emit).toHaveBeenCalledTimes(1);
  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "a", maxHeight: 540 });
});

test("re-sends to everyone after we rejoin the room", () => {
  render(["a", "b"], 270);
  settle();
  socket.emit.mockClear();

  fire("currentParticipants", []);
  settle();

  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "a", maxHeight: 540 });
  expect(socket.emit).toHaveBeenCalledWith("sendVideoRequest", { targetUserId: "b", maxHeight: 540 });
});
