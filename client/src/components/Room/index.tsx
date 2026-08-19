import React, { useEffect, useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Room from "./Room";
import GreenRoom from "./GreenRoom";

import useAuthUser from "../../hooks/useAuthUser";
import useMediaStream from "./useMediaStream";
import usePeerConnection from "./usePeerConnection";
import useRoomState, { Participant } from "./useRoomState";
import useSocket from "../../services/useSocket";

interface LocationState {
  isHost?: boolean;
  friendlyName?: string;
}

const RoomContainer: React.FC = () => {
  const { userInfo, clerkUser } = useAuthUser();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [roomName] = useState<string | undefined>(state?.friendlyName);
  const [phase, setPhase] = useState<"green-room" | "in-call">("green-room");

  // stable identity: the clerk user id. DirectRoomJoin guarantees we're
  // authenticated before this component renders.
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

  // Callbacks for peer connection events
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
    toggleVideo: togglePeerVideo,
    toggleAudio: togglePeerAudio,
    updateLocalStream,
    resetAllPeers,
  } = usePeerConnection({
    socket,
    userId: localUserId,
    roomId: roomId || "",
    onStreamAdded: handleStreamAdded,
    onStreamRemoved: handleStreamRemoved,
    onConnectionStateChange: handleConnectionStateChange,
  });

  const {
    audioEnabled,
    devices,
    localVideoRef,
    permissionError,
    retryMediaAccess,
    retryVideoAccess,
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
  } = useMediaStream({
    roomId,
    socket,
    userPicture: localPicture,
    onStreamUpdated: updateLocalStream
  });

  // A ref, not a closure: keeps emitJoinRoom's identity stable so toggling mic/cam doesn't re-register the socket effect's listeners. Refreshed every render.
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

  // Reset join flag when room changes
  useEffect(() => {
    hasJoinedRef.current = false;
  }, [roomId]);

  // Join once past the green room, when socket + stream are ready and no permission error.
  useEffect(() => {
    if (phase === "in-call" && socket && roomId && localUserId && streamReady && stream && setLocalStream && !hasJoinedRef.current && !permissionError) {
      setLocalStream(stream);

      emitJoinRoom();

      hasJoinedRef.current = true;
      setIsConnecting(true);
    }
  }, [phase, socket, roomId, localUserId, streamReady, stream, setLocalStream, setIsConnecting, permissionError, emitJoinRoom]);

  // Handle socket events
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

    // Socket.IO does NOT auto-reconnect after a middleware (auth) rejection —
    // a token hiccup at reconnect time would otherwise freeze the room with
    // no signal. Retry a bounded number of times before giving up.
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


  // Handle local video toggle
  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    togglePeerVideo(!videoEnabled);

    // Emit to other users
    if (socket && roomId) {
      socket.emit("toggleVideo", {
        videoEnabled: !videoEnabled,
      });
    }
  }, [toggleVideo, togglePeerVideo, videoEnabled, socket, roomId]);

  // Handle local audio toggle
  const handleToggleAudio = useCallback(() => {
    toggleAudio();
    togglePeerAudio(!audioEnabled);

    // Emit to other users
    if (socket && roomId) {
      socket.emit("toggleAudio", {
        audioEnabled: !audioEnabled,
      });
    }
  }, [toggleAudio, togglePeerAudio, audioEnabled, socket, roomId]);

  const handleLeaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit("leaveRoom");
    }
    resetAllPeers();
    // Navigating away unmounts RoomContainer, which stops the local tracks.
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
      />
    );
  }

  return (
    <Room
      audioEnabled={audioEnabled}
      localStream={stream}
      localUserId={localUserId}
      localUsername={localUsername}
      localVideoEnabled={videoEnabled}
      localVideoRef={localVideoRef}
      participants={participants}
      profilePicture={localPicture}
      retryVideoAccess={retryVideoAccess}
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
      username={localUsername}
      socket={socket}
    />
  );
};

export default RoomContainer;
