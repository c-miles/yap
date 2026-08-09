import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { PeerConnectionManager } from "./PeerConnectionManager";

// MediaConstraints interface removed as it's not being used

interface UsePeerConnectionProps {
  socket: Socket | null;
  userId: string;
  roomId: string;
  onStreamAdded: (userId: string, stream: MediaStream) => void;
  onStreamRemoved: (userId: string) => void;
  onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void;
}

export default function usePeerConnection({
  socket,
  userId,
  roomId,
  onStreamAdded,
  onStreamRemoved,
  onConnectionStateChange
}: UsePeerConnectionProps) {
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);

  // Store callbacks in refs to avoid recreating PeerConnectionManager
  const callbacksRef = useRef({
    onStreamAdded,
    onStreamRemoved,
    onConnectionStateChange
  });

  // Update callback refs when they change
  useEffect(() => {
    callbacksRef.current = {
      onStreamAdded,
      onStreamRemoved,
      onConnectionStateChange
    };
  }, [onStreamAdded, onStreamRemoved, onConnectionStateChange]);

  // Initialize peer connection manager
  useEffect(() => {
    if (!socket || !userId || !roomId) return;

    // Only create if we don't have one already
    if (peerManagerRef.current) {
      return;
    }

    peerManagerRef.current = new PeerConnectionManager(
      socket,
      userId,
      roomId,
      callbacksRef.current
    );

    return () => {
      peerManagerRef.current?.cleanup();
      peerManagerRef.current = null;
    };
  }, [socket, userId, roomId]);

  // Set local stream
  const setLocalStream = useCallback((stream: MediaStream) => {
    if (!peerManagerRef.current) return;
    peerManagerRef.current.setLocalStream(stream);
  }, []);

  // initiating side only — answerers get their connection created lazily by handleOffer
  const connectToPeer = useCallback(async (targetUserId: string) => {
    if (!peerManagerRef.current) return;

    try {
      await peerManagerRef.current.createPeerConnection(targetUserId);
    } catch (error) {
      console.error(`Failed to connect to peer ${targetUserId}:`, error);
    }
  }, []);

  // Disconnect from a peer
  const disconnectFromPeer = useCallback((userId: string) => {
    peerManagerRef.current?.removePeer(userId);
  }, []);

  // Toggle video
  const toggleVideo = useCallback((enabled: boolean) => {
    peerManagerRef.current?.toggleVideo(enabled);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback((enabled: boolean) => {
    peerManagerRef.current?.toggleAudio(enabled);
  }, []);

  // Update local stream (for changing cameras/microphones)
  const updateLocalStream = useCallback(async (stream: MediaStream) => {
    await peerManagerRef.current?.updateLocalStream(stream);
  }, []);

  // socket reconnects orphan every pc (server forgot us) — start fresh
  const resetAllPeers = useCallback(() => {
    peerManagerRef.current?.removeAllPeers();
  }, []);

  return {
    setLocalStream,
    connectToPeer,
    disconnectFromPeer,
    toggleVideo,
    toggleAudio,
    updateLocalStream,
    resetAllPeers,
  };
}