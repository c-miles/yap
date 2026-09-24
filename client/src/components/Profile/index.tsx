import React, { useState, useEffect } from "react";
import { BeatLoader } from "react-spinners";

import Profile from "./Profile";
import useAuthUser from "../../hooks/useAuthUser";

const ProfileContainer: React.FC = () => {
  const { userInfo, userExists, profileError, handleUsernameSubmit } = useAuthUser();

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

  if (userExists === null && !profileError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <BeatLoader color="var(--accent)" />
      </div>
    );
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
