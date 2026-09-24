import React from "react";
import { useClerk } from "@clerk/react";

import useAuthUser from "../../hooks/useAuthUser";
import useRoomActions from "../../hooks/useRoomActions";
import useUsernameForm from "../../hooks/useUsernameForm";

import Dashboard from "./Dashboard";

const DashboardContainer: React.FC = () => {
  const { userInfo, userExists, handleUsernameSubmit, isAuthenticated, isLoading, profileError, retryProfileLoad } = useAuthUser();
  const clerk = useClerk();
  const roomActions = useRoomActions();

  const onLogin = () => clerk.openSignIn({ forceRedirectUrl: "/dashboard" });

  const usernameForm = useUsernameForm(handleUsernameSubmit);

  return (
    <Dashboard
      {...roomActions}
      usernameForm={usernameForm}
      userInfo={userInfo}
      userExists={userExists}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      onLogin={onLogin}
      profileError={profileError}
      onRetryProfile={retryProfileLoad}
    />
  );
};

export default DashboardContainer;
