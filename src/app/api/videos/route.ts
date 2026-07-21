import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import {
  addVideo,
  getVideos,
  sanitizeFilename,
  UPLOADS_DIR,
} from "@/lib/videos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|ogg|mkv)$/i;

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).name === "string"
  );
}

function looksLikeVideo(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("video/")) return true;
  if (VIDEO_EXT.test(file.name)) return true;
  // Windows often sends an empty MIME type for local video picks
  if (!type || type === "application/octet-stream") {
    return VIDEO_EXT.test(file.name);
  }
  return false;
}

async function writeUpload(file: File, dest: string) {
  await fs.mkdir(path.dirname(dest), { recursive: true });

  if (typeof file.stream === "function") {
    const nodeStream = Readable.fromWeb(
      file.stream() as import("stream/web").ReadableStream,
    );
    await pipeline(nodeStream, createWriteStream(dest));
    return;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
}

export async function GET() {
  const videos = await getVideos();
  return NextResponse.json(videos);
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const fileField = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "Reel").trim() || "Reel";
    const description = String(form.get("description") ?? "").trim();

    if (!isUploadedFile(fileField)) {
      return NextResponse.json(
        { error: "Video file is required. Choose a file and try again." },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!looksLikeVideo(fileField)) {
      return NextResponse.json(
        { error: "Unsupported format. Use MP4, WebM, MOV, M4V, or AVI." },
        { status: 400 },
      );
    }

    const safeBase = sanitizeFilename(fileField.name) || `clip-${Date.now()}.mp4`;
    const filename = `${Date.now()}-${safeBase}`;
    const dest = path.join(UPLOADS_DIR, filename);

    await writeUpload(fileField, dest);

    const video = await addVideo({
      title,
      category,
      description,
      filename,
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Upload failed:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 },
    );
  }
}
