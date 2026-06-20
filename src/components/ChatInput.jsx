import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";

export default function ChatInput({ onSendText, onSendEmoji, onSendGif, disabled }) {
  const [text, setText] = useState("");
  const [openPicker, setOpenPicker] = useState(null); // 'emoji' | 'gif' | null
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendText(trimmed);
    setText("");
    inputRef.current?.focus();
  }

  function togglePicker(name) {
    setOpenPicker((curr) => (curr === name ? null : name));
  }

  return (
    <div className="relative border-t border-glass-border bg-surface/60 backdrop-blur-xl px-3 sm:px-5 py-3">
      <AnimatePresence>
        {openPicker === "emoji" && (
          <div className="absolute bottom-full left-3 mb-3 z-20">
            <EmojiPicker
              onSelect={(emoji) => {
                onSendEmoji(emoji);
                setOpenPicker(null);
              }}
            />
          </div>
        )}
        {openPicker === "gif" && (
          <div className="absolute bottom-full left-3 mb-3 z-20">
            <GifPicker
              onSelect={(url) => {
                onSendGif(url);
                setOpenPicker(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => togglePicker("emoji")}
          disabled={disabled}
          aria-label="Open emoji picker"
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors focus-ring disabled:opacity-40 ${
            openPicker === "emoji" ? "bg-signal/20 text-signal" : "text-mist hover:bg-white/5"
          }`}
        >
          🙂
        </button>
        <button
          type="button"
          onClick={() => togglePicker("gif")}
          disabled={disabled}
          aria-label="Open GIF picker"
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold tracking-wide transition-colors focus-ring disabled:opacity-40 ${
            openPicker === "gif" ? "bg-signal/20 text-signal" : "text-mist hover:bg-white/5"
          }`}
        >
          GIF
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Waiting for the other person to join..." : "Type a message..."}
          className="flex-1 bg-white/5 border border-glass-border rounded-full px-4 py-2.5 text-[15px] outline-none focus-ring placeholder:text-mist/60 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          className="shrink-0 w-10 h-10 rounded-full bg-signal hover:bg-signal-dim disabled:bg-white/10 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus-ring"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 11.5L20 4L13 21L11 13L3 11.5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
