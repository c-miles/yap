import React, { useState } from "react";
import { BeatLoader } from "react-spinners";
import { DashboardProps } from "../../types/dashboardTypes";
import { Video, Users } from "lucide-react";
import { Button, Input, Card, Heading, Text, Icon } from "../atoms";
import { Modal, UsernameForm } from "../molecules";
import DashboardCard from "../molecules/DashboardCard";
import Footer from "../Footer";
import WaveBackground from "../WaveBackground/WaveBackground";
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
    <div className="relative isolate flex items-center justify-center min-h-[calc(100vh-64px)] p-8 pb-24">
      <WaveBackground className="-z-10" />
      <h1 className="sr-only">Lounge</h1>
      {userExists === null && !profileError ? (
        <BeatLoader color="var(--accent)" aria-label="Loading" />
      ) : profileError ? (
        <div className="w-full max-w-md">
          <Card className="text-center">
            <Heading level={2} className="mb-4">Couldn't load your profile</Heading>
            <Text variant="muted" className="mb-6">Something went wrong talking to the server</Text>
            <Button variant="primary" className="w-full" onClick={onRetryProfile}>
              Try again
            </Button>
          </Card>
        </div>
      ) : showUsernameForm ? (
        <div className="w-full max-w-md">
          <Card className="text-center">
            <Heading level={2} className="mb-4">Welcome to Yap</Heading>
            <Text variant="muted" className="mb-6">Choose a username to get started</Text>
            <UsernameForm form={usernameForm} />
          </Card>
        </div>
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
      <Footer className="absolute inset-x-0 bottom-0" />
    </div>
  );
};

export default Dashboard;
