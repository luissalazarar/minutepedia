const express = require("express");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 8080;
const RENDER_SECRET = process.env.RENDER_SECRET || "";

app.get("/health", (_req, res) => res.status(200).send("ok"));

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

app.post("/render", async (req, res) => {
  try {
    const auth = req.headers["authorization"] || "";
    if (RENDER_SECRET && auth !== `Bearer ${RENDER_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Render de prueba: mp4 negro 2s 1080p (valida ffmpeg + cloud run)
    const work = fs.mkdtempSync(path.join("/tmp/", "render-"));
    const outMp4 = path.join(work, "video.mp4");

    await run("ffmpeg", [
      "-y",
      "-f", "lavfi",
      "-i", "color=c=black:s=1920x1080:d=2",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      outMp4
    ]);

    const file = fs.readFileSync(outMp4);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", file.length);
    res.status(200).send(file);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.listen(PORT, () => console.log(`renderer listening on :${PORT}`));
