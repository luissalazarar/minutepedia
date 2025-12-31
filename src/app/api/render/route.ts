import { NextResponse } from "next/server";

export const runtime = "nodejs";       // necesario para Buffer
export const dynamic = "force-dynamic"; // evita cache en Vercel

const RENDER_URL =
  "https://minutepedia-render-974782876868.us-central1.run.app/render";

const RENDER_SECRET = process.env.RENDER_SECRET;

export async function POST() {
  try {
    if (!RENDER_SECRET) {
      return NextResponse.json(
        { error: "RENDER_SECRET not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(RENDER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RENDER_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // aquí irá el payload real
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: "Render service failed",
          status: res.status,
          detail: text,
        },
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
    return NextResponse.json(
      {
        error: "Unexpected error",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
