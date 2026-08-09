import React, { useEffect, useCallback, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Room from "./Room";

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
  const { userInfo } = useAuthUser();
  const socket = useSocket();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [roomName] = useState<string | undefined>(state?.friendlyName);

  const {
    roomId,
    userIdRef,
    usernameRef,
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
  } = useRoomState(userInfo?.username);

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
    userId: userIdRef.current,
    roomId: roomId || "",
    onStreamAdded: handleStreamAdded,
    onStreamRemoved: handleStreamRemoved,
    onConnectionStateChange: handleConnectionStateChange,
  });

  const {
    audioEnabled,
    localVideoRef,
    permissionError,
    retryMediaAccess,
    retryVideoAccess,
    setVideoPermissionError,
    stream,
    streamReady,
    toggleAudio,
    toggleVideo,
    videoEnabled,
    videoPermissionError,
  } = useMediaStream({ 
    roomId, 
    socket, 
    userPicture: userInfo?.picture,
    onStreamUpdated: updateLocalStream 
  });

  const emitJoinRoom = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("joinRoom", {
      roomId,
      userId: userIdRef.current,
      username: usernameRef.current || userInfo?.username || "Anonymous",
      profilePicture: userInfo?.picture,
    });
  }, [socket, roomId, userIdRef, usernameRef, userInfo]);

  const hasJoinedRef = useRef(false);

  // Reset join flag when room changes
  useEffect(() => {
    hasJoinedRef.current = false;
  }, [roomId]);

  // Join room when socket and stream are ready (and no permission error)
  useEffect(() => {
    if (socket && roomId && userIdRef.current && streamReady && stream && setLocalStream && !hasJoinedRef.current && !permissionError) {
      // Set local stream in peer connection manager
      setLocalStream(stream);

      emitJoinRoom();

      hasJoinedRef.current = true;
      setIsConnecting(true);
    }
  }, [socket, roomId, userIdRef, streamReady, stream, setLocalStream, setIsConnecting, permissionError, emitJoinRoom]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // manager-level "reconnect" fires only on true RE-connections, never the
    // first connect — so the initial (buffered) join can't double-fire
    const handleReconnect = () => {
      if (hasJoinedRef.current) {
        // our old pcs are zombies (server forgot us) — reset so both sides build fresh
        resetAllPeers();
        emitJoinRoom();
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

    socket.io.on("reconnect", handleReconnect);
    socket.on("currentParticipants", handleCurrentParticipants);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("participantVideoToggled", handleVideoToggled);
    socket.on("participantAudioToggled", handleAudioToggled);
    socket.on("error", handleError);

    return () => {
      socket.io.off("reconnect", handleReconnect);
      socket.off("currentParticipants", handleCurrentParticipants);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("participantVideoToggled", handleVideoToggled);
      socket.off("participantAudioToggled", handleAudioToggled);
      socket.off("error", handleError);
    };
  }, [socket, stream, emitJoinRoom, setMultipleParticipants, addParticipant, removeParticipant, updateParticipantMediaState, connectToPeer, disconnectFromPeer, setRoomError, setIsConnecting, setLocalStream, resetAllPeers]);


  // Handle local video toggle
  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    togglePeerVideo(!videoEnabled);

    // Emit to other users
    if (socket && roomId) {
      socket.emit("toggleVideo", {
        roomId,
        userId: userIdRef.current,
        videoEnabled: !videoEnabled,
      });
    }
  }, [toggleVideo, togglePeerVideo, videoEnabled, socket, roomId, userIdRef]);

  // Handle local audio toggle
  const handleToggleAudio = useCallback(() => {
    toggleAudio();
    togglePeerAudio(!audioEnabled);

    // Emit to other users
    if (socket && roomId) {
      socket.emit("toggleAudio", {
        roomId,
        userId: userIdRef.current,
        audioEnabled: !audioEnabled,
      });
    }
  }, [toggleAudio, togglePeerAudio, audioEnabled, socket, roomId, userIdRef]);

  // Handle leaving room
  const handleLeaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit("leaveRoom", {
        roomId,
        userId: userIdRef.current,
      });
    }

    // Reset join flag for next room
    hasJoinedRef.current = false;

    // Navigate back to dashboard
    window.location.href = "/dashboard";
  }, [socket, roomId, userIdRef]);

  return (
    <Room
      audioEnabled={audioEnabled}
      localStream={stream}
      localUserId={userIdRef.current}
      localUsername={usernameRef.current || userInfo?.username || "Anonymous"}
      localVideoEnabled={videoEnabled}
      localVideoRef={localVideoRef}
      participants={participants}
      permissionError={permissionError}
      profilePicture={userInfo?.picture}
      retryMediaAccess={retryMediaAccess}
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
      username={userInfo?.username}
      socket={socket}
    />
  );
};

export default RoomContainer;