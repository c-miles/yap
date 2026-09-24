import React, { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import WaveBackground from "./WaveBackground/WaveBackground";
import Footer from "./Footer";
import { Button, Text, Wordmark } from "./atoms";
import { isValidRoomNameFormat } from "../utils/roomNameGenerator";
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

  // explicit, since first-time social sign-ups finish on clerk's callback page and lose ?room
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
    <div className="relative isolate min-h-screen flex flex-col bg-bg overflow-hidden">
      <WaveBackground className="-z-10" />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {room && isValidRoomNameFormat(room) && (
          <Text variant="secondary" className="mb-6">
            You're invited to <span className="font-medium text-text">{room}</span>
          </Text>
        )}
        <h1>
          <Wordmark size="lg" />
        </h1>
        <Text variant="secondary" className="mt-6 max-w-[34ch] text-lg sm:text-xl text-balance">
          Drop-in video rooms for your group. Share a link and hop in, no install needed.
        </Text>
        <Text variant="small" className="mt-3">
          Free · Up to 6 people · Never recorded
        </Text>

        {!isAuthenticated && (
          <>
            <Button size="lg" className="mt-8 min-w-[12rem]" onClick={openSignIn}>
              {roomPath ? "Join room" : "Start a room"}
            </Button>
            <Text variant="small" className="mt-4">
              Have an account?{" "}
              <button type="button" onClick={openSignIn} className="focus-ring rounded text-accent hover:underline">
                Sign in
              </button>
            </Text>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
