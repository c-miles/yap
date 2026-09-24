import React, { useState, useEffect } from "react";
import { Button, Spinner } from "../atoms";
import { StatePanel } from "../molecules";
import PageShell from "../PageShell";
import ControlBar from "../ControlBar";
import MessageThread from "../MessageThread/MessageThread";
import ShareRoomModal from "../ShareRoomModal";
import PermissionErrorModal from "../PermissionErrorModal";
import VideoGrid from "./VideoGrid";
import CallHeader from "./CallHeader";
import ChatToast from "./ChatToast";
import WaitingForOthers from "./WaitingForOthers";
import { useChat } from "./useChat";
import { useVideoRequests } from "./useVideoRequests";
import { useChromeVisibility } from "./useChromeVisibility";
import { Participant } from "./useRoomState";
import "./Room.css";

interface RoomProps {
  audioEnabled: boolean;
  localStream: MediaStream | null;
  localUserId: string;
  localUsername: string;
  localVideoEnabled: boolean;
  participants: Map<string, Participant>;
  profilePicture?: string;
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
  socket: any;
}

const Room: React.FC<RoomProps> = ({
  audioEnabled,
  localStream,
  localUserId,
  localUsername,
  localVideoEnabled,
  participants,
  profilePicture,
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
  socket,
}) => {
  const [isMessageThreadOpen, setIsMessageThreadOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const inviteName = roomName ?? roomId;
  const [isMobile, setIsMobile] = useState(false);
  const [tileHeight, setTileHeight] = useState(0);

  const { messages, sendMessage, unreadCount, latestUnread } =
    useChat(socket, roomId, localUsername, isMessageThreadOpen);
  useVideoRequests(socket, Array.from(participants.keys()), tileHeight);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide only when chat is closed, an open drawer must not let the
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

  if (roomError) {
    return (
      <PageShell chrome={false}>
        <StatePanel className="m-auto" title="Unable to join room" description={roomError}>
          <Button onClick={onDashboard}>Back to lounge</Button>
        </StatePanel>
      </PageShell>
    );
  }

  if (isConnecting) {
    return (
      <div className="app-layout items-center justify-center">
        <Spinner label="Connecting to room…" />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <CallHeader
        roomName={roomName}
        participantCount={participants.size + 1}
        visible={visible}
        chatOpen={isMessageThreadOpen}
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
            onTileHeightChange={setTileHeight}
          />
          {participants.size === 0 && inviteName && (
            <div className="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none px-4">
              <div className="pointer-events-auto">
                <WaitingForOthers roomName={inviteName} />
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
          <div className="chat-drawer-inner">
            <MessageThread messages={messages} onSendMessage={sendMessage} />
          </div>
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

      {inviteName && (
        <ShareRoomModal
          open={isShareModalOpen}
          onClose={handleCloseShareModal}
          roomName={inviteName}
        />
      )}

      <PermissionErrorModal
        open={!!videoPermissionError}
        onClose={() => setVideoPermissionError(null)}
        errorType={videoPermissionError || 'other'}
      />
    </div>
  );
};

export default Room;