import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GreenRoom from "./GreenRoom";

const base = {
  stream: null, streamReady: true, permissionError: null,
  audioEnabled: true, videoEnabled: true,
  toggleAudio: jest.fn(), toggleVideo: jest.fn(),
  devices: { cameras: [{ kind: "videoinput", deviceId: "cam1", label: "Cam 1" } as MediaDeviceInfo],
             mics: [{ kind: "audioinput", deviceId: "mic1", label: "Mic 1" } as MediaDeviceInfo] },
  selectCamera: jest.fn(), selectMic: jest.fn(),
  onRetry: jest.fn(), onJoin: jest.fn(),
};

test("Join fires onJoin when ready", () => {
  render(<GreenRoom {...base} />);
  fireEvent.click(screen.getByRole("button", { name: /join/i }));
  expect(base.onJoin).toHaveBeenCalled();
});

test("denied permission shows a retry affordance and no Join", () => {
  render(<GreenRoom {...base} streamReady={false} permissionError="denied" />);
  expect(screen.getByRole("button", { name: /(try again|retry|allow)/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^join$/i })).toBeNull();
});

test("device dropdowns list options and fire selection", () => {
  render(<GreenRoom {...base} />);
  fireEvent.change(screen.getByLabelText(/camera/i), { target: { value: "cam1" } });
  expect(base.selectCamera).toHaveBeenCalledWith("cam1");
});

test("video disabled shows 'Camera off' and renders no video preview", () => {
  const stream = { getAudioTracks: () => [] } as unknown as MediaStream;
  render(<GreenRoom {...base} stream={stream} videoEnabled={false} />);
  expect(screen.getByText(/camera off/i)).toBeInTheDocument();
  expect(document.querySelector("video")).toBeNull();
});
