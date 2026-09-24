import React from "react";
import { PeerVideoStats, VideoStatsSnapshot } from "./videoStats";

interface VideoStatsOverlayProps {
  snapshot: VideoStatsSnapshot | null;
  names: Map<string, string>;
}

function describe(peer: PeerVideoStats): string {
  const request =
    peer.requestedHeight === 0 ? "paused" : peer.requestedHeight ? `asked ${peer.requestedHeight}p` : null;
  return [
    peer.width && peer.height ? `${peer.width}×${peer.height} @ ${peer.fps ?? 0}fps` : "no frames",
    peer.kbps !== undefined ? `${peer.kbps} kbps` : null,
    peer.codec ? `${peer.codec}${peer.encoder ? ` (${peer.encoder})` : ""}` : null,
    peer.limitation,
    request,
  ]
    .filter(Boolean)
    .join(" · ");
}

const VideoStatsOverlay: React.FC<VideoStatsOverlayProps> = ({ snapshot, names }) => (
  <div className="fixed left-3 top-16 z-toast max-w-[calc(100vw-1.5rem)] rounded-lg bg-[rgb(15_23_42_/_0.85)] px-3 py-2 font-mono text-xs text-text-secondary pointer-events-none">
    {snapshot ? (
      <>
        <div className="text-text">
          {`${snapshot.peerCount} ${snapshot.peerCount === 1 ? "peer" : "peers"} · step-down ${snapshot.stepDown}`}
        </div>
        <ul className="mt-1 space-y-0.5">
          {snapshot.peers.map((peer) => (
            <li key={peer.userId}>{`${names.get(peer.userId) ?? peer.userId} · ${describe(peer)}`}</li>
          ))}
        </ul>
      </>
    ) : (
      "Collecting stats…"
    )}
  </div>
);

export default VideoStatsOverlay;
