import React, { useState } from "react";
import { BeatLoader } from "react-spinners";
import { DashboardProps } from "../../types/dashboardTypes";
import { Video, Users } from "lucide-react";
import { Button, Input, Card, Heading, Text, Icon } from "../atoms";
import { Modal } from "../molecules";
import DashboardCard from "../molecules/DashboardCard";
import Footer from "../Footer";

const Dashboard: React.FC<DashboardProps> = ({
  createRoom,
  joinRoom,
  handleUsernameSubmit,
  isSubmitting,
  newUsername,
  setNewUsername,
  userInfo,
  userExists,
  usernameError,
  isAuthenticated,
  isLoading,
  onLogin,
  profileError,
  onRetryProfile,
  isCreating,
  isJoining,
  createError,
  joinError,
  clearJoinError,
}) => {
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
    <div className="relative flex items-center justify-center min-h-[calc(100vh-64px)] p-8 pb-24">
      {isLoading || (isAuthenticated && userExists === null && !profileError) ? (
        <BeatLoader color="var(--primary-hov)" />
      ) : !isAuthenticated ? (
        <div className="w-full max-w-md">
          <Card padding="lg" className="text-center">
            <Heading level={2} className="mb-4">Welcome to yap</Heading>
            <Text variant="muted" className="mb-6">Log in to start or join a room</Text>
            <Button variant="primary" className="w-full" onClick={onLogin}>
              Log in
            </Button>
          </Card>
        </div>
      ) : profileError ? (
        <div className="w-full max-w-md">
          <Card padding="lg" className="text-center">
            <Heading level={2} className="mb-4">Couldn't load your profile</Heading>
            <Text variant="muted" className="mb-6">Something went wrong talking to the server</Text>
            <Button variant="primary" className="w-full" onClick={onRetryProfile}>
              Try again
            </Button>
          </Card>
        </div>
      ) : showUsernameForm ? (
        <div className="w-full max-w-md">
          <form
            onSubmit={handleUsernameSubmit}
            className="bg-surface border border-border rounded-lg p-8 text-center"
          >
            <Heading level={2} className="mb-4">Welcome to yap</Heading>
            <Text variant="muted" className="mb-6">Choose a username to get started</Text>

            <Input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Choose a username"
              required
              error={usernameError}
            />
            
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Set Username"}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <DashboardCard
              icon={<Icon icon={Video} size="xl" className="text-text" />}
              title="Start a room"
              description="Create a new video room and invite others to join"
              onClick={createRoom}
              busy={isCreating}
            />

            <DashboardCard
              icon={<Icon icon={Users} size="xl" className="text-text" />}
              title="Join by code"
              description="Enter a room code to join an existing conversation"
              onClick={() => setShowJoinRoomForm(true)}
            />

            {createError && (
              <p role="alert" className="md:col-span-2 text-center text-sm text-danger">
                {createError}
              </p>
            )}
          </div>

          <Modal open={showJoinRoomForm} onClose={closeJoinRoomForm} title="Join Room">
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

              <Button type="submit" variant="primary" className="w-full mt-4" disabled={isJoining}>
                {isJoining ? "Joining..." : "Join Room"}
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
