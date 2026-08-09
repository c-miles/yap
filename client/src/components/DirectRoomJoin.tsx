import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import { BeatLoader } from "react-spinners";
import { isValidRoomNameFormat } from "../utils/roomNameGenerator";
import RoomContainer from "./Room";
import { API_BASE_URL } from "../config";

const DirectRoomJoin: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [shouldRenderRoom, setShouldRenderRoom] = useState(false);

  // Check if this is a direct room navigation from Dashboard (has state)
  const hasState = location.state && (location.state as any).isHost !== undefined;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // used to point at /api/auth/login, a route this app never had —
      // logged-out visitors just spun forever
      const returnTo = `/room/${roomId ?? ""}`;
      clerk.redirectToSignIn({
        signInForceRedirectUrl: returnTo,
        signUpForceRedirectUrl: returnTo,
      });
      return;
    }

    if (!roomId) {
      setError("Invalid room link");
      return;
    }

    if (hasState) {
      setShouldRenderRoom(true);
      return;
    }

    if (!isValidRoomNameFormat(roomId)) {
      setShouldRenderRoom(true);
      return;
    }

    // friendly name in the URL — resolve it to the real room id
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/find-by-name/${roomId}`);
        if (!response.ok) {
          setError("Room not found or has expired");
          return;
        }
        const data = await response.json();
        navigate(`/room/${data.roomId}`, {
          state: { isHost: false, fromDirectLink: true, friendlyName: data.friendlyName },
          replace: true,
        });
      } catch (err) {
        console.error("Error joining room:", err);
        setError("Unable to join room. Please try again.");
      }
    })();
  }, [roomId, isLoaded, isSignedIn, clerk, navigate, hasState]);

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
        {!isLoaded ? "Checking authentication..." : "Joining room..."}
      </h3>
    </div>
  );
};

export default DirectRoomJoin;