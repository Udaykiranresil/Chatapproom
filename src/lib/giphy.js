const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const BASE = "https://api.giphy.com/v1/gifs";

export const giphyConfigured = Boolean(GIPHY_KEY && GIPHY_KEY !== "YOUR-GIPHY-API-KEY");

export async function fetchTrendingGifs(limit = 18) {
  if (!giphyConfigured) return [];
  const res = await fetch(`${BASE}/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=pg-13`);
  if (!res.ok) throw new Error("Failed to load trending GIFs");
  const json = await res.json();
  return mapGifs(json.data);
}

export async function searchGifs(query, limit = 18) {
  if (!giphyConfigured) return [];
  if (!query.trim()) return fetchTrendingGifs(limit);
  const res = await fetch(
    `${BASE}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg-13`
  );
  if (!res.ok) throw new Error("Failed to search GIFs");
  const json = await res.json();
  return mapGifs(json.data);
}

function mapGifs(data) {
  return data.map((g) => ({
    id: g.id,
    preview: g.images.fixed_height_small?.url || g.images.fixed_height.url,
    full: g.images.fixed_height.url,
    title: g.title || "GIF",
  }));
}
