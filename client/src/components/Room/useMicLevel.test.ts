import { renderHook } from "@testing-library/react";
import { useMicLevel } from "./useMicLevel";

const resumeSpy = jest.fn();
const closeSpy = jest.fn();
const disconnectSpy = jest.fn();
const cancelRafSpy = jest.fn();

class FakeAnalyser {
  fftSize = 1024;
  frequencyBinCount = 512;
  connect() {}
  getFloatTimeDomainData(arr: Float32Array) {
    arr.fill(0.5); // nonzero signal -> RMS 0.5 -> visible level
  }
}
class FakeCtx {
  state = "suspended"; // exercise the resume() fix
  resume() {
    resumeSpy();
    return Promise.resolve();
  }
  close() {
    closeSpy();
    return Promise.resolve();
  }
  createMediaStreamSource() {
    return { connect() {}, disconnect: disconnectSpy };
  }
  createAnalyser() {
    return new FakeAnalyser();
  }
}

beforeEach(() => {
  resumeSpy.mockClear();
  closeSpy.mockClear();
  disconnectSpy.mockClear();
  cancelRafSpy.mockClear();
  (global as any).AudioContext = FakeCtx;
  let cb = 0;
  (global as any).requestAnimationFrame = (fn: FrameRequestCallback) => {
    if (cb++ < 1) fn(0);
    return 1;
  };
  (global as any).cancelAnimationFrame = cancelRafSpy;
});

const streamWithAudio = () =>
  ({ getAudioTracks: () => [{ kind: "audio" }] } as unknown as MediaStream);

test("returns 0 with no stream", () => {
  const { result } = renderHook(() => useMicLevel(null));
  expect(result.current).toBe(0);
});

test("resumes a suspended context, produces a level, and tears down on unmount", () => {
  const { result, unmount } = renderHook(() => useMicLevel(streamWithAudio()));
  expect(resumeSpy).toHaveBeenCalled(); // the flat-meter fix
  expect(result.current).toBeGreaterThan(0); // meter actually moves
  unmount();
  expect(closeSpy).toHaveBeenCalled();
  expect(disconnectSpy).toHaveBeenCalled();
  expect(cancelRafSpy).toHaveBeenCalled();
});
