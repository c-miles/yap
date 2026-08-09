import React, { useState, Fragment } from "react";
import { BeatLoader } from "react-spinners";
import { DashboardProps } from "../../types/dashboardTypes";
import { Dialog, Transition } from "@headlessui/react";
import { Video, Users, X } from "lucide-react";
import { Button, Input } from "../atoms";
import DashboardCard from "../molecules/DashboardCard";

const Dashboard: React.FC<DashboardProps> = ({
  createRoom,
  handleJoinRoom,
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
}) => {
  const showUsernameForm = userExists === false || !userInfo?.username;
  const [roomName, setRoomName] = useState("");
  const [showJoinRoomForm, setShowJoinRoomForm] = useState(false);

  const onJoinRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleJoinRoom(roomName);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
      {isLoading || (isAuthenticated && userExists === null) ? (
        <BeatLoader color="#64748b" />
      ) : !isAuthenticated ? (
        <div className="w-full max-w-md">
          <div className="bg-surface p-8 rounded-lg border border-slate-700 text-center">
            <h2 className="text-2xl font-bold text-text mb-4">Welcome to yap</h2>
            <p className="text-text-muted mb-6">Log in to start or join a room</p>
            <Button variant="primary" className="w-full" onClick={onLogin}>
              Log in
            </Button>
          </div>
        </div>
      ) : showUsernameForm ? (
        <div className="w-full max-w-md">
          <form
            onSubmit={handleUsernameSubmit}
            className="bg-surface p-8 rounded-lg border border-slate-700 text-center"
          >
            <h2 className="text-2xl font-bold text-text mb-4">Welcome to yap</h2>
            <p className="text-text-muted mb-6">Choose a username to get started</p>
            
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
              icon={<Video size={32} className="text-text" />}
              title="Start a room"
              description="Create a new video room and invite others to join"
              onClick={createRoom}
            />
            
            <DashboardCard
              icon={<Users size={32} className="text-text" />}
              title="Join by code"
              description="Enter a room code to join an existing conversation"
              onClick={() => setShowJoinRoomForm(true)}
            />
          </div>

          {/* Join Room Modal */}
          <Transition appear show={showJoinRoomForm} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50"
              onClose={() => setShowJoinRoomForm(false)}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-50" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface border border-slate-700 p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-text mb-4 relative"
                      >
                        Join Room
                        <button
                          onClick={() => setShowJoinRoomForm(false)}
                          className="absolute right-0 top-0 text-text-muted hover:text-text transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </Dialog.Title>
                      
                      <form onSubmit={onJoinRoomSubmit}>
                        <Input
                          type="text"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          placeholder="Enter room name"
                          required
                        />
                        
                        <Button type="submit" variant="primary" className="w-full mt-4">
                          Join Room
                        </Button>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      )}
    </div>
  );
};

export default Dashboard;
