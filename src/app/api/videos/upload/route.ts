import { NextRequest, NextResponse } from "next/server";
import {
  abortUpload,
  createSession,
  finalizeUpload,
  saveChunk,
} from "@/lib/upload-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|ogg|mkv)$/i;

function looksLikeVideo(name: string, type?: string) {
  const t = (type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return VIDEO_EXT.test(name);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Chunk binary upload: multipart with fields uploadId, index, chunk
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const uploadId = String(form.get("uploadId") ?? "");
      const index = Number(form.get("index"));
      const chunk = form.get("chunk");

      if (!uploadId || Number.isNaN(index)) {
        return NextResponse.json({ error: "Invalid chunk payload." }, { status: 400 });
      }

      if (
        typeof chunk !== "object" ||
        chunk === null ||
        typeof (chunk as Blob).arrayBuffer !== "function"
      ) {
        return NextResponse.json({ error: "Chunk data missing." }, { status: 400 });
      }

      const buffer = Buffer.from(await (chunk as Blob).arrayBuffer());
      await saveChunk(uploadId, index, buffer);
      return NextResponse.json({ ok: true, index });
    }

    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "init") {
      const originalName = String(body.originalName ?? "clip.mp4");
      const title = String(body.title ?? "").trim();
      const category = String(body.category ?? "Reel").trim() || "Reel";
      const description = String(body.description ?? "").trim();
      const totalChunks = Number(body.totalChunks);

      if (!title) {
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
      }
      if (!looksLikeVideo(originalName, body.type)) {
        return NextResponse.json(
          { error: "Unsupported format. Use MP4, WebM, MOV, M4V, or AVI." },
          { status: 400 },
        );
      }
      if (!Number.isFinite(totalChunks) || totalChunks < 1 || totalChunks > 20000) {
        return NextResponse.json({ error: "Invalid chunk count." }, { status: 400 });
      }

      const session = await createSession({
        originalName,
        title,
        category,
        description,
        totalChunks,
      });

      return NextResponse.json({ uploadId: session.id, filename: session.filename });
    }

    if (action === "complete") {
      const uploadId = String(body.uploadId ?? "");
      if (!uploadId) {
        return NextResponse.json({ error: "uploadId required." }, { status: 400 });
      }
      const video = await finalizeUpload(uploadId);
      return NextResponse.json(video, { status: 201 });
    }

    if (action === "abort") {
      await abortUpload(String(body.uploadId ?? ""));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Chunked upload failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 500 },
    );
  }
}
