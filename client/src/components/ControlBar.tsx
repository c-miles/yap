import React from "react";
import { LogOut, MessageSquare, Mic, MicOff, Share2, Video, VideoOff } from "lucide-react";
import { Badge, Button, Icon, IconButton } from "./atoms";
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
  <div className="mb-4 px-4 flex items-center justify-center gap-4 sm:gap-8">
    <div className="flex items-center gap-2 sm:gap-3">
      <MediaToggle
        layout="stacked"
        label="Mic"
        off={!audioEnabled}
        onClick={toggleAudio}
        onIcon={<Icon icon={Mic} size="md" />}
        offIcon={<Icon icon={MicOff} size="md" />}
      />
      <MediaToggle
        layout="stacked"
        label="Camera"
        off={!videoEnabled}
        onClick={toggleVideo}
        onIcon={<Icon icon={Video} size="md" />}
        offIcon={<Icon icon={VideoOff} size="md" />}
      />
    </div>

    <div className="flex items-center gap-2 sm:gap-3">
      <IconButton onClick={onShareRoom} aria-label="Share" title="Share">
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
    </div>

    <Button variant="danger" onClick={onLeaveRoom}>
      <Icon icon={LogOut} size="md" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Leave</span>
    </Button>
  </div>
);

export default ControlBar;
