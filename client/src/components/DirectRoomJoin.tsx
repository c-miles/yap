import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import useAuthUser from "../hooks/useAuthUser";
import { isValidRoomNameFormat } from "../utils/roomNameGenerator";
import RoomContainer from "./Room";
import { API_BASE_URL } from "../config";

const DirectRoomJoin: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useAuthUser();
  const [error, setError] = useState<string | null>(null);
  const [shouldRenderRoom, setShouldRenderRoom] = useState(false);

  // Check if this is a direct room navigation from Dashboard (has state)
  const hasState = location.state && (location.state as any).isHost !== undefined;

  useEffect(() => {
    const handleRoomJoin = async () => {
      // If this navigation came from Dashboard (has state), render room directly
      if (hasState) {
        setShouldRenderRoom(true);
        return;
      }

      // This is a direct link access, need to handle authentication and resolution
      // Wait for auth to be determined
      if (userInfo === null) return;

      // If not authenticated, redirect to login with return URL
      if (!userInfo) {
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/api/auth/login?returnTo=${returnUrl}`;
        return;
      }

      // Validate room ID format
      if (!roomId) {
        setError("Invalid room link");
        return;
      }

      try {
        // Check if it's a friendly name (adjective-color-word) or MongoDB ObjectId
        if (isValidRoomNameFormat(roomId)) {
          // It's a friendly name, resolve to actual room ID and get friendly name
          const response = await fetch(`${API_BASE_URL}/rooms/find-by-name/${roomId}`);
          if (!response.ok) {
            setError("Room not found or has expired");
            return;
          }
          const data = await response.json();
          
          // Update location state with room info and render room
          navigate(`/room/${data.roomId}`, {
            state: { isHost: false, fromDirectLink: true, friendlyName: data.friendlyName },
            replace: true
          });
        } else {
          // It's a direct room ID, just render the room
          setShouldRenderRoom(true);
        }
      } catch (err) {
        console.error("Error joining room:", err);
        setError("Unable to join room. Please try again.");
      }
    };

    handleRoomJoin();
  }, [roomId, userInfo, navigate, hasState]);

  // Render the actual room if we should
  if (shouldRenderRoom) {
    return <RoomContainer />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-2xl font-semibold text-red-500">
          {error}
        </h2>
        <p className="text-text-muted">
          The room may have ended or the link might be invalid.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <BeatLoader color="#64748b" />
      <h3 className="text-lg font-medium text-text">
        {userInfo === null ? "Checking authentication..." : "Joining room..."}
      </h3>
    </div>
  );
};

export default DirectRoomJoin;