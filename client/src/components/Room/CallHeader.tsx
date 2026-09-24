import React from "react";

interface CallHeaderProps {
  roomName?: string;
  participantCount: number;
  visible: boolean;
  chatOpen?: boolean;
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
}

const CallHeader: React.FC<CallHeaderProps> = ({ roomName, participantCount, visible, chatOpen, onPointerDown }) => (
  // md:right-80 is the chat drawer width, keep in sync with --chat-drawer-width in Room.css
  <header
    className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-4 px-4 py-3
      transition-[opacity,right] duration-300 motion-reduce:transition-none
      ${chatOpen ? "md:right-80" : ""}
      ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    onPointerDown={onPointerDown}
  >
    <h1 className="text-sm font-medium text-text truncate min-w-0">{roomName}</h1>
    <span className="text-xs text-text-muted whitespace-nowrap">
      {participantCount} {participantCount === 1 ? "person" : "people"}
    </span>
  </header>
);

export default CallHeader;
