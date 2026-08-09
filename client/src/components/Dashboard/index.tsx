import React, { useState } from "react";
import { useClerk } from "@clerk/react";

import useAuthUser from "../../hooks/useAuthUser";
import useRoomActions from "../../hooks/useRoomActions";

import Dashboard from "./Dashboard";

const DashboardContainer: React.FC = () => {
  const { userInfo, userExists, handleUsernameSubmit, isAuthenticated, isLoading } = useAuthUser();
  const clerk = useClerk();
  const { createRoom, joinRoom } = useRoomActions();

  const onLogin = () => clerk.openSignIn({ forceRedirectUrl: "/dashboard" });

  const [newUsername, setNewUsername] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onUsernameFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUsernameError("");
    
    const error = await handleUsernameSubmit(newUsername);
    setUsernameError(error);
    setIsSubmitting(false);
    
    if (!error) {
      setNewUsername("");
    }
  };

  return (
    <Dashboard
      createRoom={createRoom}
      handleJoinRoom={joinRoom}
      handleUsernameSubmit={onUsernameFormSubmit}
      isSubmitting={isSubmitting}
      newUsername={newUsername}
      setNewUsername={setNewUsername}
      usernameError={usernameError}
      userInfo={userInfo}
      userExists={userExists}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      onLogin={onLogin}
    />
  );
};

export default DashboardContainer;
