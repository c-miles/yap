import React from "react";

import useAuthUser from "../../hooks/useAuthUser";
import useRoomActions from "../../hooks/useRoomActions";
import useUsernameForm from "../../hooks/useUsernameForm";

import Dashboard from "./Dashboard";

const DashboardContainer: React.FC = () => {
  const { userInfo, userExists, handleUsernameSubmit, profileError, retryProfileLoad } = useAuthUser();
  const roomActions = useRoomActions();


  const usernameForm = useUsernameForm(handleUsernameSubmit);

  return (
    <Dashboard
      {...roomActions}
      usernameForm={usernameForm}
      userInfo={userInfo}
      userExists={userExists}
      profileError={profileError}
      onRetryProfile={retryProfileLoad}
    />
  );
};

export default DashboardContainer;
