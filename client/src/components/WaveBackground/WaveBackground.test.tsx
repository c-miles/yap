import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WaveBackground from "./WaveBackground";

let reducedMotion = false;
const ctx = {
  setTransform: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  lineWidth: 1,
  strokeStyle: "",
};

beforeEach(() => {
  reducedMotion = false;
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as any);
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  (window as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  jest.spyOn(window, "requestAnimationFrame").mockReturnValue(7);
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("animates when motion is allowed", () => {
  render(<WaveBackground />);
  expect(window.requestAnimationFrame).toHaveBeenCalled();
});

test("draws a single still frame for people who prefer reduced motion", () => {
  reducedMotion = true;
  render(<WaveBackground />);
  expect(ctx.stroke).toHaveBeenCalledTimes(1);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
});

test("never blocks touch scrolling", () => {
  render(<WaveBackground />);
  const notBlocked = fireEvent.touchMove(document.body, { touches: [{ clientX: 10, clientY: 10 }] });
  expect(notBlocked).toBe(true);
});

test("stops animating when it unmounts", () => {
  const { unmount } = render(<WaveBackground />);
  unmount();
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);
});

test("the subtle variant doesn't track the cursor", () => {
  const listen = jest.spyOn(window, "addEventListener");
  render(<WaveBackground variant="subtle" />);
  const events = listen.mock.calls.map(([type]) => type);
  expect(events).not.toContain("mousemove");
  expect(events).not.toContain("touchmove");
});

test("the subtle variant redraws at most 30 times a second", () => {
  const frames: FrameRequestCallback[] = [];
  (window.requestAnimationFrame as jest.Mock).mockImplementation((cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  render(<WaveBackground variant="subtle" />);

  [16, 32, 48, 64, 80, 96].forEach((time) => frames[frames.length - 1](time));

  expect(ctx.stroke).toHaveBeenCalledTimes(3);
});
