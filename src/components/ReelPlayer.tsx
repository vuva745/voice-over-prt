"use client";

import { useEffect, useRef, useState } from "react";
import { downloadReel } from "@/lib/video-cache";

type ReelPlayerProps = {
  src: string;
  className?: string;
  autoPlay?: boolean;
  title?: string;
};

/**
 * Downloads each reel into Cache Storage, then plays from a local Blob URL.
 * That removes mid-play network buffering (VLC-smooth local playback).
 * `avbridge` / libav assets stay installed via `npm run vlc:deps` for format support tooling.
 */
export function ReelPlayer({
  src,
  className,
  autoPlay = true,
  title,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"download" | "ready" | "error">("download");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cancelled = false;
    setError(null);
    setPhase("download");
    setProgress(0);

    (async () => {
      try {
        const blob = await downloadReel(src, (pct) => {
          if (!cancelled) setProgress(pct);
        });
        if (cancelled) return;

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        video.preload = "auto";
        video.src = objectUrl;
        video.load();
        setPhase("ready");
        setProgress(100);

        if (autoPlay) {
          await video.play().catch(() => undefined);
        }
      } catch (err) {
        if (cancelled) return;
        setPhase("error");
        setError(err instanceof Error ? err.message : "Could not load video.");
        video.src = src;
        video.load();
        if (autoPlay) void video.play().catch(() => undefined);
      }
    })();

    return () => {
      cancelled = true;
      video.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, autoPlay]);

  const showOverlay = phase === "download";

  return (
    <div className={`reel-player-wrap${showOverlay ? " is-buffering" : ""}`}>
      <video
        ref={videoRef}
        className={className}
        controls
        playsInline
        preload="auto"
        title={title}
      />
      {showOverlay ? (
        <div className="reel-player-overlay" aria-live="polite">
          <p className="reel-player-status">Downloading {progress}%</p>
          <div className="reel-download-track" aria-hidden>
            <div className="reel-download-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="reel-player-status is-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
