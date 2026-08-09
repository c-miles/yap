import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

interface LocationState {
  isHost?: boolean;
}

export interface Participant {
  userId: string;
  username: string;
  profilePicture?: string;
  mediaState: {
    video: boolean;
    audio: boolean;
  };
  stream?: MediaStream;
  connectionState?: RTCPeerConnectionState;
}

export default function useRoomState() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const isHost = state?.isHost || false;

  // Track all participants in the room
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  // Add a participant
  const addParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      updated.set(participant.userId, participant);
      return updated;
    });
  }, []);

  // Remove a participant
  const removeParticipant = useCallback((userId: string) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  }, []);

  // Update participant media state
  const updateParticipantMediaState = useCallback((userId: string, mediaState: Partial<Participant['mediaState']>) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      const participant = updated.get(userId);
      if (participant) {
        updated.set(userId, {
          ...participant,
          mediaState: { ...participant.mediaState, ...mediaState }
        });
      }
      return updated;
    });
  }, []);

  // Update participant stream
  const updateParticipantStream = useCallback((userId: string, stream: MediaStream | undefined) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      const participant = updated.get(userId);
      if (participant) {
        updated.set(userId, { ...participant, stream });
      }
      return updated;
    });
  }, []);

  // Update participant connection state
  const updateParticipantConnectionState = useCallback((userId: string, connectionState: RTCPeerConnectionState) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      const participant = updated.get(userId);
      if (participant) {
        updated.set(userId, { ...participant, connectionState });
      }
      return updated;
    });
  }, []);

  // bulk set (initial load + rejoin) — keep live streams so a rejoin
  // doesn't blank out healthy tiles
  const setMultipleParticipants = useCallback((participantsList: Participant[]) => {
    setParticipants((prev) => {
      const newMap = new Map<string, Participant>();
      participantsList.forEach((p) => {
        const existing = prev.get(p.userId);
        newMap.set(p.userId, existing ? { ...p, stream: existing.stream, connectionState: existing.connectionState } : p);
      });
      return newMap;
    });
  }, []);

  return {
    isHost,
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
  };
}