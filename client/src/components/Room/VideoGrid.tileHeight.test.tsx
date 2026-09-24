import React from "react";
import { render } from "@testing-library/react";
import VideoGrid from "./VideoGrid";
import { Participant } from "./useRoomState";

jest.mock("./useContainerSize", () => ({
  useContainerSize: () => ({ ref: { current: null }, size: { width: 1280, height: 720 } }),
}));

test("reports the height of its tiles", () => {
  const onTileHeightChange = jest.fn();
  const participants = new Map<string, Participant>([
    ["remote-1", { userId: "remote-1", username: "remote", mediaState: { video: false, audio: true } } as Participant],
  ]);

  render(
    <VideoGrid
      localStream={null}
      localUserId="me"
      localUsername="me"
      localVideoEnabled={false}
      localAudioEnabled={true}
      participants={participants}
      onTileHeightChange={onTileHeightChange}
    />
  );

  const [height] = onTileHeightChange.mock.calls[onTileHeightChange.mock.calls.length - 1];
  expect(height).toBeGreaterThan(0);
  expect(height).toBeLessThanOrEqual(720);
});
