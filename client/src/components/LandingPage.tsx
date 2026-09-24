import React, { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import WaveBackground from "./WaveBackground/WaveBackground";
import { Button, Heading, Text } from "./atoms";

const LandingPage: React.FC = () => {
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
    () => clerk.openSignIn(roomPath ? { forceRedirectUrl: roomPath, signUpForceRedirectUrl: roomPath } : {}),
    [clerk, roomPath]
  );

  useEffect(() => {
    if (isLoaded && !isSignedIn && roomPath) {
      openSignIn();
    }
  }, [isLoaded, isSignedIn, roomPath, openSignIn]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <WaveBackground />
      {/* --surface (#1e293b) at 80%. our color tokens are opaque var()s, so the /80 modifier can't apply here */}
      <div className="text-center max-w-md mx-auto relative z-10 bg-[rgb(30_41_59_/_0.8)] backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
        <Heading level={1} size="2xl" className="tracking-tight mb-4">yap</Heading>
        <Text variant="secondary" className="text-lg mb-6">
          Drop-in video rooms for your group. Share a link and hop in, no install needed.
        </Text>

        {!isAuthenticated && (
          <Button variant="primary" size="lg" onClick={openSignIn}>
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
