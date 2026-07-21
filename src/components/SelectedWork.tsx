"use client";

import { useEffect, useState } from "react";
import { PlayIcon } from "@/components/Graphics";
import { ReelPlayer } from "@/components/ReelPlayer";
import { mediaUrl } from "@/lib/media-url";
import { prefetchReel, saveReelToDisk } from "@/lib/video-cache";
import type { VideoItem } from "@/types/video";

export type SelectedWorkProps = {
  videos: VideoItem[];
  loading?: boolean;
  /** When set (e.g. after upload), select this reel. */
  focusId?: string | null;
  onDelete: (id: string) => void | Promise<void>;
  onError?: (message: string) => void;
};

export default function SelectedWork({
  videos,
  loading = false,
  focusId = null,
  onDelete,
  onError,
}: SelectedWorkProps) {
  const [activeId, setActiveId] = useState<string | null>(
    focusId ?? videos[0]?.id ?? null,
  );

  useEffect(() => {
    if (focusId && videos.some((v) => v.id === focusId)) {
      setActiveId(focusId);
      return;
    }
    setActiveId((prev) => {
      if (prev && videos.some((v) => v.id === prev)) return prev;
      return videos[0]?.id ?? null;
    });
  }, [videos, focusId]);

  const active = videos.find((v) => v.id === activeId) ?? videos[0] ?? null;

  return (
    <section id="work" className="section work">
      <div className="section-head">
        <span className="section-index">01</span>
        <div>
          <h2>Selected work</h2>
          <p>
            {loading
              ? "Loading your reels…"
              : videos.length > 0
                ? `${videos.length} reels ready — click one to play.`
                : "Upload your first reel from the studio desk below."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-block">
          <div className="loading-bar" />
          <p className="muted">Loading reels…</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty">
          <p>No videos yet — your first reel starts the show.</p>
          <a className="btn btn-ghost" href="#upload">
            Upload your first reel
          </a>
        </div>
      ) : (
        <div className="work-grid">
          <div className="player-panel">
            {active ? (
              <>
                <div className="player-frame">
                  <ReelPlayer
                    key={active.id}
                    className="player"
                    src={mediaUrl(active.filename)}
                    title={active.title}
                  />
                  <div className="player-glow" aria-hidden />
                </div>
                <div className="player-meta">
                  <span className="tag">{active.category}</span>
                  <h3>{active.title}</h3>
                  {active.description ? <p>{active.description}</p> : null}
                  <button
                    type="button"
                    className="btn btn-ghost reel-download-btn"
                    onClick={() =>
                      void saveReelToDisk(
                        mediaUrl(active.filename),
                        active.filename,
                      ).catch(() => onError?.("Could not download this reel."))
                    }
                  >
                    Download reel
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <div className="reel-panel">
            <div className="reel-panel-head">
              <span>Reels</span>
              <em>{videos.length}</em>
            </div>
            <ul className="reel-list">
              {videos.map((video, index) => (
                <li
                  key={video.id}
                  className={`reel-item ${active?.id === video.id ? "is-active" : ""}`}
                >
                  <button
                    type="button"
                    className="reel-select"
                    onMouseEnter={() => {
                      prefetchReel(mediaUrl(video.filename));
                    }}
                    onClick={() => setActiveId(video.id)}
                  >
                    <span className="reel-thumb" aria-hidden>
                      {active?.id === video.id ? (
                        <PlayIcon />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="reel-copy">
                      <strong>{video.title}</strong>
                      <em>{video.category}</em>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="reel-delete"
                    aria-label={`Delete ${video.title}`}
                    onClick={() => void onDelete(video.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
