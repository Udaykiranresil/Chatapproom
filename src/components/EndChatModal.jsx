import { motion, AnimatePresence } from "framer-motion";

export default function EndChatModal({ open, onConfirm, onCancel, busy }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel rounded-3xl p-7 w-full max-w-sm text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-ember/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🕯️</span>
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">End this chat?</h2>
            <p className="text-mist text-sm leading-relaxed mb-6">
              This ends the room for both people right now. Every message is permanently
              deleted — there's no history to come back to.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-paper bg-white/5 hover:bg-white/10 transition-colors focus-ring"
              >
                Stay
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-ember hover:bg-ember-dim transition-colors disabled:opacity-60 focus-ring"
              >
                {busy ? "Ending..." : "End chat"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
