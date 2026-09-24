import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { PeerConnectionCallbacks, PeerConnectionManager } from "./PeerConnectionManager";

interface UsePeerConnectionProps extends PeerConnectionCallbacks {
  socket: Socket | null;
  userId: string;
  roomId: string;
}

export default function usePeerConnection({
  socket,
  userId,
  roomId,
  onStreamAdded,
  onStreamRemoved,
  onConnectionStateChange,
  onVideoStats,
}: UsePeerConnectionProps) {
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);

  // the manager outlives renders, so it calls through this ref to reach the latest callbacks
  const callbacksRef = useRef<PeerConnectionCallbacks>({
    onStreamAdded,
    onStreamRemoved,
    onConnectionStateChange,
    onVideoStats,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStreamAdded,
      onStreamRemoved,
      onConnectionStateChange,
      onVideoStats,
    };
  }, [onStreamAdded, onStreamRemoved, onConnectionStateChange, onVideoStats]);

  useEffect(() => {
    if (!socket || !userId || !roomId) return;

    if (peerManagerRef.current) {
      return;
    }

    peerManagerRef.current = new PeerConnectionManager(socket, userId, {
      onStreamAdded: (id, stream) => callbacksRef.current.onStreamAdded(id, stream),
      onStreamRemoved: (id) => callbacksRef.current.onStreamRemoved(id),
      onConnectionStateChange: (id, state) => callbacksRef.current.onConnectionStateChange(id, state),
      onVideoStats: (snapshot) => callbacksRef.current.onVideoStats?.(snapshot),
    });

    return () => {
      peerManagerRef.current?.cleanup();
      peerManagerRef.current = null;
    };
  }, [socket, userId, roomId]);

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

  const disconnectFromPeer = useCallback((userId: string) => {
    peerManagerRef.current?.removePeer(userId);
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    peerManagerRef.current?.toggleVideo(enabled);
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    peerManagerRef.current?.toggleAudio(enabled);
  }, []);

  // for switching cameras or microphones mid-call
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
