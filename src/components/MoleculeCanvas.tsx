import { useEffect, useRef } from 'react';

// Ported from the original <canvas id="mol"> animated molecule background.
export default function MoleculeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext('2d');
    if (!x) return;
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, N: number[][] = [], a = 0, run = true;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c!.clientWidth; H = c!.clientHeight;
      c!.width = W * dpr; c!.height = H * dpr;
      x!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      N = [];
      const n = W < 700 ? 46 : 84;
      for (let i = 0; i < n; i++) {
        const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = Math.cbrt(Math.random());
        N.push([Math.sqrt(1 - u * u) * Math.cos(t) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(t) * r, Math.random()]);
      }
    }
    function frame() {
      x!.clearRect(0, 0, W, H);
      const cx = W < 1000 ? W * 0.5 : W * 0.72, cy = H * 0.46, R = Math.min(W, H) * (W < 1000 ? 0.55 : 0.46);
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(0.35), sb = Math.sin(0.35);
      const P = N.map((p) => {
        let X = p[0] * ca - p[2] * sa, Z = p[0] * sa + p[2] * ca, Y = p[1] * cb - Z * sb;
        Z = p[1] * sb + Z * cb;
        const s = 2.2 / (2.2 + Z);
        return [cx + X * R * s, cy + Y * R * s, Z, s, p[3]];
      });
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d = Math.hypot(dx, dy), lim = R * 0.28;
          if (d < lim) {
            const al = (1 - d / lim) * 0.32 * ((P[i][3] + P[j][3]) / 2);
            x!.strokeStyle = `rgba(140,200,255,${al})`;
            x!.lineWidth = 1;
            x!.beginPath(); x!.moveTo(P[i][0], P[i][1]); x!.lineTo(P[j][0], P[j][1]); x!.stroke();
          }
        }
      }
      for (const p of P) {
        const r = (1.4 + p[4] * 2.2) * p[3], al = 0.35 + 0.55 * (1 - (p[2] + 1) / 2);
        x!.fillStyle = p[4] > 0.82 ? `rgba(165,139,255,${al})` : `rgba(234,241,244,${al})`;
        x!.beginPath(); x!.arc(p[0], p[1], r, 0, 7); x!.fill();
        if (p[4] > 0.9) {
          x!.fillStyle = `rgba(140,200,255,${al * 0.18})`;
          x!.beginPath(); x!.arc(p[0], p[1], r * 5, 0, 7); x!.fill();
        }
      }
    }
    let raf = 0;
    function loop() { if (run) { a += 0.0018; frame(); } raf = requestAnimationFrame(loop); }
    size(); seed(); frame();
    const onResize = () => { size(); seed(); frame(); };
    window.addEventListener('resize', onResize);
    let io: IntersectionObserver | undefined;
    const onVis = () => { run = !document.hidden && run; };
    if (!RM) {
      io = new IntersectionObserver((e) => { run = e[0].isIntersecting; });
      io.observe(c);
      document.addEventListener('visibilitychange', onVis);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="mol" ref={ref} aria-hidden="true" />;
}
