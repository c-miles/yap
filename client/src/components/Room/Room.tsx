import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import ControlBar from "../ControlBar";
import MessageThread from "../MessageThread/MessageThread";
import ShareRoomModal from "../ShareRoomModal";
import PermissionErrorModal from "../PermissionErrorModal";
import VideoGrid from "./VideoGrid";
import CallHeader from "./CallHeader";
import ChatToast from "./ChatToast";
import WaitingForOthers from "./WaitingForOthers";
import { useChat } from "./useChat";
import { useChromeVisibility } from "./useChromeVisibility";
import { Participant } from "./useRoomState";
import "./Room.css";

interface RoomProps {
  audioEnabled: boolean;
  localStream: MediaStream | null;
  localUserId: string;
  localUsername: string;
  localVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  participants: Map<string, Participant>;
  profilePicture?: string;
  retryVideoAccess: () => void;
  setVideoPermissionError: (error: 'denied' | 'notfound' | 'other' | null) => void;
  videoPermissionError: 'denied' | 'notfound' | 'other' | null;
  roomId: string | undefined;
  roomName?: string;
  roomError: string | null;
  isConnecting: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  onLeaveRoom: () => void;
  onDashboard: () => void;
  username?: string;
  socket: any;
}

const Room: React.FC<RoomProps> = ({
  audioEnabled,
  localStream,
  localUserId,
  localUsername,
  localVideoEnabled,
  localVideoRef,
  participants,
  profilePicture,
  retryVideoAccess,
  setVideoPermissionError,
  videoPermissionError,
  roomId,
  roomName,
  roomError,
  isConnecting,
  toggleAudio,
  toggleVideo,
  onLeaveRoom,
  onDashboard,
  username,
  socket,
}) => {
  const [isMessageThreadOpen, setIsMessageThreadOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { messages, sendMessage, unreadCount, latestUnread } =
    useChat(socket, roomId, username || localUsername, isMessageThreadOpen);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide only when chat is closed — an open drawer must not let the
  // controls (Leave, mic) fade out from under the conversation.
  const { visible, reveal, hide } = useChromeVisibility(isMobile && !isMessageThreadOpen);
  const toggleChrome = () => (visible ? hide() : reveal());

  const toggleMessageThread = () => {
    setIsMessageThreadOpen(!isMessageThreadOpen);
  };

  const handleShareRoom = () => {
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  // Show error state
  if (roomError) {
    return (
      <div className="app-layout">
        <div className="room-container">
          <div className="video-area">
            <div className="max-w-md mx-auto p-6 rounded-lg border border-red-500/20 bg-red-500/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="text-red-500" size={24} />
                <h2 className="text-lg font-semibold text-red-400">Unable to join room</h2>
              </div>
              <p className="text-red-300">{roomError}</p>
              <button
                type="button"
                onClick={onDashboard}
                className="focus-ring mt-4 min-h-[44px] px-5 rounded-lg bg-surface-raised text-text hover:brightness-125 transition"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isConnecting) {
    return (
      <div className="app-layout">
        <div className="room-container">
          <div className="video-area">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <h3 className="text-lg font-medium text-text">
                Connecting to room...
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main room layout
  return (
    <div className="app-layout">
      <CallHeader
        roomName={roomName}
        participantCount={participants.size + 1}
        visible={visible}
        onPointerDown={reveal}
      />

      <div className={`room-container ${isMessageThreadOpen ? 'chat-open' : ''}`}>
        <div className="video-area" onPointerDown={toggleChrome}>
          <VideoGrid
            localStream={localStream}
            localUserId={localUserId}
            localUsername={localUsername}
            localVideoEnabled={localVideoEnabled}
            localAudioEnabled={audioEnabled}
            participants={participants}
            profilePicture={profilePicture}
          />
          {participants.size === 0 && (
            <div className="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none px-4">
              <div className="pointer-events-auto">
                <WaitingForOthers roomName={roomName ?? roomId} />
              </div>
            </div>
          )}
          <ChatToast message={latestUnread} />
        </div>

        {isMobile && (
          <div
            className={`chat-backdrop ${isMessageThreadOpen ? 'open' : ''}`}
            onClick={toggleMessageThread}
            style={{ pointerEvents: isMessageThreadOpen ? 'auto' : 'none' }}
          />
        )}

        <div className={`chat-drawer ${isMessageThreadOpen ? 'open' : ''}`}>
          <MessageThread messages={messages} onSendMessage={sendMessage} />
        </div>
      </div>

      <div className={`app-footer ${visible ? '' : 'app-footer--hidden'}`} onPointerDown={reveal}>
        <ControlBar
          audioEnabled={audioEnabled}
          videoEnabled={localVideoEnabled}
          isMessageThreadOpen={isMessageThreadOpen}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          toggleMessageThread={toggleMessageThread}
          onShareRoom={handleShareRoom}
          onLeaveRoom={onLeaveRoom}
          unreadCount={unreadCount}
        />
      </div>

      <video ref={localVideoRef} autoPlay muted playsInline style={{ display: "none" }} />

      {roomName && (
        <ShareRoomModal
          open={isShareModalOpen}
          onClose={handleCloseShareModal}
          roomName={roomName}
        />
      )}

      <PermissionErrorModal
        open={!!videoPermissionError}
        onClose={() => setVideoPermissionError(null)}
        onRetry={retryVideoAccess}
        errorType={videoPermissionError || 'other'}
        mediaType="video"
      />
    </div>
  );
};

export default Room;