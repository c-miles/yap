import React from "react";
import { MessageSquare, PhoneOff, Share2 } from "lucide-react";
import { Badge, Icon, IconButton } from "./atoms";
import { MediaToggle } from "./molecules";
import { ControlBarProps } from "../types/controlBarTypes";

const ControlBar: React.FC<ControlBarProps> = ({
  audioEnabled,
  videoEnabled,
  isMessageThreadOpen,
  toggleAudio,
  toggleVideo,
  toggleMessageThread,
  onShareRoom,
  onLeaveRoom,
  unreadCount,
}) => (
  <div className="mb-4 px-4 flex items-center justify-center gap-3">
    <MediaToggle kind="mic" off={!audioEnabled} onClick={toggleAudio} />
    <MediaToggle kind="camera" off={!videoEnabled} onClick={toggleVideo} />
    <IconButton onClick={onShareRoom} aria-label="Share room" title="Share room">
      <Icon icon={Share2} size="md" aria-hidden="true" />
    </IconButton>
    <IconButton
      onClick={toggleMessageThread}
      aria-label={unreadCount > 0 ? `Chat, ${unreadCount} unread` : "Chat"}
      aria-pressed={isMessageThreadOpen}
      title="Chat"
      variant={isMessageThreadOpen ? "active" : "default"}
      className="relative"
    >
      <Icon icon={MessageSquare} size="md" aria-hidden="true" />
      {unreadCount > 0 && (
        <Badge aria-hidden="true" className="absolute -top-1 -right-1 min-w-[18px] h-[18px]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </IconButton>
    <IconButton variant="danger" onClick={onLeaveRoom} aria-label="Leave call" title="Leave call">
      <Icon icon={PhoneOff} size="md" aria-hidden="true" />
    </IconButton>
  </div>
);

export default ControlBar;
