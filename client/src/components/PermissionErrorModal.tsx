import React from "react";
import { Mic, MicOff, Video, VideoOff, RefreshCw } from "lucide-react";
import { Button, Icon } from "./atoms";
import { Modal } from "./molecules";

interface PermissionErrorModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorType: 'denied' | 'notfound' | 'other';
  mediaType: 'audio' | 'video';
}

const PermissionErrorModal: React.FC<PermissionErrorModalProps> = ({
  open,
  onClose,
  onRetry,
  errorType,
  mediaType,
}) => {
  const getInstructions = () => {
    const permission = mediaType === 'audio' ? 'microphone' : 'camera';
    return `Click the 🎤 or ℹ️ icon in address bar → Allow ${permission}`;
  };

  const getErrorContent = () => {
    const isAudio = mediaType === 'audio';
    const deviceName = isAudio ? 'Microphone' : 'Camera';

    switch (errorType) {
      case 'denied':
        return {
          icon: <Icon icon={isAudio ? MicOff : VideoOff} size="2xl" className="text-danger" />,
          title: `${deviceName} Access ${isAudio ? 'Required' : 'Needed'}`,
          message: `${getInstructions()}${isAudio ? ', then refresh this page' : ', then try again'}.`,
        };
      case 'notfound':
        return {
          icon: <Icon icon={isAudio ? Mic : Video} size="2xl" className="text-warning" />,
          title: `No ${deviceName} Found`,
          message: `Please connect a ${deviceName.toLowerCase()} to your device and try again.`,
        };
      default:
        return {
          icon: <Icon icon={isAudio ? MicOff : VideoOff} size="2xl" className="text-danger" />,
          title: `Unable to Access ${deviceName}`,
          message: `There was an error accessing your ${deviceName.toLowerCase()}. Please check your device settings.`,
        };
    }
  };

  const { icon, title, message } = getErrorContent();
  const isAudio = mediaType === 'audio';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">{icon}</div>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={isAudio ? () => window.location.reload() : onRetry}
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <Icon icon={RefreshCw} size="sm" />
            {isAudio ? 'Refresh Page' : 'Try Again'}
          </Button>
          <Button onClick={onClose} variant="ghost">
            Go Back
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PermissionErrorModal;
