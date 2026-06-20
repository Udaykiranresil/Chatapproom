import { useState } from "react";

export default function CopyLinkField({ link }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context) -- fail quietly.
    }
  }

  return (
    <div className="flex items-stretch gap-2 w-full">
      <div className="flex-1 min-w-0 bg-white/5 border border-glass-border rounded-xl px-4 py-3 font-mono text-sm text-paper truncate">
        {link}
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 px-4 rounded-xl text-sm font-medium bg-signal hover:bg-signal-dim transition-colors focus-ring"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
