import React, { useEffect, useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Room from "./Room";
import GreenRoom from "./GreenRoom";

import useAuthUser from "../../hooks/useAuthUser";
import useUsernameForm from "../../hooks/useUsernameForm";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useMediaStream from "./useMediaStream";
import usePeerConnection from "./usePeerConnection";
import VideoStatsOverlay from "./VideoStatsOverlay";
import { VideoStatsSnapshot } from "./videoStats";
import useRoomState, { Participant } from "./useRoomState";
import useSocket from "../../services/useSocket";

interface LocationState {
  friendlyName?: string;
}

const RoomContainer: React.FC = () => {
  const { userInfo, userExists, profileError, retryProfileLoad, clerkUser, handleUsernameSubmit } = useAuthUser();
  const usernameForm = useUsernameForm(handleUsernameSubmit);
  const profileStatus = userExists !== null ? "ready" : profileError ? "error" : "loading";
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [roomName] = useState<string | undefined>(state?.friendlyName);
  useDocumentTitle(roomName ?? "Video room");
  const [phase, setPhase] = useState<"green-room" | "in-call">("green-room");
  const showStats = new URLSearchParams(location.search).has("stats");
  const [videoStats, setVideoStats] = useState<VideoStatsSnapshot | null>(null);

  // DirectRoomJoin only renders this once signed in
  const localUserId = clerkUser?.id ?? "";
  const localUsername = userInfo?.username || clerkUser?.username || clerkUser?.firstName || "Guest";
  const localPicture = userInfo?.picture ?? clerkUser?.imageUrl;

  const {
    roomId,
    participants,
    roomError,
    isConnecting,
    setRoomError,
    setIsConnecting,
    addParticipant,
    removeParticipant,
    updateParticipantMediaState,
    updateParticipantStream,
    updateParticipantConnectionState,
    setMultipleParticipants,
  } = useRoomState();

  const handleStreamAdded = useCallback((userId: string, stream: MediaStream) => {
    updateParticipantStream(userId, stream);
  }, [updateParticipantStream]);

  const handleStreamRemoved = useCallback((userId: string) => {
    const participant = participants.get(userId);
    if (participant) {
      updateParticipantStream(userId, undefined);
    }
  }, [participants, updateParticipantStream]);

  const handleConnectionStateChange = useCallback((userId: string, state: RTCPeerConnectionState) => {
    updateParticipantConnectionState(userId, state);
  }, [updateParticipantConnectionState]);

  const {
    setLocalStream,
    connectToPeer,
    disconnectFromPeer,
    updateLocalStream,
    resetAllPeers,
  } = usePeerConnection({
    socket,
    userId: localUserId,
    roomId: roomId || "",
    onStreamAdded: handleStreamAdded,
    onStreamRemoved: handleStreamRemoved,
    onConnectionStateChange: handleConnectionStateChange,
    onVideoStats: showStats ? setVideoStats : undefined,
  });

  const {
    audioEnabled,
    devices,
    permissionError,
    retryMediaAccess,
    selectCamera,
    selectedCameraId,
    selectedMicId,
    selectMic,
    setVideoPermissionError,
    stream,
    streamReady,
    toggleAudio,
    toggleVideo,
    videoEnabled,
    videoPermissionError,
    deviceSwitchError,
  } = useMediaStream({ onStreamUpdated: updateLocalStream });

  // a ref keeps emitJoinRoom stable, so mic/cam toggles don't re-register the socket listeners
  const mediaStateRef = useRef({ video: videoEnabled, audio: audioEnabled });
  mediaStateRef.current = { video: videoEnabled, audio: audioEnabled };

  const emitJoinRoom = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("joinRoom", {
      roomId,
      username: localUsername,
      profilePicture: localPicture,
      mediaState: mediaStateRef.current,
    });
  }, [socket, roomId, localUsername, localPicture]);

  const hasJoinedRef = useRef(false);

  useEffect(() => {
    hasJoinedRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (phase === "in-call" && socket && roomId && localUserId && streamReady && stream && setLocalStream && !hasJoinedRef.current && !permissionError) {
      setLocalStream(stream);

      emitJoinRoom();

      hasJoinedRef.current = true;
      setIsConnecting(true);
    }
  }, [phase, socket, roomId, localUserId, streamReady, stream, setLocalStream, setIsConnecting, permissionError, emitJoinRoom]);

  useEffect(() => {
    if (!socket) return;

    // manager-level "reconnect" fires only on true RE-connections, never the
    // first connect — so the initial (buffered) join can't double-fire
    let authRetries = 0;

    const handleReconnect = () => {
      // a successful reconnect means auth (if it was retried) went through
      authRetries = 0;
      if (hasJoinedRef.current) {
        // our old pcs are zombies (server forgot us) — reset so both sides build fresh
        resetAllPeers();
        emitJoinRoom();
      }
    };

    // socket.io won't reconnect on its own after an auth rejection, so retry a few times
    const handleConnectError = (err: Error) => {
      if (err.message === "unauthorized" && authRetries < 3) {
        authRetries += 1;
        setTimeout(() => socket.connect(), 1000 * authRetries);
      } else if (err.message === "unauthorized") {
        setRoomError("Lost your session. Please rejoin the room.");
      }
    };

    const handleCurrentParticipants = (participantsList: Participant[]) => {
      setMultipleParticipants(participantsList);
      setIsConnecting(false);

      // no peer connections here on purpose: each existing peer offers to us
      // via its userJoined handler and we just answer. one offerer per pair =
      // no initial glare (Chrome can wedge ICE gathering after a rolled-back offer).
      if (stream && setLocalStream) {
        setLocalStream(stream);
      }
    };

    const handleUserJoined = async (participant: Participant) => {
      // a rejoining user may not have gotten a userLeft for their old socket —
      // drop any stale connection first
      disconnectFromPeer(participant.userId);
      addParticipant(participant);

      if (stream && setLocalStream) {
        setLocalStream(stream);
        await connectToPeer(participant.userId);
      }
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      disconnectFromPeer(userId);
      removeParticipant(userId);
    };

    const handleVideoToggled = ({ userId, videoEnabled }: { userId: string; videoEnabled: boolean }) => {
      updateParticipantMediaState(userId, { video: videoEnabled });
    };

    const handleAudioToggled = ({ userId, audioEnabled }: { userId: string; audioEnabled: boolean }) => {
      updateParticipantMediaState(userId, { audio: audioEnabled });
    };

    const handleError = ({ message }: { message: string }) => {
      setRoomError(message);
      setIsConnecting(false);
    };

    const handleDisconnect = (reason: string) => {
      // the server kicks the older socket when this account joins elsewhere
      if (reason === "io server disconnect") {
        setRoomError("You joined this room from another tab or device.");
      }
    };

    socket.io.on("reconnect", handleReconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("currentParticipants", handleCurrentParticipants);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("participantVideoToggled", handleVideoToggled);
    socket.on("participantAudioToggled", handleAudioToggled);
    socket.on("error", handleError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.io.off("reconnect", handleReconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("currentParticipants", handleCurrentParticipants);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("participantVideoToggled", handleVideoToggled);
      socket.off("participantAudioToggled", handleAudioToggled);
      socket.off("error", handleError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, stream, emitJoinRoom, setMultipleParticipants, addParticipant, removeParticipant, updateParticipantMediaState, connectToPeer, disconnectFromPeer, setRoomError, setIsConnecting, setLocalStream, resetAllPeers]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();

    if (socket && roomId) {
      socket.emit("toggleVideo", {
        videoEnabled: !videoEnabled,
      });
    }
  }, [toggleVideo, videoEnabled, socket, roomId]);

  const handleToggleAudio = useCallback(() => {
    toggleAudio();

    if (socket && roomId) {
      socket.emit("toggleAudio", {
        audioEnabled: !audioEnabled,
      });
    }
  }, [toggleAudio, audioEnabled, socket, roomId]);

  const handleLeaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit("leaveRoom");
    }
    resetAllPeers();
    // unmounting RoomContainer stops the local tracks
    navigate("/dashboard");
  }, [socket, roomId, resetAllPeers, navigate]);

  if (phase === "green-room") {
    return (
      <GreenRoom
        stream={stream}
        streamReady={streamReady}
        permissionError={permissionError}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        devices={devices}
        selectedCameraId={selectedCameraId}
        selectedMicId={selectedMicId}
        selectCamera={selectCamera}
        selectMic={selectMic}
        deviceSwitchError={deviceSwitchError}
        onRetry={retryMediaAccess}
        roomName={roomName}
        onJoin={() => setPhase("in-call")}
        onCancel={() => navigate("/dashboard")}
        profileStatus={profileStatus}
        onRetryProfile={retryProfileLoad}
        usernameForm={profileStatus === "ready" && !userInfo?.username ? usernameForm : undefined}
      />
    );
  }

  return (
    <>
      <Room
        audioEnabled={audioEnabled}
        localStream={stream}
        localUserId={localUserId}
        localUsername={localUsername}
        localVideoEnabled={videoEnabled}
        participants={participants}
        profilePicture={localPicture}
        setVideoPermissionError={setVideoPermissionError}
        videoPermissionError={videoPermissionError}
        roomId={roomId}
        roomName={roomName}
        roomError={roomError}
        isConnecting={isConnecting}
        toggleAudio={handleToggleAudio}
        toggleVideo={handleToggleVideo}
        onLeaveRoom={handleLeaveRoom}
        onDashboard={() => navigate("/dashboard")}
        socket={socket}
      />
      {showStats && (
        <VideoStatsOverlay
          snapshot={videoStats}
          names={new Map(Array.from(participants.values()).map((p) => [p.userId, p.username]))}
        />
      )}
    </>
  );
};

export default RoomContainer;
