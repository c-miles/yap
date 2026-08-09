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
    appearance: {
      // variable names per @clerk/react 6.x (Core 3): colorForeground/
      // colorMutedForeground/colorInput* — the older colorText* names are
      // silently ignored by this version
      variables: {
        colorPrimary: "#475569",
        colorPrimaryForeground: "#f8fafc",
        colorBackground: "#1e293b",
        colorForeground: "#f8fafc",
        colorMutedForeground: "#cbd5e1",
        colorNeutral: "#f8fafc",
        colorInput: "#0f172a",
        colorInputForeground: "#f8fafc",
        colorBorder: "#334155",
        colorDanger: "#f87171",
        borderRadius: "0.5rem",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      },
      // the social-provider buttons derive their idle border from neutral
      // shades that vanish on our dark surface — give them a real outline
      elements: {
        socialButtonsIconButton: {
          border: "1px solid #334155",
          backgroundColor: "#0f172a",
          "&:hover": { backgroundColor: "#334155" },
        },
        socialButtonsBlockButton: {
          border: "1px solid #334155",
          backgroundColor: "#0f172a",
          "&:hover": { backgroundColor: "#334155" },
        },
      },
    },
  };

  return <ClerkProvider {...clerkProviderProps}>{children}</ClerkProvider>;
};

export default ClerkProviderWithNavigate;
