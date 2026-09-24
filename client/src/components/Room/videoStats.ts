export interface SenderStats {
  width?: number;
  height?: number;
  fps?: number;
  kbps?: number;
  limitation?: string;
  codec?: string;
  encoder?: string;
  availableKbps?: number;
  bytesSent: number;
  timestamp: number;
}

export interface PeerVideoStats extends SenderStats {
  userId: string;
  requestedHeight?: number;
}

export interface VideoStatsSnapshot {
  peerCount: number;
  stepDown: number;
  peers: PeerVideoStats[];
}

export function readSenderStats(report: RTCStatsReport, previous?: SenderStats): SenderStats | null {
  const entries: any[] = [];
  report.forEach((entry) => entries.push(entry));
  const byId = (id?: string) => entries.find((entry) => entry.id === id);

  const outbound = entries.find((entry) => entry.type === "outbound-rtp" && entry.kind === "video");
  if (!outbound) return null;
  const transport = entries.find((entry) => entry.type === "transport");
  const pair = byId(transport?.selectedCandidatePairId);
  const elapsedMs = previous ? outbound.timestamp - previous.timestamp : 0;

  return {
    width: outbound.frameWidth,
    height: outbound.frameHeight,
    fps: outbound.framesPerSecond,
    kbps: previous && elapsedMs > 0 ? Math.round(((outbound.bytesSent - previous.bytesSent) * 8) / elapsedMs) : undefined,
    limitation: outbound.qualityLimitationReason,
    codec: byId(outbound.codecId)?.mimeType?.replace("video/", ""),
    encoder: outbound.encoderImplementation,
    availableKbps: pair?.availableOutgoingBitrate ? Math.round(pair.availableOutgoingBitrate / 1000) : undefined,
    bytesSent: outbound.bytesSent,
    timestamp: outbound.timestamp,
  };
}
