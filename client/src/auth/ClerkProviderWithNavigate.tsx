import React from "react";
import { ClerkProvider } from "@clerk/react";
import { useNavigate } from "react-router-dom";

const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Lives inside the Router so Clerk drives navigation through react-router
// (CRA doesn't inline Clerk's VITE_* env convention, so the key is a prop).
const ClerkProviderWithNavigate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  if (!publishableKey) {
    console.error("Clerk publishable key missing; rendering without authentication");
    return <>{children}</>;
  }

  // @clerk/react@6.13.1's published ClerkProviderProps type drops several valid
  // IsomorphicClerkOptions keys (routerPush, routerReplace, afterSignOutUrl) — an
  // upstream typing gap in its Omit<IsomorphicClerkOptions, ...> chain, not a runtime
  // issue: these options are forwarded straight through to clerk-js as-is. Spread as
  // `any` to bypass the incomplete prop typing until the SDK's types catch up.
  const clerkProviderProps: any = {
    publishableKey,
    routerPush: (to: string) => navigate(to),
    routerReplace: (to: string) => navigate(to, { replace: true }),
    afterSignOutUrl: "/",
  };

  return <ClerkProvider {...clerkProviderProps}>{children}</ClerkProvider>;
};

export default ClerkProviderWithNavigate;
