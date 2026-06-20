import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";
import { supabase } from "../lib/supabaseClient";
import { useAnonymousAuth } from "../hooks/useAnonymousAuth";
import { generateRoomCode } from "../utils/roomCode";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { userId, status, error: authError } = useAnonymousAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!userId || creating) return;
    setCreating(true);
    setError(null);

    try {
      // Small retry loop in the unlikely event of a code collision.
      let room = null;
      for (let attempt = 0; attempt < 4 && !room; attempt++) {
        const code = generateRoomCode();
        const { data, error: insertError } = await supabase
          .from("rooms")
          .insert({ code })
          .select()
          .single();

        if (!insertError) {
          room = data;
        } else if (insertError.code !== "23505") {
          // Not a unique-violation -- a real error, stop retrying.
          throw insertError;
        }
      }

      if (!room) throw new Error("Could not generate a unique room code. Please try again.");

      const { error: joinError } = await supabase
        .from("room_participants")
        .insert({ room_id: room.id, user_id: userId });

      if (joinError) throw joinError;

      navigate(`/room/${room.code}`);
    } catch (err) {
      setError(err.message || "Something went wrong creating the room.");
      setCreating(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="glass-panel rounded-3xl p-8 text-center">
          <p className="font-mono text-xs tracking-[0.25em] text-signal-glow uppercase mb-3">
            Step 1 of 2
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-3">
            Create your room
          </h1>
          <p className="text-mist text-sm leading-relaxed mb-8">
            We'll generate a private link. Send it to the one person you want
            in here with you — as soon as they open it, the room locks to just
            the two of you.
          </p>

          {(error || authError) && (
            <div className="mb-5 text-sm text-ember bg-ember/10 border border-ember/20 rounded-xl px-4 py-3">
              {error || "Couldn't start a session. Please refresh and try again."}
            </div>
          )}

          <motion.button
            whileHover={{ scale: status === "ready" ? 1.02 : 1 }}
            whileTap={{ scale: status === "ready" ? 0.98 : 1 }}
            onClick={handleCreate}
            disabled={status !== "ready" || creating}
            className="w-full bg-signal hover:bg-signal-dim disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-full transition-colors focus-ring shadow-[0_0_30px_rgba(124,92,252,0.3)]"
          >
            {status === "loading"
              ? "Preparing..."
              : creating
              ? "Creating room..."
              : "Create room"}
          </motion.button>

          <Link
            to="/"
            className="block mt-5 text-mist text-sm hover:text-paper transition-colors focus-ring"
          >
            ← Back
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
