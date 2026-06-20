import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchTrendingGifs, searchGifs, giphyConfigured } from "../lib/giphy";

export default function GifPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!giphyConfigured) {
      setLoading(false);
      return;
    }
    fetchTrendingGifs()
      .then(setGifs)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!giphyConfigured) return;
    const timeout = setTimeout(() => {
      setLoading(true);
      searchGifs(query)
        .then(setGifs)
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="glass-panel rounded-2xl p-3 w-80 shadow-2xl"
    >
      {!giphyConfigured ? (
        <div className="text-sm text-mist p-3 text-center leading-relaxed">
          GIFs need a free Giphy API key. Add{" "}
          <code className="text-paper">VITE_GIPHY_API_KEY</code> to your{" "}
          <code className="text-paper">.env</code> file to enable this tab.
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-sm mb-2 outline-none focus-ring placeholder:text-mist/60"
          />
          <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
                ))
              : gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => onSelect(gif.full)}
                    className="aspect-square overflow-hidden rounded-lg focus-ring hover:ring-2 hover:ring-signal transition-all"
                  >
                    <img src={gif.preview} alt={gif.title} className="w-full h-full object-cover" />
                  </button>
                ))}
          </div>
          {!loading && gifs.length === 0 && (
            <p className="text-mist text-sm text-center py-4">No GIFs found.</p>
          )}
        </>
      )}
    </motion.div>
  );
}
