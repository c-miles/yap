import React from "react";
import { render } from "@testing-library/react";
import VideoGrid from "./VideoGrid";
import { Participant } from "./useRoomState";

// Minimal MediaStream stand-in; jsdom has no real MediaStream, and the
// component only calls getVideoTracks() and identity-compares the object.
function fakeStream(withVideo: boolean) {
  const tracks = withVideo ? [{ kind: "video", enabled: true }] : [];
  return {
    getVideoTracks: () => tracks,
    getTracks: () => tracks,
    addVideoTrack() {
      tracks.push({ kind: "video", enabled: true });
    },
  } as unknown as MediaStream & { addVideoTrack: () => void };
}

function participant(stream: MediaStream): Map<string, Participant> {
  return new Map([
    [
      "remote-1",
      {
        userId: "remote-1",
        username: "remote",
        mediaState: { video: true, audio: true },
        stream,
      } as Participant,
    ],
  ]);
}

const baseProps = {
  localStream: null,
  localUserId: "local-1",
  localUsername: "me",
  localVideoEnabled: false,
  localAudioEnabled: true,
  profilePicture: undefined,
  isMobile: false,
};

test("attaches srcObject when the video element mounts with a video-bearing stream", () => {
  const stream = fakeStream(true);
  const { container } = render(<VideoGrid {...baseProps} participants={participant(stream)} />);
  const video = container.querySelector('[data-user-id="remote-1"] video') as HTMLVideoElement;
  expect(video).not.toBeNull();
  expect(video.srcObject).toBe(stream);
});

test("attaches srcObject when the video track arrives AFTER the stream was already rendered", () => {
  // Reproduces the real bug: same stream object, video track added later,
  // <video> mounts on the re-render — srcObject must still be attached.
  const stream = fakeStream(false);
  const { container, rerender } = render(<VideoGrid {...baseProps} participants={participant(stream)} />);
  expect(container.querySelector('[data-user-id="remote-1"] video')).toBeNull(); // placeholder while audio-only

  (stream as any).addVideoTrack();
  rerender(<VideoGrid {...baseProps} participants={participant(stream)} />);

  const video = container.querySelector('[data-user-id="remote-1"] video') as HTMLVideoElement;
  expect(video).not.toBeNull();
  expect(video.srcObject).toBe(stream);
});
