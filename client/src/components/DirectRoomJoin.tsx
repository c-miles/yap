import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import { BeatLoader } from "react-spinners";
import { isValidRoomNameFormat } from "../utils/roomNameGenerator";
import RoomContainer from "./Room";
import { findRoom } from "../services/rooms";
import { Heading, Text, buttonClassName } from "./atoms";

const DirectRoomJoin: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<{ title: string; detail: string } | null>(null);
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
      setError({ title: "That link doesn't look right", detail: "Check it with whoever sent it." });
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
          setError({ title: `We couldn't find ${roomId}`, detail: "Double-check the link with whoever sent it." });
          return;
        }
        navigate(`/room/${room.roomId}`, {
          state: { isHost: false, fromDirectLink: true, friendlyName: room.friendlyName },
          replace: true,
        });
      } catch (err) {
        console.error("Error joining room:", err);
        setError({ title: "Couldn't join the room", detail: "Something went wrong. Try again in a moment." });
      }
    })();
  }, [roomId, isLoaded, isSignedIn, navigate, hasState]);

  if (shouldRenderRoom) {
    return <RoomContainer />;
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center gap-3 h-screen px-6 text-center">
        <Heading level={1}>{error.title}</Heading>
        <Text variant="secondary">{error.detail}</Text>
        <Link to="/dashboard" className={buttonClassName("primary", "md", "mt-4")}>
          Back to lounge
        </Link>
      </main>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <BeatLoader color="var(--accent)" />
      <h3 className="text-lg font-medium text-text">
        {!isLoaded ? "Checking authentication..." : "Joining room..."}
      </h3>
    </div>
  );
};

export default DirectRoomJoin;