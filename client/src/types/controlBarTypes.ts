export type ControlBarProps = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isMessageThreadOpen: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleMessageThread: () => void;
  onShareRoom?: () => void;
  onLeaveRoom?: () => void;
  unreadCount?: number;
};
