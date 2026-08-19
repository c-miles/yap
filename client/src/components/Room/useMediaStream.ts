import { useEffect, useState, useRef } from "react";
import { UseMediaStreamProps } from "../../types/mediaStreamTypes";
import { VIDEO_CONSTRAINTS } from "./videoEncoding";

interface DeviceLists {
  cameras: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
}

export default function useMediaStream({ onStreamUpdated }: UseMediaStreamProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [permissionError, setPermissionError] = useState<'denied' | 'notfound' | 'other' | null>(null);
  const [videoPermissionError, setVideoPermissionError] = useState<'denied' | 'notfound' | 'other' | null>(null);
  const [devices, setDevices] = useState<DeviceLists>({ cameras: [], mics: [] });
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [selectedMicId, setSelectedMicId] = useState<string | undefined>(undefined);
  const [deviceSwitchError, setDeviceSwitchError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitialized = useRef(false);
  const acquiring = useRef(false);
  const acquiringVideo = useRef(false);
  const switching = useRef(false);
  const selectedCameraIdRef = useRef<string | undefined>(undefined);
  const selectedMicIdRef = useRef<string | undefined>(undefined);

  // Enumerate cameras/mics; re-run on permission grant and devicechange.
  const enumerateAndSetDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: deviceList.filter((device) => device.kind === "videoinput"),
        mics: deviceList.filter((device) => device.kind === "audioinput"),
      });
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  // Request audio+video up front so the green room can show a live preview
  const acquireMedia = () => {
    if (acquiring.current) {
      // Already in flight (e.g. rapid retry clicks) — don't open a second concurrent capture session.
      return Promise.resolve();
    }
    acquiring.current = true;
    return navigator.mediaDevices
      .getUserMedia({ audio: true, video: VIDEO_CONSTRAINTS })
      .then((mediaStream) => {
        if (!isInitialized.current) {
          // Unmounted (or retry superseded) while the permission prompt was open — don't strand a live camera/mic session.
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        // Belt-and-suspenders: stop any prior session before replacing it so an overlapping acquisition never leaks a live camera/mic.
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setStreamReady(true);
        setPermissionError(null);
        setVideoEnabled(true);
        return enumerateAndSetDevices().then(() => {
          // Seed the selects from the device actually acquired, so the green
          // room dropdowns show the live camera/mic before the user switches.
          const camId = mediaStream.getVideoTracks()[0]?.getSettings().deviceId;
          const micId = mediaStream.getAudioTracks()[0]?.getSettings().deviceId;
          if (camId) {
            setSelectedCameraId(camId);
            selectedCameraIdRef.current = camId;
          }
          if (micId) {
            setSelectedMicId(micId);
            selectedMicIdRef.current = micId;
          }
        });
      })
      .catch((error) => {
        console.error("Error getting audio/video stream:", error);
        isInitialized.current = false;
        if (error.name === 'NotAllowedError') {
          setPermissionError('denied');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('notfound');
        } else {
          setPermissionError('other');
        }
      })
      .finally(() => {
        acquiring.current = false;
      });
  };

  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    isInitialized.current = true;

    acquireMedia();

    // Cleanup function that only runs on actual unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      isInitialized.current = false;
    };
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateAndSetDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && streamReady && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [streamReady, stream]);

  // TODO: Validate functionality by testing on two machines when able/deployed
  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(audioTracks.some((track) => track.enabled));

      // TODO: Implement this in socketEvents server side, reflect in peer's UI
      // socket?.emit("audioToggled", {
      //   roomId,
      //   audioEnabled: audioTracks.some(track => track.enabled),
      // });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      // ended tracks count as absent — iOS kills the video track outright on
      // backgrounding/incoming calls, and a toggle-on has to recover from that
      const videoTrack = stream.getVideoTracks().find((track) => track.readyState === "live");
      if (videoTrack) {
        // Video track exists, just toggle it
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      } else {
        // no live video track (never acquired, or iOS ended it mid-call) — and
        // iOS allows only one live capture session, so a video-only getUserMedia
        // here could mute our audio. acquire a fresh audio+video session, swap
        // it in everywhere, then retire the old one.
        if (acquiringVideo.current) {
          return;
        }
        acquiringVideo.current = true;
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: VIDEO_CONSTRAINTS })
          .then((freshStream) => {
            if (!isInitialized.current) {
              // room unmounted while the permission prompt was open — don't
              // strand a live camera/mic session
              freshStream.getTracks().forEach((track) => track.stop());
              return;
            }

            // read live mute state at swap time, not click time — the user may
            // have toggled mute while the permission prompt was open
            const wasAudioEnabled =
              streamRef.current?.getAudioTracks().some((track) => track.enabled) ?? audioEnabled;
            freshStream.getAudioTracks().forEach((track) => {
              track.enabled = wasAudioEnabled;
            });

            const oldStream = streamRef.current;
            streamRef.current = freshStream;
            setStream(freshStream);
            setVideoEnabled(true);

            Promise.resolve(onStreamUpdated?.(freshStream))
              .catch((error) => {
                console.error("Error updating peer connections with new stream:", error);
              })
              .finally(() => {
                oldStream?.getTracks().forEach((track) => track.stop());
              });
          })
          .catch((error) => {
            console.error("Error getting video stream:", error);
            if (error.name === 'NotAllowedError') {
              setVideoPermissionError('denied');
            } else if (error.name === 'NotFoundError') {
              setVideoPermissionError('notfound');
            } else {
              setVideoPermissionError('other');
            }
          })
          .finally(() => {
            acquiringVideo.current = false;
          });
      }
    }
  };

  // Constraints for the device kind NOT being switched — honor an already
  // selected device on that side instead of falling back to defaults.
  const videoConstraintsFor = (cameraId?: string): MediaTrackConstraints =>
    cameraId ? { ...VIDEO_CONSTRAINTS, deviceId: { exact: cameraId } } : VIDEO_CONSTRAINTS;

  const audioConstraintsFor = (micId?: string): MediaTrackConstraints | boolean =>
    micId ? { deviceId: { exact: micId } } : true;

  // Mirrors toggleVideo's iOS recovery: carry enable-states onto the new stream, swap, stop the old tracks (never strand a live session).
  const swapToNewDevice = (
    newStream: MediaStream,
    onDone: () => void
  ) => {
    if (!isInitialized.current) {
      // room unmounted while the permission prompt was open
      newStream.getTracks().forEach((track) => track.stop());
      onDone();
      return;
    }

    const wasAudioEnabled =
      streamRef.current?.getAudioTracks().some((track) => track.enabled) ?? audioEnabled;
    const wasVideoEnabled =
      streamRef.current?.getVideoTracks().some((track) => track.enabled) ?? videoEnabled;

    newStream.getAudioTracks().forEach((track) => {
      track.enabled = wasAudioEnabled;
    });
    newStream.getVideoTracks().forEach((track) => {
      track.enabled = wasVideoEnabled;
    });

    const oldStream = streamRef.current;
    streamRef.current = newStream;
    setStream(newStream);

    Promise.resolve(onStreamUpdated?.(newStream))
      .catch((error) => {
        console.error("Error updating peer connections with new stream:", error);
        // Local preview switched but replaceTrack failed — remote peers see a dead track. Surface it rather than fake success.
        setDeviceSwitchError("Couldn't apply the new device to the call.");
      })
      .finally(() => {
        oldStream?.getTracks().forEach((track) => track.stop());
        onDone();
      });
  };

  const selectDevice = (kind: "camera" | "mic", deviceId: string) => {
    // Single guard shared across camera/mic: switching both kinds serializes
    // switches (rather than letting a camera and mic switch interleave and
    // re-acquire the other side from a not-yet-committed ref).
    if (switching.current) {
      return;
    }
    switching.current = true;

    const cameraId = kind === "camera" ? deviceId : selectedCameraIdRef.current;
    const micId = kind === "mic" ? deviceId : selectedMicIdRef.current;

    navigator.mediaDevices
      .getUserMedia({
        audio: audioConstraintsFor(micId),
        video: videoConstraintsFor(cameraId),
      })
      .then((newStream) => {
        // commit the selected id only after getUserMedia resolves — else the
        // dropdown shows a device the live stream hasn't switched to
        if (kind === "camera") {
          setSelectedCameraId(deviceId);
          selectedCameraIdRef.current = deviceId;
        } else {
          setSelectedMicId(deviceId);
          selectedMicIdRef.current = deviceId;
        }
        setDeviceSwitchError(null);
        swapToNewDevice(newStream, () => {
          switching.current = false;
        });
      })
      .catch((error) => {
        console.error(`Error switching ${kind}:`, error);
        // keep last-known-good selection; don't lie about which device is live
        setDeviceSwitchError("Couldn't switch to that device — it may be in use by another app.");
        switching.current = false;
      });
  };

  const selectCamera = (deviceId: string) => selectDevice("camera", deviceId);
  const selectMic = (deviceId: string) => selectDevice("mic", deviceId);

  const retryMediaAccess = async () => {
    console.log("Retrying media access...");
    setPermissionError(null);
    setStreamReady(false);
    isInitialized.current = true;

    await acquireMedia();
  };

  const retryVideoAccess = () => {
    setVideoPermissionError(null);
    // User can just try clicking the video button again
  };

  return {
    audioEnabled,
    devices,
    deviceSwitchError,
    localVideoRef,
    permissionError,
    retryMediaAccess,
    retryVideoAccess,
    selectCamera,
    selectedCameraId,
    selectedMicId,
    selectMic,
    setVideoPermissionError,
    stream,
    streamReady,
    toggleAudio,
    toggleVideo,
    videoEnabled,
    videoPermissionError,
  };
}
