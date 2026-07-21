import { existsSync, promises as fs } from "fs";
import path from "path";
import seedReels from "@/data/reels.json";

export type VideoItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  filename: string;
  createdAt: string;
};

function projectRoot() {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    process.cwd(),
    path.join(process.cwd(), "Desktop", "voice over"),
    path.join(home, "Desktop", "voice over"),
  ];

  for (const candidate of candidates) {
    if (
      existsSync(path.join(candidate, "src", "data", "reels.json")) ||
      existsSync(path.join(candidate, "public", "uploads"))
    ) {
      return candidate;
    }
  }

  return process.cwd();
}

const ROOT = projectRoot();
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "videos.json");
export const UPLOADS_DIR = path.join(ROOT, "public", "uploads");

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      await fs.writeFile(DATA_FILE, JSON.stringify(seedReels, null, 2), "utf8");
    }
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(seedReels, null, 2), "utf8");
  }
}

export async function getVideos(): Promise<VideoItem[]> {
  await ensureStorage();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const videos = JSON.parse(raw) as VideoItem[];
    if (Array.isArray(videos) && videos.length > 0) {
      return videos.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
  } catch {
    // fall through to seed
  }
  return [...(seedReels as VideoItem[])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveVideos(videos: VideoItem[]) {
  await ensureStorage();
  await fs.writeFile(DATA_FILE, JSON.stringify(videos, null, 2), "utf8");
}

export async function addVideo(
  item: Omit<VideoItem, "id" | "createdAt">,
): Promise<VideoItem> {
  const videos = await getVideos();
  const video: VideoItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  videos.unshift(video);
  await saveVideos(videos);
  return video;
}

export async function deleteVideo(id: string): Promise<boolean> {
  const videos = await getVideos();
  const target = videos.find((v) => v.id === id);
  if (!target) return false;

  const next = videos.filter((v) => v.id !== id);
  await saveVideos(next);

  try {
    await fs.unlink(path.join(UPLOADS_DIR, target.filename));
  } catch {
    // File may already be gone; metadata removal is enough.
  }

  return true;
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
