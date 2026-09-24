import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";

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

  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const addParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      updated.set(participant.userId, participant);
      return updated;
    });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  }, []);

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