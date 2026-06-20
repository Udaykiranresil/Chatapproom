/**
 * The app's signature element. Two dots represent the two people a room can
 * ever hold. While waiting for a partner, they orbit apart. Once both are
 * present, they lock into a connected, glowing pair.
 */
export default function TwinOrbit({ connected = false, size = 56 }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="status"
      aria-label={connected ? "Both people connected" : "Waiting for the other person"}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {connected ? (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-signal shadow-[0_0_12px_rgba(124,92,252,0.8)]" />
            <span className="w-4 h-[2px] bg-gradient-to-r from-signal to-ember rounded-full" />
            <span className="w-3 h-3 rounded-full bg-ember shadow-[0_0_12px_rgba(255,107,107,0.8)]" />
          </div>
        ) : (
          <>
            <span className="absolute w-2.5 h-2.5 rounded-full bg-signal shadow-[0_0_10px_rgba(124,92,252,0.8)] animate-orbit-a" />
            <span className="absolute w-2.5 h-2.5 rounded-full bg-mist/40 animate-orbit-b" />
          </>
        )}
      </div>
    </div>
  );
}
