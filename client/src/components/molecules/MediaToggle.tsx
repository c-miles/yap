import React from "react";

const LAYOUT = {
  stacked: "flex-col gap-1 min-w-[64px] px-3 py-2 text-xs",
  inline: "gap-2 min-w-12 px-4 text-sm",
} as const;

// off shows three ways, never colour alone: aria-pressed, a slashed icon and the red fill
const MediaToggle: React.FC<{
  label: string;
  off: boolean;
  onClick: () => void;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
  layout: keyof typeof LAYOUT;
}> = ({ label, off, onClick, onIcon, offIcon, layout }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={off}
    className={`focus-ring flex items-center justify-center min-h-12 rounded-lg font-medium transition-base ${LAYOUT[layout]}
      ${off ? "bg-danger border border-danger text-danger-fg hover:brightness-110" : "glass text-text"}`}
  >
    <span aria-hidden="true">{off ? offIcon : onIcon}</span>
    <span>{label}</span>
  </button>
);

export default MediaToggle;
