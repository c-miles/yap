import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import VideoStatsOverlay from "./VideoStatsOverlay";

const names = new Map([["a", "alex"]]);

test("shows what we're sending each peer and why it's limited", () => {
  render(
    <VideoStatsOverlay
      names={names}
      snapshot={{
        peerCount: 1,
        stepDown: 0,
        peers: [
          {
            userId: "a",
            width: 960,
            height: 540,
            fps: 30,
            kbps: 980,
            codec: "H264",
            encoder: "VideoToolbox",
            limitation: "cpu",
            requestedHeight: 540,
            bytesSent: 1,
            timestamp: 1,
          },
        ],
      }}
    />
  );

  expect(screen.getByText(/1 peer · step-down 0/)).toBeInTheDocument();
  const row = screen.getByText(/alex/);
  expect(row).toHaveTextContent("960×540 @ 30fps");
  expect(row).toHaveTextContent("980 kbps");
  expect(row).toHaveTextContent("H264 (VideoToolbox)");
  expect(row).toHaveTextContent("cpu");
  expect(row).toHaveTextContent("asked 540p");
});

test("shows a paused stream when the viewer's tab is hidden", () => {
  render(
    <VideoStatsOverlay
      names={names}
      snapshot={{ peerCount: 1, stepDown: 0, peers: [{ userId: "a", requestedHeight: 0, bytesSent: 1, timestamp: 1 }] }}
    />
  );

  expect(screen.getByText(/alex/)).toHaveTextContent("paused");
});

test("waits for the first sample", () => {
  render(<VideoStatsOverlay names={names} snapshot={null} />);
  expect(screen.getByText("Collecting stats…")).toBeInTheDocument();
});
