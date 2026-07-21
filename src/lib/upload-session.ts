import { promises as fs } from "fs";
import path from "path";
import { addVideo, sanitizeFilename, UPLOADS_DIR, type VideoItem } from "@/lib/videos";

export type UploadSession = {
  id: string;
  filename: string;
  title: string;
  category: string;
  description: string;
  totalChunks: number;
  received: number[];
  createdAt: number;
};

const TMP_DIR = path.join(process.cwd(), "data", "tmp-uploads");

function sessionFile(id: string) {
  return path.join(TMP_DIR, `${id}.session.json`);
}

export async function ensureUploadDirs() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
}

async function writeSession(session: UploadSession) {
  await ensureUploadDirs();
  await fs.writeFile(sessionFile(session.id), JSON.stringify(session), "utf8");
}

export async function createSession(input: {
  originalName: string;
  title: string;
  category: string;
  description: string;
  totalChunks: number;
}): Promise<UploadSession> {
  const id = crypto.randomUUID();
  const ext = path.extname(input.originalName) || ".mp4";
  const safe = sanitizeFilename(path.basename(input.originalName, ext)) || "clip";
  const filename = `${Date.now()}-${safe}${ext}`;

  const session: UploadSession = {
    id,
    filename,
    title: input.title,
    category: input.category,
    description: input.description,
    totalChunks: input.totalChunks,
    received: [],
    createdAt: Date.now(),
  };

  await writeSession(session);
  return session;
}

export async function getSession(id: string): Promise<UploadSession | null> {
  try {
    const raw = await fs.readFile(sessionFile(id), "utf8");
    return JSON.parse(raw) as UploadSession;
  } catch {
    return null;
  }
}

export function chunkPath(uploadId: string, index: number) {
  return path.join(TMP_DIR, `${uploadId}.${index}.part`);
}

export async function saveChunk(uploadId: string, index: number, data: Buffer) {
  const session = await getSession(uploadId);
  if (!session) throw new Error("Upload session not found. Start again.");
  if (index < 0 || index >= session.totalChunks) {
    throw new Error("Invalid chunk index.");
  }

  await ensureUploadDirs();
  await fs.writeFile(chunkPath(uploadId, index), data);

  if (!session.received.includes(index)) {
    session.received.push(index);
    session.received.sort((a, b) => a - b);
    await writeSession(session);
  }
}

export async function finalizeUpload(uploadId: string): Promise<VideoItem> {
  const session = await getSession(uploadId);
  if (!session) throw new Error("Upload session not found. Start again.");

  if (session.received.length !== session.totalChunks) {
    throw new Error(
      `Missing chunks (${session.received.length}/${session.totalChunks}). Try again.`,
    );
  }

  await ensureUploadDirs();
  const dest = path.join(UPLOADS_DIR, session.filename);

  // Write chunks sequentially without holding the whole file in one Buffer.concat
  const handle = await fs.open(dest, "w");
  try {
    for (let i = 0; i < session.totalChunks; i++) {
      const part = await fs.readFile(chunkPath(uploadId, i));
      await handle.write(part);
    }
  } finally {
    await handle.close();
  }

  await Promise.all(
    Array.from({ length: session.totalChunks }, (_, i) =>
      fs.unlink(chunkPath(uploadId, i)).catch(() => undefined),
    ),
  );
  await fs.unlink(sessionFile(uploadId)).catch(() => undefined);

  return addVideo({
    title: session.title,
    category: session.category,
    description: session.description,
    filename: session.filename,
  });
}

export async function abortUpload(uploadId: string) {
  const session = await getSession(uploadId);
  if (!session) return;
  await Promise.all(
    Array.from({ length: session.totalChunks }, (_, i) =>
      fs.unlink(chunkPath(uploadId, i)).catch(() => undefined),
    ),
  );
  await fs.unlink(sessionFile(uploadId)).catch(() => undefined);
}

