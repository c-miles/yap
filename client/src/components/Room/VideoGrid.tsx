import React from "react";
import { VolumeX } from "lucide-react";
import { Participant } from "./useRoomState";
import "./VideoGrid.css";

interface VideoGridProps {
  localStream: MediaStream | null;
  localUserId: string;
  localUsername: string;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  participants: Map<string, Participant>;
  profilePicture?: string;
  isMobile: boolean;
}

interface VideoElementProps {
  stream: MediaStream | null;
  userId: string;
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  profilePicture?: string;
  isLocal: boolean;
}

const VideoElement: React.FC<VideoElementProps> = ({
  stream,
  userId,
  username,
  videoEnabled,
  audioEnabled,
  profilePicture,
  isLocal
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
      data-user-id={userId}
      role="img"
      aria-label={`${username}${isLocal ? ' (you)' : ''} - ${videoEnabled ? 'Video on' : 'Video off'}, ${audioEnabled ? 'Audio on' : 'Audio off'}`}
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
  profilePicture,
  isMobile
}) => {
  // Calculate total participants
  const totalParticipants = participants.size + 1;

  // Convert participants to array and sort
  const participantArray = Array.from(participants.values()).sort((a, b) =>
    a.userId.localeCompare(b.userId)
  );

  // Create unified participant list
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
    ...participantArray.map(p => ({
      stream: p.stream || null,
      userId: p.userId,
      username: p.username,
      videoEnabled: p.mediaState.video,
      audioEnabled: p.mediaState.audio,
      profilePicture: p.profilePicture,
      isLocal: false
    }))
  ];

  return (
    <div className="video-grid-container">
      <div
        className="video-grid"
        data-count={totalParticipants}
        data-mobile={isMobile}
      >
        {allParticipants.map((participant) => (
          <VideoElement key={participant.userId} {...participant} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
