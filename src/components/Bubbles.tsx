const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 4 + ((i * 7) % 12),
  duration: 9 + ((i * 5) % 11),
  delay: -((i * 3.3) % 14),
}));

/** فقاعات خفيفة بالخلفية (تختفي مع prefers-reduced-motion) */
export function Bubbles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-[-20px] animate-rise rounded-full border border-white/25 bg-white/5"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
