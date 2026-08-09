import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import AuthenticationButton from "./AuthenticationButton";
import WaveBackground from "./WaveBackground/WaveBackground";

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <WaveBackground />
      <div className="text-center max-w-md mx-auto relative z-10 bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
        <h1 className="text-6xl font-bold tracking-tight text-text mb-4">yap</h1>
        <p className="text-lg text-text-muted mb-6">
          Connect and engage effortlessly with yap, your go-to video conferencing
          solution.
        </p>
        
        {!isAuthenticated && (
          <AuthenticationButton />
        )}
      </div>
    </div>
  );
};

export default LandingPage;
