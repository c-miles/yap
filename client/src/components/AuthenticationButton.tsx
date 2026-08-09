import React from "react";
import { useClerk, useUser } from "@clerk/react";
import { Button } from "./atoms";

const AuthenticationButton: React.FC = () => {
  const { isSignedIn } = useUser();
  const clerk = useClerk();

  if (isSignedIn) {
    return null;
  }

  const handleLogin = () => {
    clerk.openSignIn({});
  };

  return (
    <Button
      variant="primary"
      onClick={handleLogin}
      size="lg"
    >
      Sign In
    </Button>
  );
};

export default AuthenticationButton;
