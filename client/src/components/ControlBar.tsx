import React from "react";
import { LogOut, MessageSquare, Mic, MicOff, Share2, Video, VideoOff } from "lucide-react";
import { Icon, Badge } from "./atoms";
import { ControlBarProps } from "../types/controlBarTypes";

// A labeled anchor control (mic/camera). `off` drives the loud muted state:
// aria-pressed + slashed icon + red fill = three redundant cues (never color alone).
const AnchorButton: React.FC<{
  label: string;
  off: boolean;
  onClick: () => void;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
}> = ({ label, off, onClick, onIcon, offIcon }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={off}
    className={`focus-ring flex flex-col items-center justify-center gap-1 rounded-xl min-w-[64px] min-h-[48px] px-3 py-2 text-xs font-medium transition-colors
      ${off ? "bg-danger text-accent-fg" : "bg-surface-raised text-text hover:brightness-125"}`}
  >
    <span aria-hidden="true">{off ? offIcon : onIcon}</span>
    <span>{label}</span>
  </button>
);

// An icon-only secondary control (share/chat) with a tooltip + accessible name.
const IconControl: React.FC<{
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, active, badge = 0, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={badge > 0 ? `${label}, ${badge} unread` : label}
    aria-pressed={active}
    title={label}
    className={`relative focus-ring flex items-center justify-center rounded-full min-w-[48px] min-h-[48px] transition-colors
      ${active ? "bg-accent text-accent-fg" : "bg-surface-raised text-text hover:brightness-125"}`}
  >
    <span aria-hidden="true">{children}</span>
    {badge > 0 && (
      <Badge
        aria-hidden="true"
        className="absolute -top-1 -right-1 min-w-[18px] h-[18px]"
      >
        {badge > 9 ? "9+" : badge}
      </Badge>
    )}
  </button>
);

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
  <div className="w-full max-w-3xl mx-4 mb-4 rounded-2xl bg-surface border border-border shadow-lg px-4 py-3">
    <div className="flex items-center justify-between gap-4">
      {/* Anchor: mic + camera */}
      <div className="flex items-center gap-3">
        <AnchorButton
          label="Mic"
          off={!audioEnabled}
          onClick={toggleAudio}
          onIcon={<Icon icon={Mic} size="md" />}
          offIcon={<Icon icon={MicOff} size="md" />}
        />
        <AnchorButton
          label="Camera"
          off={!videoEnabled}
          onClick={toggleVideo}
          onIcon={<Icon icon={Video} size="md" />}
          offIcon={<Icon icon={VideoOff} size="md" />}
        />
      </div>

      {/* Secondary: share + chat */}
      <div className="flex items-center gap-3">
        {onShareRoom && (
          <IconControl label="Share" onClick={onShareRoom}>
            <Icon icon={Share2} size="md" />
          </IconControl>
        )}
        <IconControl label="Chat" active={isMessageThreadOpen} badge={unreadCount} onClick={toggleMessageThread}>
          <Icon icon={MessageSquare} size="md" />
        </IconControl>
      </div>

      {/* Destructive: leave, isolated */}
      {onLeaveRoom && (
        <button
          type="button"
          onClick={onLeaveRoom}
          className="focus-ring flex items-center gap-2 rounded-xl min-h-[48px] px-4 ml-2 text-sm font-semibold
            bg-danger text-accent-fg hover:brightness-110 transition"
        >
          <Icon icon={LogOut} size="md" aria-hidden="true" />
          <span>Leave</span>
        </button>
      )}
    </div>
  </div>
);

export default ControlBar;
