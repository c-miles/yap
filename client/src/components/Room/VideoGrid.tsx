import React from "react";
import { VolumeX } from "lucide-react";
import { Participant } from "./useRoomState";
import { useContainerSize } from "./useContainerSize";
import { chooseAspectRatio, computeGridLayout } from "./gridLayout";
import "./VideoGrid.css";

const MAX_TILE_WIDTH = 960;
const GRID_GAP = 12;

interface VideoGridProps {
  localStream: MediaStream | null;
  localUserId: string;
  localUsername: string;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  participants: Map<string, Participant>;
  profilePicture?: string;
}

interface VideoElementProps {
  stream: MediaStream | null;
  userId: string;
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  profilePicture?: string;
  isLocal: boolean;
  connectionState?: RTCPeerConnectionState;
  style?: React.CSSProperties;
}

const CONNECTION_LABELS: Partial<Record<RTCPeerConnectionState, string>> = {
  new: "connecting…",
  connecting: "connecting…",
  disconnected: "reconnecting…",
  failed: "connection lost",
  closed: "connection lost",
};

const VideoElement: React.FC<VideoElementProps> = ({
  stream,
  userId,
  username,
  videoEnabled,
  audioEnabled,
  profilePicture,
  isLocal,
  connectionState,
  style
}) => {
  // callback ref on purpose: this <video> mounts late (only once a video track
  // exists), usually without the stream ref changing — an effect keyed on
  // [stream] would miss the mount and leave the element unattached.
  const attachStream = React.useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    },
    [stream]
  );

  // Check if video is actually enabled
  const hasActiveVideo = stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some(track => track.enabled) &&
    videoEnabled;

  return (
    <div
      className="video-element"
      style={style}
      data-user-id={userId}
      role="group"
      aria-label={`${username}${isLocal ? ' (you)' : ''} — ${videoEnabled ? 'video on' : 'video off'}, ${audioEnabled ? 'audio on' : 'audio off'}`}
    >
      {hasActiveVideo ? (
        <video
          ref={attachStream}
          autoPlay
          playsInline
          muted={isLocal}
          className="video-stream"
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : (
        <div className="video-placeholder" aria-hidden="true">
          {profilePicture ? (
            <img src={profilePicture} alt="" className="profile-picture" />
          ) : (
            <div className="avatar-placeholder">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {!isLocal && connectionState && CONNECTION_LABELS[connectionState] && (
        <span className="connection-pill">{CONNECTION_LABELS[connectionState]}</span>
      )}

      <div className="video-overlay" aria-hidden="true">
        <span className="username">
          {username}{isLocal ? ' (You)' : ''}
        </span>
        <div className="media-indicators">
          {!audioEnabled && (
            <span
              className="muted-indicator"
              title="Microphone muted"
              aria-label="Muted"
            >
              <VolumeX size={18} className="text-red-400" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  localUserId,
  localUsername,
  localVideoEnabled,
  localAudioEnabled,
  participants,
  profilePicture
}) => {
  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>();

  // Create unified participant list with join order (Map insertion order is stable)
  const allParticipants = [
    {
      stream: localStream,
      userId: localUserId,
      username: localUsername,
      videoEnabled: localVideoEnabled,
      audioEnabled: localAudioEnabled,
      profilePicture: profilePicture,
      isLocal: true
    },
    ...Array.from(participants.values()).map(p => ({
      stream: p.stream || null,
      userId: p.userId,
      username: p.username,
      videoEnabled: p.mediaState.video,
      audioEnabled: p.mediaState.audio,
      profilePicture: p.profilePicture,
      isLocal: false,
      connectionState: p.connectionState
    }))
  ];

  const count = allParticipants.length;
  const aspectRatio = chooseAspectRatio(size.width, size.height);
  const layout = computeGridLayout(size.width, size.height, count, aspectRatio, GRID_GAP, MAX_TILE_WIDTH);

  // Pin the flex container to exactly `cols` tiles wide. Full rows fill it flush;
  // a short last row is centered by justify-content — the tiles stay a flat list
  // (never change parent), so no tile remounts and re-attaches its video on reflow.
  const rowWidth = layout.cols * layout.tileWidth + (layout.cols - 1) * GRID_GAP;
  const tileStyle = { width: layout.tileWidth, height: layout.tileHeight };

  return (
    <div className="video-grid-container" ref={containerRef}>
      <div className="video-grid" style={{ width: rowWidth, gap: `${GRID_GAP}px` }}>
        {allParticipants.map((participant) => (
          <VideoElement key={participant.userId} style={tileStyle} {...participant} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
