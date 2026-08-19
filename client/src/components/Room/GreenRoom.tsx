import React, { useCallback } from "react";
import { ChevronDown, Mic, MicOff, ShieldAlert, Video, VideoOff } from "lucide-react";
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
  roomName?: string;
  onJoin: () => void;
}

const PERMISSION_MESSAGES: Record<NonNullable<GreenRoomProps["permissionError"]>, string> = {
  denied: "Camera and microphone access was blocked. Allow access in your browser's site settings, then try again.",
  notfound: "No camera or microphone was found. Connect a device, then try again.",
  other: "We couldn't access your camera or microphone. Check your device and try again.",
};

// a11y: signal off-state with aria-pressed + slashed icon + red fill, never color alone.
const ToggleButton: React.FC<{
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
    className={`focus-ring flex items-center justify-center gap-2 rounded-xl min-w-[48px] min-h-[48px] px-4 text-sm font-medium transition-colors
      ${off ? "bg-danger text-white" : "bg-surface-raised text-text hover:brightness-125"}`}
  >
    <span aria-hidden="true">{off ? offIcon : onIcon}</span>
    <span>{label}</span>
  </button>
);

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
        className="focus-ring w-full appearance-none min-h-[48px] rounded-lg bg-surface-raised text-text border border-border pl-3 pr-10"
      >
        {options.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
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
}) => {
  const micLevel = useMicLevel(stream);

  // callback ref, not a [stream] effect: video and stream can arrive in either order, so an effect could miss the attach.
  const attachStream = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    },
    [stream]
  );

  const showPreviewVideo = !!(stream && videoEnabled);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-bg text-text px-6 text-center overflow-y-auto py-8">
      <h1 className="text-2xl font-semibold">{roomName ? `Joining ${roomName}` : "Joining the call"}</h1>

      <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden bg-surface border border-border">
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
            <VideoOff size={32} aria-hidden="true" />
            <span className="text-sm">Camera off</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-md flex items-center gap-3">
        <Mic size={18} className="text-text-secondary shrink-0" aria-hidden="true" />
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

      {/* Hidden on permission-denied: pickers/toggles would be empty no-ops. */}
      {!permissionError && (
        <>
          <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <DeviceSelect label="Camera" value={selectedCameraId} onChange={selectCamera} options={devices.cameras} />
            <DeviceSelect label="Microphone" value={selectedMicId} onChange={selectMic} options={devices.mics} />
          </div>

          {deviceSwitchError && (
            <p className="flex items-center gap-2 text-danger text-sm max-w-md">
              <ShieldAlert size={18} aria-hidden="true" />
              {deviceSwitchError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <ToggleButton
              label="Mic"
              off={!audioEnabled}
              onClick={toggleAudio}
              onIcon={<Mic size={20} />}
              offIcon={<MicOff size={20} />}
            />
            <ToggleButton
              label="Camera"
              off={!videoEnabled}
              onClick={toggleVideo}
              onIcon={<Video size={20} />}
              offIcon={<VideoOff size={20} />}
            />
          </div>
        </>
      )}

      {permissionError ? (
        <div className="flex flex-col items-center gap-3 max-w-md">
          <p className="flex items-center gap-2 text-danger text-sm">
            <ShieldAlert size={18} aria-hidden="true" />
            {PERMISSION_MESSAGES[permissionError]}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring min-h-[48px] px-6 rounded-xl bg-surface-raised text-text hover:brightness-125 transition"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {!streamReady && (
            <p className="text-text-secondary text-sm max-w-md">
              Allow camera &amp; mic to join.
            </p>
          )}
          <button
            type="button"
            onClick={onJoin}
            disabled={!streamReady}
            className="focus-ring min-h-[48px] px-8 rounded-xl bg-accent text-accent-fg font-semibold hover:bg-accent-hover transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent"
          >
            Join
          </button>
        </>
      )}
    </div>
  );
};

export default GreenRoom;
