import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";
import TwinOrbit from "../components/TwinOrbit";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <div className="flex justify-center mb-8">
          <TwinOrbit size={64} />
        </div>

        <p className="font-mono text-xs tracking-[0.25em] text-signal-glow uppercase mb-4">
          Two people. No history.
        </p>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
          A room that exists
          <br />
          only while you do.
        </h1>

        <p className="text-mist text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
          Create a private room, send the link to one other person, and talk.
          The moment either of you leaves, every message disappears — for good.
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/create")}
          className="group relative inline-flex items-center gap-2 bg-signal hover:bg-signal-dim text-white font-medium px-8 py-4 rounded-full text-base transition-colors focus-ring shadow-[0_0_40px_rgba(124,92,252,0.35)]"
        >
          Get started
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>

        <div className="mt-12 flex items-center justify-center gap-6 text-mist/70 text-xs font-mono uppercase tracking-wide">
          <span>No sign-up</span>
          <span className="w-1 h-1 rounded-full bg-mist/40" />
          <span>No history</span>
          <span className="w-1 h-1 rounded-full bg-mist/40" />
          <span>Just two of you</span>
        </div>
      </motion.div>
    </div>
  );
}
