import JSZip from "jszip";
import fs from "fs";

export async function zipFromPaths(files: { name: string; path: string }[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const f of files) {
    const buf = fs.readFileSync(f.path);
    zip.file(f.name, buf);
  }

  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return out as Buffer;
}
