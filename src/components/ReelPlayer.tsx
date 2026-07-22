"use client";

import { useEffect, useRef, useState } from "react";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlaybackRateButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaPipButton,
  MediaLoadingIndicator,
} from "media-chrome/react";
import { downloadReel } from "@/lib/video-cache";

type ReelPlayerProps = {
  src: string;
  className?: string;
  autoPlay?: boolean;
  title?: string;
};

/**
 * Media Chrome control plugins + blob/progressive source loading.
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

    const playFromBlob = async (blob: Blob) => {
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
      if (autoPlay) await video.play().catch(() => undefined);
    };

    const playProgressive = async () => {
      video.preload = "auto";
      video.src = src;
      video.load();
      setPhase("ready");
      if (autoPlay) await video.play().catch(() => undefined);
    };

    const isSameOrigin =
      src.startsWith("/") ||
      (typeof window !== "undefined" && src.startsWith(window.location.origin));

    (async () => {
      // Local /videos files: stream directly — no full download needed.
      if (isSameOrigin) {
        try {
          await playProgressive();
        } catch (err) {
          if (!cancelled) {
            setPhase("error");
            setError(err instanceof Error ? err.message : "Could not load video.");
          }
        }
        return;
      }

      try {
        const probe = await fetch(src, { headers: { Range: "bytes=0-200" } });
        const head = new TextDecoder().decode((await probe.arrayBuffer()).slice(0, 64));
        if (head.startsWith("version https://git-lfs.github.com/spec/v1")) {
          throw new Error(
            "Video file is a Git LFS pointer. Production should use the GitHub media CDN URL.",
          );
        }

        const blob = await downloadReel(src, (pct) => {
          if (!cancelled) setProgress(pct);
        });
        if (cancelled) return;

        if (blob.size < 10_000) {
          throw new Error("Video file is too small to play.");
        }

        await playFromBlob(blob);
      } catch (err) {
        if (cancelled) return;
        try {
          await playProgressive();
        } catch {
          setPhase("error");
          setError(err instanceof Error ? err.message : "Could not load video.");
        }
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
      <MediaController className="reel-media-controller">
        <video
          ref={videoRef}
          slot="media"
          className={className}
          playsInline
          preload="auto"
          title={title}
          crossOrigin="anonymous"
        />
        <MediaLoadingIndicator slot="centered-chrome" />
        <MediaControlBar className="reel-control-bar">
          <MediaPlayButton />
          <MediaSeekBackwardButton seekOffset={5} />
          <MediaSeekForwardButton seekOffset={5} />
          <MediaTimeRange />
          <MediaTimeDisplay showDuration />
          <MediaMuteButton />
          <MediaVolumeRange />
          <MediaPlaybackRateButton />
          <MediaPipButton />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>

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
