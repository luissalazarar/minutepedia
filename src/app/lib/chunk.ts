export function chunkText(text: string, maxChars = 360): string[] {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Divide por oraciones sin romper abreviaturas simple
  const sentences = clean.split(/(?<=[.!?])\s+/);

  const chunks: string[] = [];
  let cur = "";

  for (const s of sentences) {
    const next = (cur ? cur + " " : "") + s;
    if (next.length > maxChars) {
      if (cur.trim()) chunks.push(cur.trim());
      // Si una sola oración es gigante, la cortamos por longitud
      if (s.length > maxChars) {
        let start = 0;
        while (start < s.length) {
          chunks.push(s.slice(start, start + maxChars).trim());
          start += maxChars;
        }
        cur = "";
      } else {
        cur = s;
      }
    } else {
      cur = next;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}
