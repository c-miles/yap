import React from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { setAuthTokenGetter } from "../services/authToken";
import { clerkAppearance } from "./clerkAppearance";

const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// hands clerk's getToken to non-hook code (authFetch, socket, iceServers)
const AuthTokenBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();

  React.useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return <>{children}</>;
};

const ClerkProviderWithNavigate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  if (!publishableKey) {
    console.error("Clerk publishable key missing; rendering without authentication");
    return <>{children}</>;
  }

  // clerk's prop types drop routerPush/routerReplace/afterSignOutUrl, but it still reads them
  const clerkProviderProps: any = {
    publishableKey,
    routerPush: (to: string) => navigate(to),
    routerReplace: (to: string) => navigate(to, { replace: true }),
    afterSignOutUrl: "/",
    // clerk defaults these to "/", so a google sign-in would reload onto the landing page first
    signInFallbackRedirectUrl: "/dashboard",
    signUpFallbackRedirectUrl: "/dashboard",
    appearance: clerkAppearance,
    localization: { signIn: { start: { titleCombined: "" } } },
  };

  return (
    <ClerkProvider {...clerkProviderProps}>
      <AuthTokenBridge>{children}</AuthTokenBridge>
    </ClerkProvider>
  );
};

export default ClerkProviderWithNavigate;
