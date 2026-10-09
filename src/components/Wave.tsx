// Ported from the original animated .wave bars (#bentoWave / #coachWave).
export default function Wave({ id, style }: { id?: string; style?: React.CSSProperties }) {
  const bars = Array.from({ length: 36 }, (_, i) => ({
    height: 10 + Math.round(Math.abs(Math.sin(i * 0.55) * 34)),
    delay: -((i % 9) * 0.13),
  }));
  return (
    <div className="wave" id={id} style={style}>
      {bars.map((b, i) => (
        <i key={i} style={{ height: `${b.height}px`, animationDelay: `${b.delay}s` }} />
      ))}
    </div>
  );
}
