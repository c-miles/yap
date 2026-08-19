import React from "react";

interface CallHeaderProps {
  roomName?: string;
  participantCount: number;
  visible: boolean;
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
}

// No invite button here — Share lives in the control bar and the solo empty-state CTA.
const CallHeader: React.FC<CallHeaderProps> = ({ roomName, participantCount, visible, onPointerDown }) => (
  <header
    className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-4 px-4 py-3
      bg-gradient-to-b from-black/60 to-transparent text-text-secondary
      transition-opacity duration-300 motion-reduce:transition-none
      ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    onPointerDown={onPointerDown}
  >
    <span className="text-sm font-medium text-text truncate min-w-0">{roomName}</span>
    <span className="text-xs whitespace-nowrap">
      {participantCount} {participantCount === 1 ? "person" : "people"}
    </span>
  </header>
);

export default CallHeader;
