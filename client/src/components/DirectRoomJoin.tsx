import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import { isValidRoomNameFormat } from "../utils/roomName";
import RoomContainer from "./Room";
import { findRoom } from "../services/rooms";
import { Spinner, buttonClassName } from "./atoms";
import { StatePanel } from "./molecules";
import PageShell from "./PageShell";

const DirectRoomJoin: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<{ title: string; detail: string } | null>(null);
  const [shouldRenderRoom, setShouldRenderRoom] = useState(false);

  // set by the dashboard or by the name lookup below; bare links have none
  const hasState = (location.state as { friendlyName?: string } | null)?.friendlyName !== undefined;

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
          state: { friendlyName: room.friendlyName },
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
      <PageShell chrome={false}>
        <StatePanel className="m-auto" title={error.title} description={error.detail}>
          <Link to="/dashboard" className={buttonClassName()}>
            Back to lounge
          </Link>
        </StatePanel>
      </PageShell>
    );
  }

  return (
    <PageShell chrome={false}>
      <Spinner className="m-auto" label={isLoaded ? "Joining room…" : "Checking your sign-in…"} />
    </PageShell>
  );
};

export default DirectRoomJoin;