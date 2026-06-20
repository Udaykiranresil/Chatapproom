const PARTICLES = [
  { left: "8%", top: "20%", size: 6, delay: "0s", duration: "7s" },
  { left: "85%", top: "15%", size: 4, delay: "1.2s", duration: "8s" },
  { left: "20%", top: "75%", size: 5, delay: "0.6s", duration: "6.5s" },
  { left: "70%", top: "70%", size: 7, delay: "2s", duration: "9s" },
  { left: "45%", top: "10%", size: 3, delay: "1.6s", duration: "7.5s" },
  { left: "92%", top: "55%", size: 5, delay: "0.3s", duration: "6s" },
  { left: "12%", top: "50%", size: 4, delay: "2.4s", duration: "8.5s" },
];

export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-signal/30 blur-[1px] animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-signal/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-ember/10 blur-[120px]" />
    </div>
  );
}
