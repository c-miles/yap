import React, { useState, useEffect } from "react";
import { Button, Spinner } from "../atoms";
import { StatePanel } from "../molecules";

import Profile from "./Profile";
import useAuthUser from "../../hooks/useAuthUser";

const ProfileContainer: React.FC = () => {
  const { userInfo, userExists, profileError, retryProfileLoad, handleUsernameSubmit } = useAuthUser();

  const [username, setUsername] = useState(userInfo?.username || "");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setUsername(userInfo?.username || "");
  }, [userInfo]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updateError = await handleUsernameSubmit(username);
    setError(updateError);
    if (!updateError) {
      setIsEditing(false);
    }
  };

  if (profileError) {
    return (
      <StatePanel className="m-auto" title="Couldn't load your profile" description="Check your connection and try again.">
        <Button onClick={retryProfileLoad}>Try again</Button>
      </StatePanel>
    );
  }

  if (userExists === null) {
    return <Spinner className="m-auto" />;
  }

  return (
    <Profile
      error={error}
      handleSubmit={handleSubmit}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      setUsername={setUsername}
      userInfo={userInfo}
      username={username}
    />
  );
};

export default ProfileContainer;
