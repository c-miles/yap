import React, { useState } from "react";
import { DashboardProps } from "../../types/dashboardTypes";
import { Video, Users } from "lucide-react";
import { Button, Input, Icon, Spinner } from "../atoms";
import { DashboardCard, Modal, StatePanel, UsernameForm } from "../molecules";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const Dashboard: React.FC<DashboardProps> = ({
  createRoom,
  joinRoom,
  usernameForm,
  userInfo,
  userExists,
  profileError,
  onRetryProfile,
  isCreating,
  isJoining,
  createError,
  joinError,
  clearJoinError,
}) => {
  useDocumentTitle("Lounge");
  const showUsernameForm = userExists === false || !userInfo?.username;
  const [roomName, setRoomName] = useState("");
  const [showJoinRoomForm, setShowJoinRoomForm] = useState(false);

  const onJoinRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinRoom(roomName);
  };

  const closeJoinRoomForm = () => {
    setShowJoinRoomForm(false);
    clearJoinError();
  };

  return (
    <div className="m-auto w-full flex flex-col items-center">
      <h1 className="sr-only">Lounge</h1>
      {userExists === null && !profileError ? (
        <Spinner />
      ) : profileError ? (
        <StatePanel headingLevel={2} title="Couldn't load your profile" description="Something went wrong talking to the server.">
          <Button onClick={onRetryProfile}>Try again</Button>
        </StatePanel>
      ) : showUsernameForm ? (
        <StatePanel headingLevel={2} title="Welcome to Yap" description="Choose a username to get started.">
          <UsernameForm form={usernameForm} />
        </StatePanel>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <DashboardCard
              icon={<Icon icon={Video} size="xl" className="text-accent" />}
              title="Start a room"
              description="Create a new video room and invite others to join"
              onClick={createRoom}
              busy={isCreating}
            />

            <DashboardCard
              icon={<Icon icon={Users} size="xl" className="text-accent" />}
              title="Join by name"
              description="Enter a room name to join an existing call"
              onClick={() => setShowJoinRoomForm(true)}
            />

            {createError && (
              <p role="alert" className="md:col-span-2 text-center text-sm text-danger">
                {createError}
              </p>
            )}
          </div>

          <Modal open={showJoinRoomForm} onClose={closeJoinRoomForm} title="Join a room">
            <form onSubmit={onJoinRoomSubmit}>
              <Input
                type="text"
                value={roomName}
                onChange={(e) => {
                  setRoomName(e.target.value);
                  clearJoinError();
                }}
                placeholder="Enter room name"
                required
                error={joinError}
              />

              <Button type="submit" className="w-full mt-4" disabled={isJoining}>
                {isJoining ? "Joining…" : "Join room"}
              </Button>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Dashboard;
