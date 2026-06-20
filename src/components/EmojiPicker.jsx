import { useState } from "react";
import { motion } from "framer-motion";

const CATEGORIES = {
  Smileys: ["😀", "😂", "🥹", "😍", "😘", "😎", "🤔", "😉", "😅", "😭", "🥳", "😴", "🙃", "🫠", "😬", "🤯"],
  Gestures: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "✌️", "🤞", "👋", "💪", "🫶", "👀", "🤙", "🫡"],
  Hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕", "💞", "✨"],
  Vibes: ["🔥", "💯", "🎉", "🎊", "🚀", "⭐", "🌟", "☕", "🍕", "🎵", "💤", "🌈", "🍀", "⚡"],
};

export default function EmojiPicker({ onSelect }) {
  const [active, setActive] = useState("Smileys");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="glass-panel rounded-2xl p-3 w-72 shadow-2xl"
    >
      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors focus-ring ${
              active === cat ? "bg-signal text-white" : "text-mist hover:bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
        {CATEGORIES[active].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="text-xl leading-none p-1.5 rounded-lg hover:bg-white/8 transition-colors focus-ring"
            aria-label={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
