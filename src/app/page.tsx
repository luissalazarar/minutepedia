"use client";

import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);

  async function generarVideo() {
    setLoading(true);

    try {
      const res = await fetch("/api/render", {
        method: "POST",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "video.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error generando video");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>MinutePedia</h1>
      <p>Generador automático de videos</p>

      <button onClick={generarVideo} disabled={loading}>
        {loading ? "Generando..." : "Generar video"}
      </button>
    </main>
  );
}
