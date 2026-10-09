import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/public/Hero';
import MarqueeStrip from '../components/public/MarqueeStrip';
import HowItWorks from '../components/public/HowItWorks';
import BentoSection from '../components/public/BentoSection';
import RewardsCalculator from '../components/public/RewardsCalculator';
import StandardSection from '../components/public/StandardSection';
import ApplyForm from '../components/public/ApplyForm';
import Closer from '../components/public/Closer';

gsap.registerPlugin(ScrollTrigger);

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function PublicPage() {
  useEffect(() => {
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (RM) return;
    const ctx = gsap.context(() => {
      gsap.from('.h-copy > *', { opacity: 0, y: 18, duration: 0.8, stagger: 0.09, ease: 'power3.out' });
      gsap.from('.stage', { opacity: 0, y: 40, duration: 1.1, delay: 0.25, ease: 'power3.out' });
      document.querySelectorAll('.head').forEach((h) =>
        gsap.from(h.children, { opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: h, start: 'top 85%' } })
      );
      gsap.from('.bento .tile', { opacity: 0, y: 24, scale: 0.98, duration: 0.6, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: '.bento', start: 'top 80%' } });
      gsap.from('.calc', { opacity: 0, y: 30, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: '.calc', start: 'top 85%' } });
      gsap.from('.standard .col', { opacity: 0, y: 24, duration: 0.7, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '.standard', start: 'top 85%' } });
    });
    return () => ctx.revert();
  }, []);

  return (
    <main id="view-public" tabIndex={-1}>
      <Hero onApply={() => scrollToId('apply')} onTour={() => scrollToId('inside')} />
      <MarqueeStrip />
      <HowItWorks />
      <BentoSection />
      <RewardsCalculator />
      <StandardSection />
      <ApplyForm />
      <Closer onApply={() => scrollToId('apply')} />
    </main>
  );
}
