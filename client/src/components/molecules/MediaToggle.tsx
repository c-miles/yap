import React from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Icon, IconButton } from "../atoms";

const KINDS = {
  mic: { on: Mic, off: MicOff, turnOff: "Mute", turnOn: "Unmute" },
  camera: { on: Video, off: VideoOff, turnOff: "Turn off camera", turnOn: "Turn on camera" },
};

// off shows as a red fill, a slashed icon and the label, never color alone
const MediaToggle: React.FC<{ kind: keyof typeof KINDS; off: boolean; onClick: () => void }> = ({ kind, off, onClick }) => {
  const { on, off: offIcon, turnOff, turnOn } = KINDS[kind];
  const label = off ? turnOn : turnOff;
  return (
    <IconButton variant={off ? "off" : "default"} onClick={onClick} aria-label={label} title={label}>
      <Icon icon={off ? offIcon : on} size="md" aria-hidden="true" />
    </IconButton>
  );
};

export default MediaToggle;
