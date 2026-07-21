"use client";

import { useEffect, useRef, useState } from "react";

type ReelPlayerProps = {
  src: string;
  className?: string;
  autoPlay?: boolean;
  title?: string;
};

/**
 * Progressive HTML5 playback from /uploads (Range-friendly).
 * Avoids full-file download-to-blob so large reels work on Vercel/CDN.
 */
export function ReelPlayer({
  src,
  className,
  autoPlay = true,
  title,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cancelled = false;
    setBuffering(true);
    setError(null);

    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => {
      setBuffering(false);
      if (!cancelled && autoPlay) {
        void video.play().catch(() => undefined);
      }
    };
    const onError = () => {
      setBuffering(false);
      setError(
        "Video failed to load. If this is a fresh deploy, enable Git LFS in Vercel → Project Settings → Git, then redeploy.",
      );
    };

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);

    // Probe that the asset is a real media file, not a Git LFS pointer (~130 bytes of text).
    void (async () => {
      try {
        const head = await fetch(src, {
          method: "GET",
          headers: { Range: "bytes=0-200" },
        });
        const buf = await head.arrayBuffer();
        const text = new TextDecoder().decode(buf.slice(0, 64));
        if (text.startsWith("version https://git-lfs.github.com/spec/v1")) {
          if (!cancelled) {
            setBuffering(false);
            setError(
              "Deploy is serving Git LFS pointers, not videos. Enable Git LFS in Vercel Project Settings → Git, then Redeploy.",
            );
          }
          return;
        }
      } catch {
        // Ignore probe failures; still try to play.
      }

      if (cancelled) return;
      video.preload = "auto";
      video.src = src;
      video.load();
      if (autoPlay) void video.play().catch(() => undefined);
    })();

    return () => {
      cancelled = true;
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, autoPlay]);

  return (
    <div className={`reel-player-wrap${buffering ? " is-buffering" : ""}`}>
      <video
        ref={videoRef}
        className={className}
        controls
        playsInline
        preload="auto"
        title={title}
      />
      {buffering && !error ? (
        <p className="reel-player-status" aria-live="polite">
          Loading…
        </p>
      ) : null}
      {error ? (
        <p className="reel-player-status is-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
