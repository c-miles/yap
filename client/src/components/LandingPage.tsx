import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import AuthenticationButton from "./AuthenticationButton";
import WaveBackground from "./WaveBackground/WaveBackground";
import { Heading, Text } from "./atoms";

const LandingPage: React.FC = () => {
  const { isSignedIn } = useUser();
  const isAuthenticated = isSignedIn === true;
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

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
          <AuthenticationButton />
        )}
      </div>
      <Link
        to="/privacy"
        className="focus-ring absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-sm text-text-muted hover:text-text transition-colors"
      >
        Privacy
      </Link>
    </div>
  );
};

export default LandingPage;
