const ITEMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'X', 'COA read-throughs', 'Unboxings', 'Lab tours', 'Myth vs fact'];

export default function MarqueeStrip() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {ITEMS.map((t, i) => <span key={`a${i}`}>{t}</span>)}
        {ITEMS.map((t, i) => <span key={`b${i}`}>{t}</span>)}
      </div>
    </div>
  );
}
