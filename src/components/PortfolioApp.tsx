"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/components/Graphics";
import { HeroPhotoStage, MoodGallery } from "@/components/PhotoStages";
import type { VideoItem } from "@/types/video";

export type { VideoItem };

/** Heavy player + reel list — deferred so hero text/images paint first. */
const SelectedWork = lazy(() => import("@/components/SelectedWork"));

function SelectedWorkFallback() {
  return (
    <section id="work" className="section work">
      <div className="section-head">
        <span className="section-index">01</span>
        <div>
          <h2>Selected work</h2>
          <p>Loading your reels…</p>
        </div>
      </div>
      <div className="loading-block">
        <div className="loading-bar" />
        <p className="muted">Loading reels…</p>
      </div>
    </section>
  );
}

const CATEGORIES = ["Commercial", "Narration", "Character", "Promo", "Reel", "Other"];
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|ogg|mkv)$/i;
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks — avoids Next body limits

function isVideoFile(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("video/")) return true;
  return VIDEO_EXT.test(file.name);
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || `Request failed (${res.status})` };
  }
}

async function uploadVideoFile(
  file: File,
  meta: { title: string; category: string; description: string },
  onProgress: (pct: number) => void,
): Promise<VideoItem> {
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  const initRes = await fetch("/api/videos/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "init",
      originalName: file.name,
      title: meta.title,
      category: meta.category,
      description: meta.description,
      totalChunks,
      type: file.type,
      size: file.size,
    }),
  });
  const initData = await readJson(initRes);
  if (!initRes.ok || !initData.uploadId) {
    throw new Error(initData.error || "Could not start upload.");
  }

  const uploadId = String(initData.uploadId);

  try {
    for (let index = 0; index < totalChunks; index++) {
      const start = index * CHUNK_SIZE;
      const blob = file.slice(start, start + CHUNK_SIZE);

      const form = new FormData();
      form.append("uploadId", uploadId);
      form.append("index", String(index));
      form.append("chunk", blob, `part-${index}`);

      const chunkRes = await fetch("/api/videos/upload", {
        method: "POST",
        body: form,
      });
      const chunkData = await readJson(chunkRes);
      if (!chunkRes.ok) {
        throw new Error(chunkData.error || `Chunk ${index + 1} failed.`);
      }

      onProgress(Math.round(((index + 1) / (totalChunks + 1)) * 100));
    }

    const doneRes = await fetch("/api/videos/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", uploadId }),
    });
    const video = await readJson(doneRes);
    if (!doneRes.ok || !video.id) {
      throw new Error(video.error || "Could not finalize upload.");
    }

    onProgress(100);
    return video as VideoItem;
  } catch (err) {
    await fetch("/api/videos/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "abort", uploadId }),
    }).catch(() => undefined);
    throw err;
  }
}

export default function PortfolioApp({
  initialVideos = [],
}: {
  initialVideos?: VideoItem[];
}) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [loading, setLoading] = useState(initialVideos.length === 0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(initialVideos[0]?.id ?? null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Reel",
    description: "",
    file: null as File | null,
  });

  const [success, setSuccess] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load videos.");
      const data = (await res.json()) as VideoItem[];
      setVideos(data);
      setFocusId((prev) => {
        if (prev && data.some((v) => v.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
      setError(null);
    } catch {
      if (initialVideos.length === 0) {
        setError("Unable to load your portfolio reels.");
      }
    } finally {
      setLoading(false);
    }
  }, [initialVideos.length]);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  function pickFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(null);
    if (!isVideoFile(file)) {
      setError("Please choose a video file (MP4, WebM, MOV, M4V, AVI).");
      return;
    }
    setForm((f) => ({
      ...f,
      file,
      title: f.title.trim() || file.name.replace(/\.[^.]+$/, ""),
    }));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const file = form.file;
    const title = form.title.trim() || file?.name.replace(/\.[^.]+$/, "") || "";

    if (!file) {
      setError("Choose a video file first.");
      return;
    }
    if (!title) {
      setError("Add a title for this reel.");
      return;
    }

    setUploading(true);
    setProgress(1);

    try {
      const video = await uploadVideoFile(
        file,
        {
          title,
          category: form.category,
          description: form.description.trim(),
        },
        setProgress,
      );

      setVideos((prev) => [video, ...prev.filter((v) => v.id !== video.id)]);
      setFocusId(video.id);
      setForm({ title: "", category: "Reel", description: "", file: null });
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(`Uploaded “${video.title}”. Playing in Selected work.`);
      window.setTimeout(() => {
        document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setProgress(0);
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this video from your portfolio?")) return;

    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete video.");
      return;
    }

    setVideos((prev) => {
      const next = prev.filter((v) => v.id !== id);
      setFocusId((current) => (current === id ? (next[0]?.id ?? null) : current));
      return next;
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="page">
      <div className="grain" aria-hidden />
      <div className="aurora" aria-hidden />
      <div className="orb orb-a" aria-hidden />
      <div className="orb orb-b" aria-hidden />
      <div className="orb orb-c" aria-hidden />

      <header className="nav">
        <a className="brand" href="#top">
          KAHARE
        </a>
        <nav className="nav-links">
          <a href="#work">Work</a>
          <a href="#upload">Upload</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <HeroPhotoStage />
          <div className="hero-content">
            <p className="hero-kicker">Voice over portfolio</p>
            <h1 className="hero-brand">KAHARE</h1>
            <p className="hero-line">
              Commercials, narration, and character work — clear, grounded, and built to land.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#work">
                <PlayIcon />
                Watch reels{videos.length > 0 ? ` (${videos.length})` : ""}
              </a>
              <a className="btn btn-ghost" href="#upload">
                Upload video
              </a>
            </div>
          </div>
        </section>

        <Suspense fallback={<SelectedWorkFallback />}>
          <SelectedWork
            videos={videos}
            loading={loading}
            focusId={focusId}
            onDelete={handleDelete}
            onError={setError}
          />
        </Suspense>

        <MoodGallery />

        <section id="upload" className="section upload">
          <div className="section-head">
            <span className="section-index">03</span>
            <div>
              <h2>Studio desk</h2>
              <p>Drop a video file, add a title, and publish it to your portfolio.</p>
            </div>
          </div>

          <form className="upload-form" onSubmit={handleUpload}>
            <label
              className={`dropzone ${dragOver ? "is-over" : ""} ${form.file ? "has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={onDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.ogg,.mkv"
                className="sr-only"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                }}
              />
              {form.file ? (
                <>
                  <strong>{form.file.name}</strong>
                  <span>
                    {(form.file.size / (1024 * 1024)).toFixed(1)} MB — click to change
                  </span>
                </>
              ) : (
                <>
                  <strong>Drop video here or click to browse</strong>
                  <span>MP4, WebM, MOV, M4V, AVI · no size limit</span>
                </>
              )}
            </label>

            <div className="fields">
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="National spot — brand name"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional notes about the client, role, or direction."
                  rows={3}
                />
              </label>
            </div>

            {progress > 0 ? (
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-fill" style={{ width: `${progress}%` }} />
                <span className="progress-label">{progress}%</span>
              </div>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}
            {success ? <p className="form-success">{success}</p> : null}

            <button className="btn btn-primary" type="submit" disabled={uploading || !form.file}>
              {uploading ? `Uploading… ${progress}%` : "Publish to portfolio"}
            </button>
          </form>
        </section>

        <section id="contact" className="section contact">
          <div className="contact-shell">
            <div className="section-head">
              <span className="section-index">04</span>
              <div>
                <h2>Let’s talk</h2>
                <p>Available for commercials, explainers, audiobooks, and character work.</p>
              </div>
            </div>
            <a className="contact-mail" href="mailto:hello@example.com">
              hello@example.com
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Kahare</span>
        <span>Voice over portfolio</span>
      </footer>
    </div>
  );
}
