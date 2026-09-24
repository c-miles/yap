import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import { BeatLoader } from "react-spinners";
import { isValidRoomNameFormat } from "../utils/roomNameGenerator";
import RoomContainer from "./Room";
import { findRoom } from "../services/rooms";

const DirectRoomJoin: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [shouldRenderRoom, setShouldRenderRoom] = useState(false);

  // set by the dashboard or by the name lookup below; bare links have none
  const hasState = location.state && (location.state as any).isHost !== undefined;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate(`/?room=${encodeURIComponent(roomId ?? "")}`, { replace: true });
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

    // friendly name in the URL, resolve it to the real room id
    (async () => {
      try {
        const room = await findRoom(roomId);
        if (!room) {
          setError("Room not found or has expired");
          return;
        }
        navigate(`/room/${room.roomId}`, {
          state: { isHost: false, fromDirectLink: true, friendlyName: room.friendlyName },
          replace: true,
        });
      } catch (err) {
        console.error("Error joining room:", err);
        setError("Unable to join room. Please try again.");
      }
    })();
  }, [roomId, isLoaded, isSignedIn, navigate, hasState]);

  if (shouldRenderRoom) {
    return <RoomContainer />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-2xl font-semibold text-danger">
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
      <BeatLoader color="var(--primary-hov)" />
      <h3 className="text-lg font-medium text-text">
        {!isLoaded ? "Checking authentication..." : "Joining room..."}
      </h3>
    </div>
  );
};

export default DirectRoomJoin;