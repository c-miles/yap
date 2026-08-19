import { renderHook, waitFor, act } from "@testing-library/react";
import useMediaStream from "./useMediaStream";

function fakeStream() {
  const tracks = [{ kind: "audio", enabled: true, stop: jest.fn(), readyState: "live", getSettings: () => ({ deviceId: "default-mic" }) },
                   { kind: "video", enabled: true, stop: jest.fn(), readyState: "live", getSettings: () => ({ deviceId: "default-cam" }) }];
  return { getTracks: () => tracks, getAudioTracks: () => tracks.filter(t => t.kind === "audio"),
           getVideoTracks: () => tracks.filter(t => t.kind === "video") } as unknown as MediaStream;
}

beforeEach(() => {
  (navigator as any).mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue(fakeStream()),
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: "videoinput", deviceId: "cam1", label: "Cam 1" },
      { kind: "audioinput", deviceId: "mic1", label: "Mic 1" },
    ]),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
});

test("acquires audio+video up front with video enabled", async () => {
  const { result } = renderHook(() => useMediaStream({ onStreamUpdated: jest.fn() } as any));
  await waitFor(() => expect(result.current.streamReady).toBe(true));
  expect((navigator.mediaDevices.getUserMedia as jest.Mock)).toHaveBeenCalledWith(
    expect.objectContaining({ audio: true, video: expect.anything() })
  );
  expect(result.current.videoEnabled).toBe(true);
});

test("enumerates devices after grant", async () => {
  const { result } = renderHook(() => useMediaStream({ onStreamUpdated: jest.fn() } as any));
  await waitFor(() => expect(result.current.devices.cameras.length).toBe(1));
  expect(result.current.devices.mics.length).toBe(1);
});

test("retryMediaAccess is re-entrant-guarded — calling it twice in a row does not open two concurrent acquisitions", async () => {
  let resolvers: Array<(stream: MediaStream) => void> = [];
  const getUserMedia = jest.fn().mockImplementation(
    () => new Promise<MediaStream>((resolve) => { resolvers.push(resolve); })
  );
  (navigator as any).mediaDevices.getUserMedia = getUserMedia;

  const { result } = renderHook(() => useMediaStream({ onStreamUpdated: jest.fn() } as any));

  // initial mount acquisition is in flight (never resolved yet)
  expect(getUserMedia).toHaveBeenCalledTimes(1);

  // fire two rapid retries while the first call is still pending
  await act(async () => {
    result.current.retryMediaAccess();
    result.current.retryMediaAccess();
  });

  // the re-entrancy guard must have blocked the second (and any retry)
  // acquisition while one was already in flight
  expect(getUserMedia).toHaveBeenCalledTimes(1);

  // resolve the outstanding call and let state settle cleanly
  await act(async () => {
    resolvers[0](fakeStream());
  });
  await waitFor(() => expect(result.current.streamReady).toBe(true));

  // now that the guard has cleared, a further retry is allowed to proceed
  await act(async () => {
    result.current.retryMediaAccess();
  });
  await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));

  // resolve the final acquisition too, so no promise is left dangling
  await act(async () => {
    resolvers[1](fakeStream());
  });
  await waitFor(() => expect(result.current.streamReady).toBe(true));
});

test("selectCamera requests the exact device and stops the previous stream's tracks", async () => {
  const { result } = renderHook(() => useMediaStream({ onStreamUpdated: jest.fn() } as any));
  await waitFor(() => expect(result.current.streamReady).toBe(true));

  const oldStream = result.current.stream as MediaStream;
  const oldTracks = oldStream.getTracks();

  const newStream = fakeStream();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(newStream);

  await act(async () => {
    result.current.selectCamera("cam2");
  });

  await waitFor(() => expect(result.current.stream).toBe(newStream));

  expect(navigator.mediaDevices.getUserMedia).toHaveBeenLastCalledWith(
    expect.objectContaining({
      video: expect.objectContaining({ deviceId: { exact: "cam2" } }),
    })
  );
  oldTracks.forEach((track) => expect(track.stop).toHaveBeenCalled());
});

test("selectMic requests the exact mic device and preserves a previously-selected camera", async () => {
  const { result } = renderHook(() => useMediaStream({ onStreamUpdated: jest.fn() } as any));
  await waitFor(() => expect(result.current.streamReady).toBe(true));

  // select a camera first so its id is remembered on the ref used by selectMic
  const camStream = fakeStream();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(camStream);
  await act(async () => {
    result.current.selectCamera("cam2");
  });
  await waitFor(() => expect(result.current.stream).toBe(camStream));

  const micStream = fakeStream();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(micStream);
  await act(async () => {
    result.current.selectMic("mic2");
  });
  await waitFor(() => expect(result.current.stream).toBe(micStream));

  expect(navigator.mediaDevices.getUserMedia).toHaveBeenLastCalledWith(
    expect.objectContaining({
      audio: expect.objectContaining({ deviceId: { exact: "mic2" } }),
      video: expect.objectContaining({ deviceId: { exact: "cam2" } }),
    })
  );
});

test("a device swap while video is toggled off leaves the new stream's video track disabled", async () => {
  const onStreamUpdated = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useMediaStream({ onStreamUpdated } as any));
  await waitFor(() => expect(result.current.streamReady).toBe(true));

  act(() => {
    result.current.toggleVideo();
  });
  await waitFor(() => expect(result.current.videoEnabled).toBe(false));

  const newStream = fakeStream();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(newStream);

  await act(async () => {
    result.current.selectCamera("cam2");
  });

  await waitFor(() => expect(result.current.stream).toBe(newStream));
  expect((newStream.getVideoTracks()[0] as any).enabled).toBe(false);
});

test("onStreamUpdated is invoked with the new stream during a device swap", async () => {
  const onStreamUpdated = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useMediaStream({ onStreamUpdated } as any));
  await waitFor(() => expect(result.current.streamReady).toBe(true));

  const newStream = fakeStream();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(newStream);

  await act(async () => {
    result.current.selectMic("mic2");
  });

  await waitFor(() => expect(result.current.stream).toBe(newStream));
  expect(onStreamUpdated).toHaveBeenCalledWith(newStream);
});
