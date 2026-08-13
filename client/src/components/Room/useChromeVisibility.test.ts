import { renderHook, act } from "@testing-library/react";
import { useChromeVisibility } from "./useChromeVisibility";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("mobile: visible initially, hides after the inactivity delay", () => {
  const { result } = renderHook(() => useChromeVisibility(true));
  expect(result.current.visible).toBe(true);
  act(() => { jest.advanceTimersByTime(4000); });
  expect(result.current.visible).toBe(false);
});

test("mobile: reveal() re-shows and restarts the timer", () => {
  const { result } = renderHook(() => useChromeVisibility(true));
  act(() => { jest.advanceTimersByTime(4000); });
  expect(result.current.visible).toBe(false);
  act(() => { result.current.reveal(); });
  expect(result.current.visible).toBe(true);
  act(() => { jest.advanceTimersByTime(3999); });
  expect(result.current.visible).toBe(true); // timer was reset
  act(() => { jest.advanceTimersByTime(1); });
  expect(result.current.visible).toBe(false);
});

test("mobile: hide() hides immediately", () => {
  const { result } = renderHook(() => useChromeVisibility(true));
  act(() => { result.current.hide(); });
  expect(result.current.visible).toBe(false);
});

test("desktop (disabled): stays visible and ignores timers and hide()", () => {
  const { result } = renderHook(() => useChromeVisibility(false));
  act(() => { jest.advanceTimersByTime(10000); });
  expect(result.current.visible).toBe(true);
  act(() => { result.current.hide(); });
  expect(result.current.visible).toBe(true);
});

test("mobile: toggle enabled mid-countdown clears timer and pins visible", () => {
  const { result, rerender } = renderHook(
    ({ enabled }) => useChromeVisibility(enabled),
    { initialProps: { enabled: true } }
  );
  expect(result.current.visible).toBe(true);
  act(() => { jest.advanceTimersByTime(2000); });
  expect(result.current.visible).toBe(true);
  // Disable mid-countdown
  rerender({ enabled: false });
  expect(result.current.visible).toBe(true);
  // Advancing timers further should not flip it to false (old timer was cleared)
  act(() => { jest.advanceTimersByTime(2500); });
  expect(result.current.visible).toBe(true);
});

test("mobile: unmount cleanup clears timer, no state-update warning", () => {
  const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
  const { unmount } = renderHook(() => useChromeVisibility(true));
  clearTimeoutSpy.mockClear(); // Clear calls from initialization
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
  // Advancing timers after unmount should not cause state-update warnings
  act(() => { jest.advanceTimersByTime(4000); });
});
