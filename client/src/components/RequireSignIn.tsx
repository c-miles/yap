import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/react";

const RequireSignIn: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) {
    return null;
  }
  return isSignedIn ? children : <Navigate to="/" replace />;
};

export default RequireSignIn;
