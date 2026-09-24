import React, { useCallback, useState } from "react";
import { ArrowLeft, ChevronDown, Mic, ShieldAlert, Video, VideoOff } from "lucide-react";
import { Button, Heading, Icon, fieldClassName } from "../atoms";
import { MediaToggle, UsernameForm } from "../molecules";
import { UsernameFormState } from "../../hooks/useUsernameForm";
import WaveBackground from "../WaveBackground/WaveBackground";
import { useMicLevel } from "./useMicLevel";

interface GreenRoomProps {
  stream: MediaStream | null;
  streamReady: boolean;
  permissionError: "denied" | "notfound" | "other" | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  devices: { cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] };
  selectedCameraId?: string;
  selectedMicId?: string;
  selectCamera: (id: string) => void;
  selectMic: (id: string) => void;
  deviceSwitchError?: string | null;
  onRetry: () => void;
  onCancel: () => void;
  profileStatus: "loading" | "error" | "ready";
  onRetryProfile: () => void;
  usernameForm?: UsernameFormState;
  roomName?: string;
  onJoin: () => void;
}

const PERMISSION_MESSAGES: Record<NonNullable<GreenRoomProps["permissionError"]>, string> = {
  denied: "Camera and microphone access was blocked. Allow access in your browser's site settings, then try again.",
  notfound: "No camera or microphone was found. Connect a device, then try again.",
  other: "We couldn't access your camera or microphone. Check your device and try again.",
};

const DeviceSelect: React.FC<{
  label: string;
  value?: string;
  onChange: (id: string) => void;
  options: MediaDeviceInfo[];
}> = ({ label, value, onChange, options }) => (
  <label className="flex flex-col gap-1 text-sm text-text-secondary">
    {label}
    <div className="relative">
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClassName} border-glass-border appearance-none pr-10`}
      >
        {options.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || label}
          </option>
        ))}
      </select>
      <Icon
        icon={ChevronDown}
        size="sm"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
      />
    </div>
  </label>
);

const GreenRoom: React.FC<GreenRoomProps> = ({
  stream,
  streamReady,
  permissionError,
  audioEnabled,
  videoEnabled,
  toggleAudio,
  toggleVideo,
  devices,
  selectedCameraId,
  selectedMicId,
  selectCamera,
  selectMic,
  deviceSwitchError,
  onRetry,
  roomName,
  onJoin,
  onCancel,
  profileStatus,
  onRetryProfile,
  usernameForm,
}) => {
  const micLevel = useMicLevel(stream);

  // callback ref: the <video> remounts on every camera toggle with the same stream, so a [stream] effect would miss it
  const attachStream = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    },
    [stream]
  );

  const showPreviewVideo = !!(stream && videoEnabled);
  const waitingForDevices = !streamReady && !permissionError;
  const [touchDevice] = useState(() => window.matchMedia("(pointer: coarse)").matches);

  return (
    <div className="fixed inset-0 isolate bg-bg text-text">
      <WaveBackground className="-z-10" still={touchDevice} />
      <div className="h-full overflow-y-auto">
        <div className="relative min-h-full flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Back to lounge" className="absolute top-4 left-4">
            <Icon icon={ArrowLeft} size="sm" aria-hidden="true" />
            Lounge
          </Button>
          <Heading level={1}>{roomName ? `Joining ${roomName}` : "Joining the call"}</Heading>

          <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden bg-surface border border-glass-border">
            {showPreviewVideo ? (
              <video
                ref={attachStream}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-secondary">
                <Icon icon={waitingForDevices ? Video : VideoOff} size="xl" aria-hidden="true" />
                <span className="text-sm">{waitingForDevices ? "Allow camera and mic to join" : "Camera off"}</span>
              </div>
            )}
          </div>

          <div className="w-full max-w-md flex items-center gap-3">
            <Icon icon={Mic} size="sm" className="text-text-secondary shrink-0" aria-hidden="true" />
            <div
              role="meter"
              aria-label="Microphone level"
              aria-valuenow={Math.round(micLevel * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-75 motion-reduce:transition-none"
                style={{ width: `${micLevel * 100}%` }}
              />
            </div>
          </div>

          {/* hidden on any permission error: pickers/toggles would be empty no-ops */}
          {!permissionError && (
            <>
              <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <DeviceSelect label="Camera" value={selectedCameraId} onChange={selectCamera} options={devices.cameras} />
                <DeviceSelect label="Microphone" value={selectedMicId} onChange={selectMic} options={devices.mics} />
              </div>

              {deviceSwitchError && (
                <p role="alert" className="flex items-center gap-2 text-danger text-sm max-w-md">
                  <Icon icon={ShieldAlert} size="sm" aria-hidden="true" />
                  {deviceSwitchError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <MediaToggle kind="mic" off={!audioEnabled} onClick={toggleAudio} />
                <MediaToggle kind="camera" off={!videoEnabled} onClick={toggleVideo} />
              </div>
            </>
          )}

          {permissionError ? (
            <div className="flex flex-col items-center gap-3 max-w-md">
              <p role="alert" className="flex items-center gap-2 text-danger text-sm">
                <Icon icon={ShieldAlert} size="sm" aria-hidden="true" />
                {PERMISSION_MESSAGES[permissionError]}
              </p>
              <Button variant="secondary" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : profileStatus === "error" ? (
            <div className="flex flex-col items-center gap-3 max-w-md">
              <p className="text-sm text-text-secondary">Couldn't load your profile.</p>
              <Button variant="secondary" onClick={onRetryProfile}>
                Try again
              </Button>
            </div>
          ) : usernameForm ? (
            <div className="w-full max-w-sm">
              <Heading level={2}>Pick a username</Heading>
              <p className="mt-1 mb-4 text-sm text-text-secondary">This is how you'll show up in the call.</p>
              <UsernameForm form={usernameForm} />
            </div>
          ) : (
            <Button size="lg" onClick={onJoin} disabled={!streamReady || profileStatus === "loading"} className="min-w-[10rem]">
              Join
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GreenRoom;
