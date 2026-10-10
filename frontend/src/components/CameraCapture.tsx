import { useEffect, useRef, useState } from "react";
import { Camera, Circle, Loader2, RotateCcw, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 30;

function pickVideoType() {
  const types = ["video/mp4", "video/webm;codecs=vp8", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

/** Live camera only: take a photo or record a short video. No gallery/file upload. */
export default function CameraCapture({
  capture,
  onCapture,
}: {
  capture: File | null;
  onCapture: (file: File | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [starting, setStarting] = useState(false);
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  };

  useEffect(() => () => stopStream(), []);

  useEffect(() => {
    if (!capture) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(capture);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capture]);

  const start = async () => {
    setError("");
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: mode === "video",
      }).catch(() =>
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
      );
      streamRef.current = stream;
      setLive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("Camera access was blocked. Allow camera permission in your browser and try again.");
    } finally {
      setStarting(false);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stopStream();
      },
      "image/jpeg",
      0.9,
    );
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const type = pickVideoType();
    const recorder = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 2_000_000 } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const mime = (recorder.mimeType || type || "video/webm").split(";")[0];
      const blob = new Blob(chunks, { type: mime });
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      onCapture(new File([blob], `capture-${Date.now()}.${ext}`, { type: mime }));
      stopStream();
    };
    recorderRef.current = recorder;
    recorder.start(500);
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stopRecording();
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  if (capture && previewUrl) {
    return (
      <div className="space-y-3" data-testid="capture-preview">
        {capture.type.startsWith("video/") ? (
          <video src={previewUrl} controls playsInline className="max-h-72 w-full rounded-xl bg-black object-contain" />
        ) : (
          <img src={previewUrl} alt="Captured evidence" className="max-h-72 w-full rounded-xl object-contain" />
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => onCapture(null)} data-testid="retake-button">
          <RotateCcw className="size-4" aria-hidden /> Retake
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2" role="tablist">
        {(["photo", "video"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? "default" : "outline"}
            disabled={recording}
            onClick={() => {
              if (mode !== m) {
                stopStream();
                setMode(m);
              }
            }}
            data-testid={`capture-mode-${m}`}
          >
            {m === "photo" ? <Camera className="size-4" aria-hidden /> : <Video className="size-4" aria-hidden />}
            {m === "photo" ? "Photo" : "Video"}
          </Button>
        ))}
      </div>

      {live ? (
        <div className="space-y-3">
          <video ref={videoRef} muted playsInline className="max-h-72 w-full rounded-xl bg-black object-contain" />
          {mode === "photo" ? (
            <Button type="button" onClick={takePhoto} className="w-full" data-testid="take-photo-button">
              <Camera className="size-4" aria-hidden /> Take photo
            </Button>
          ) : recording ? (
            <Button type="button" variant="destructive" onClick={stopRecording} className="w-full" data-testid="stop-recording-button">
              <Square className="size-4" aria-hidden /> Stop ({seconds}s / {MAX_SECONDS}s)
            </Button>
          ) : (
            <Button type="button" onClick={startRecording} className="w-full" data-testid="start-recording-button">
              <Circle className="size-4 fill-current" aria-hidden /> Start recording
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/35 bg-secondary/40 px-4 py-8 text-center transition-colors hover:border-primary/70 hover:bg-secondary/70",
          )}
          data-testid="open-camera-button"
        >
          {starting ? (
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          ) : (
            <Camera className="size-6 text-primary" aria-hidden />
          )}
          <span className="text-sm font-semibold">Open camera to {mode === "photo" ? "take a photo" : "record a video"}</span>
          <span className="text-xs text-muted-foreground">Live capture only — gallery uploads are not allowed</span>
        </button>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
