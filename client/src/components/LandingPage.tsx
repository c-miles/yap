import React, { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import { Button, Text, Wordmark } from "./atoms";
import { isValidRoomNameFormat } from "../utils/roomName";
import useDocumentTitle from "../hooks/useDocumentTitle";

const LandingPage: React.FC = () => {
  useDocumentTitle();
  const { isLoaded, isSignedIn } = useUser();
  const isAuthenticated = isSignedIn === true;
  const clerk = useClerk();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // signed-out room links land here as /?room=<id> to sign in first
  const room = searchParams.get("room");
  const roomPath = room ? `/room/${encodeURIComponent(room)}` : null;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(roomPath ?? "/dashboard", { replace: true });
    }
  }, [isAuthenticated, roomPath, navigate]);

  // explicit redirects, since first-time social sign-ups finish on clerk's callback page and lose ?room
  const openSignIn = useCallback(
    () =>
      clerk.openSignIn({
        withSignUp: true,
        ...(roomPath && { forceRedirectUrl: roomPath, signUpForceRedirectUrl: roomPath }),
      }),
    [clerk, roomPath]
  );

  useEffect(() => {
    if (isLoaded && !isSignedIn && roomPath) {
      openSignIn();
    }
  }, [isLoaded, isSignedIn, roomPath, openSignIn]);

  return (
    <div className="m-auto flex flex-col items-center text-center">
        {room && isValidRoomNameFormat(room) && (
          <Text variant="secondary" className="mb-6">
            You're invited to <span className="font-medium text-text">{room}</span>
          </Text>
        )}
        <h1>
          <Wordmark size="lg" />
        </h1>
        <Text variant="secondary" className="mt-5 sm:text-lg">
          <span className="block">Drop-in video rooms for your group.</span>
          <span className="block">Share a link and hop in.</span>
        </Text>

        {!isAuthenticated && (
          <Button size="lg" className="mt-8 min-w-[10rem]" onClick={openSignIn}>
            Sign in
          </Button>
        )}
    </div>
  );
};

export default LandingPage;
