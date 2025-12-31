import { NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import axios from "axios";

import { generateScript } from "@/app/lib/openai";
import { chunkText } from "@/app/lib/chunk";
import { searchPexelsImages } from "@/app/lib/pexels";
import { zipFromPaths } from "@/app/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { topic: string };

function safeName(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60);
}

async function downloadToFile(url: string, outPath: string) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
  await fsp.writeFile(outPath, Buffer.from(res.data));
}

function pickQueryFromChunk(chunk: string) {
  // Heurística simple: primeras 6–10 palabras “visuales”
  const cleaned = chunk
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").slice(0, 10);
  return words.join(" ");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const topic = (body?.topic || "").trim();
    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    // Workspace temporal
    const runId = crypto.randomBytes(8).toString("hex");
    const baseDir = path.join(os.tmpdir(), `minutepedia_${safeName(topic)}_${runId}`);
    const imagesDir = path.join(baseDir, "images");
    await fsp.mkdir(imagesDir, { recursive: true });

    // 1) Guion
    const script = await generateScript(topic);
    const scriptPath = path.join(baseDir, "script.txt");
    await fsp.writeFile(scriptPath, script, "utf-8");

    // 2) Chunks (para buscar imágenes)
    const chunks = chunkText(script, 320);

    // 3) Pexels: 1 imagen por chunk (o menos si quieres)
    const savedImages: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const q = pickQueryFromChunk(chunks[i]);
      const urls = await searchPexelsImages(q, 6);
      if (!urls.length) continue;

      // elige la primera
      const imgUrl = urls[0];
      const imgPath = path.join(imagesDir, `${String(i + 1).padStart(2, "0")}.jpg`);
      await downloadToFile(imgUrl, imgPath);
      savedImages.push(imgPath);

      // límite práctico (para no bajar 80 imágenes si el guion se chunkeara mucho)
      if (savedImages.length >= 18) break;
    }

    // 4) Zip
    const files = [
      { name: "script.txt", path: scriptPath },
      ...savedImages.map((p, idx) => ({
        name: `images/${String(idx + 1).padStart(2, "0")}.jpg`,
        path: p,
      })),
    ];

    const zipBuf = await zipFromPaths(files);

    // Limpieza best-effort
    fsp.rm(baseDir, { recursive: true, force: true }).catch(() => {});

    return new NextResponse(zipBuf, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="minutepedia_${safeName(topic)}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
