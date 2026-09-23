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
