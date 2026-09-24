import React, { useEffect } from "react";
import { MicOff } from "lucide-react";
import { Icon } from "../atoms";
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
  onTileHeightChange?: (height: number) => void;
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
  // callback ref: this <video> mounts late (once a track exists) without the stream
  // changing, so a [stream] effect would miss it
  const attachStream = React.useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    },
    [stream]
  );

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
      aria-label={`${username}${isLocal ? ' (you)' : ''}, ${videoEnabled ? 'video on' : 'video off'}, ${audioEnabled ? 'audio on' : 'audio off'}`}
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
            <span className="muted-indicator" title="Microphone muted">
              <Icon icon={MicOff} size="sm" />
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
  profilePicture,
  onTileHeightChange
}) => {
  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>();

  // join order: Map keeps insertion order
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

  useEffect(() => {
    onTileHeightChange?.(layout.tileHeight);
  }, [layout.tileHeight, onTileHeightChange]);

  // explicit columns so a resize can't reflow tiles into a stack, and a flat
  // list so no tile remounts and re-attaches its video
  const gridStyle = {
    gridTemplateColumns: `repeat(${layout.cols}, ${layout.tileWidth}px)`,
    gap: `${GRID_GAP}px`,
  };
  const tileStyle = { width: layout.tileWidth, height: layout.tileHeight };

  // Center a lone trailing tile (e.g. 3 people fill a 2x2 with one in the last
  // row); the grid would otherwise pin it to the left. Multi-tile short rows
  // stay left-aligned.
  const lastRowStart = (layout.rows - 1) * layout.cols;
  const lastRowCount = count - lastRowStart;
  const loneTileOffset =
    layout.rows > 1 && lastRowCount === 1
      ? ((layout.cols - 1) * (layout.tileWidth + GRID_GAP)) / 2
      : 0;

  return (
    <div className="video-grid-container" ref={containerRef}>
      <div className="video-grid" style={gridStyle}>
        {allParticipants.map((participant, i) => (
          <VideoElement
            key={participant.userId}
            style={i === lastRowStart && loneTileOffset ? { ...tileStyle, marginLeft: loneTileOffset } : tileStyle}
            {...participant}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
