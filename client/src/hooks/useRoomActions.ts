import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/authFetch";
import { findRoom, FoundRoom } from "../services/rooms";
import { normalizeRoomName } from "../utils/roomName";

const useRoomActions = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");

  const createRoom = async () => {
    setIsCreating(true);
    setCreateError("");
    try {
      const response = await authFetch("/rooms/create", { method: "POST" });
      if (!response.ok) {
        throw new Error(`create failed with ${response.status}`);
      }
      const room: FoundRoom = await response.json();
      navigate(`/room/${room.roomId}`, {
        state: { friendlyName: room.friendlyName },
      });
    } catch (error) {
      console.error("Error creating room:", error);
      setCreateError("Couldn't start a room. Try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (input: string) => {
    const nameOrId = normalizeRoomName(input);
    if (!nameOrId) {
      setJoinError("Enter a room name.");
      return;
    }
    setIsJoining(true);
    setJoinError("");
    try {
      const room = await findRoom(nameOrId);
      if (!room) {
        setJoinError("Room not found. Check the name and try again.");
        return;
      }
      navigate(`/room/${room.roomId}`, {
        state: { friendlyName: room.friendlyName },
      });
    } catch (error) {
      console.error("Error joining room:", error);
      setJoinError("Couldn't join right now. Try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const clearJoinError = () => setJoinError("");

  return { createRoom, joinRoom, isCreating, isJoining, createError, joinError, clearJoinError };
};

export type RoomActions = ReturnType<typeof useRoomActions>;

export default useRoomActions;
