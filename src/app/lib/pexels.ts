import axios from "axios";

const PEXELS_API = "https://api.pexels.com/v1/search";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function searchPexelsImages(query: string, perPage = 6): Promise<string[]> {
  const key = mustEnv("PEXELS_API_KEY");

  const { data } = await axios.get(PEXELS_API, {
    headers: { Authorization: key },
    params: {
      query,
      per_page: perPage,
      orientation: "landscape",
      size: "large",
    },
    timeout: 20000,
  });

  const photos = Array.isArray(data?.photos) ? data.photos : [];
  const urls = photos
    .map((p: any) => p?.src?.large || p?.src?.original)
    .filter(Boolean);

  // Dedup básico
  return Array.from(new Set(urls));
}
