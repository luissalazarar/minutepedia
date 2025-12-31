import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RENDER_URL =
  process.env.RENDER_URL ||
  "https://minutepedia-render-974782876868.us-central1.run.app/render";

const RENDER_SECRET = process.env.RENDER_SECRET || "";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));

    const res = await fetch(RENDER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RENDER_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("CloudRun render failed:", res.status, text);
      return NextResponse.json(
        { error: "Render failed", status: res.status, detail: text },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="video.mp4"',
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("API /api/render error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
