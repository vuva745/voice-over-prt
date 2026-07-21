import { NextRequest, NextResponse } from "next/server";
import { deleteVideo } from "@/lib/videos";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const removed = await deleteVideo(id);

  if (!removed) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
