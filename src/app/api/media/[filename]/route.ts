import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/videos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ filename: string }> };

/** Default window when the client asks for bytes=N- without an end. */
const RANGE_WINDOW = 4 * 1024 * 1024;

function contentTypeFor(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".m4v":
      return "video/x-m4v";
    case ".avi":
      return "video/x-msvideo";
    case ".ogg":
      return "video/ogg";
    case ".mkv":
      return "video/x-matroska";
    default:
      return "video/mp4";
  }
}

function isSafeFilename(name: string) {
  return Boolean(name) && name === path.basename(name) && !name.includes("..");
}

function streamResponse(
  filePath: string,
  start: number | undefined,
  end: number | undefined,
  headers: HeadersInit,
  status: number,
  signal?: AbortSignal,
) {
  const nodeStream =
    start != null && end != null
      ? createReadStream(filePath, { start, end })
      : createReadStream(filePath);

  const onAbort = () => {
    nodeStream.destroy();
  };
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  // Swallow premature-close / abort noise so client cancels don't crash Next.
  nodeStream.on("error", () => undefined);

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk: string | Buffer) => {
        try {
          const bytes =
            typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(bytes));
        } catch {
          nodeStream.destroy();
        }
      });
      nodeStream.on("end", () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
      nodeStream.on("error", () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new NextResponse(webStream, { status, headers });
}

export async function GET(request: NextRequest, { params }: Params) {
  const { filename: raw } = await params;
  const filename = path.basename(decodeURIComponent(raw));
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!isSafeFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const fileSize = statSync(filePath).size;
  const range = request.headers.get("range");
  const type = contentTypeFor(filename);

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      return new NextResponse(null, { status: 416 });
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2]
      ? Number(match[2])
      : Math.min(start + RANGE_WINDOW - 1, fileSize - 1);

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start >= fileSize ||
      end >= fileSize ||
      start > end
    ) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    return streamResponse(
      filePath,
      start,
      end,
      {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      206,
      request.signal,
    );
  }

  return streamResponse(
    filePath,
    undefined,
    undefined,
    {
      "Content-Length": String(fileSize),
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    200,
    request.signal,
  );
}

export async function HEAD(_request: NextRequest, ctx: Params) {
  const { filename: raw } = await ctx.params;
  const filename = path.basename(decodeURIComponent(raw));
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!isSafeFilename(filename) || !existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }

  const fileSize = statSync(filePath).size;
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": contentTypeFor(filename),
      "Accept-Ranges": "bytes",
    },
  });
}
