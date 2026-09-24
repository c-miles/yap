import React from "react";
import { Video, VideoOff } from "lucide-react";
import { Button, Icon } from "./atoms";
import { Modal } from "./molecules";

type CameraError = "denied" | "notfound" | "other";

const CONTENT: Record<CameraError, { title: string; message: string; missing?: boolean }> = {
  denied: {
    title: "Camera access needed",
    message: "Allow camera access in your browser's site settings, then turn your camera back on.",
  },
  notfound: {
    title: "No camera found",
    message: "Connect a camera, then turn your camera back on.",
    missing: true,
  },
  other: {
    title: "Can't access your camera",
    message: "Check that no other app is using it, then turn your camera back on.",
  },
};

const PermissionErrorModal: React.FC<{ open: boolean; onClose: () => void; errorType: CameraError }> = ({
  open,
  onClose,
  errorType,
}) => {
  const { title, message, missing } = CONTENT[errorType];

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <Icon icon={missing ? Video : VideoOff} size="2xl" className={`mb-4 ${missing ? "text-warning" : "text-danger"}`} />
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <Button onClick={onClose} className="w-full">
          Got it
        </Button>
      </div>
    </Modal>
  );
};

export default PermissionErrorModal;
