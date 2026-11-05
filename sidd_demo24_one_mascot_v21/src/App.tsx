import { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerLenis, scrollToY, scrollToElement, docTop } from './utils/scroll';
import GlobalDoodleFilter from './components/GlobalDoodleFilter';
import ProjectsReveal from './components/ProjectsReveal';
import FlyThroughPage from './components/FlyThroughPage';
import { Routes, Route } from 'react-router-dom';
import FixedBackground from './components/FixedBackground';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import StageMascot from './components/StageMascot';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import VerticalsSection from './components/VerticalsSection';
import ProjectsSection from './components/ProjectsSection';
import EventsSection from './components/EventsSection';
import TeamSection from './components/TeamSection';
import JoinSection from './components/JoinSection';
import FooterSection from './components/FooterSection';

gsap.registerPlugin(ScrollTrigger);

function HomePage({ scrollProgress }: { scrollProgress: number }) {
  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'home') {
      scrollToY(0);
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) scrollToElement(el);
  };

  return (
    <main className="relative z-10 w-full overflow-x-clip">
      {/* 1. Hero Section (terminal wordmark intro) */}
      <HeroSection onNavigate={handleNavigate} />

      {/* 2. About (Anti-design collage & flickering counters) */}
      <AboutSection />

      {/* 3. Verticals (3D Layer Stack & Dossiers) */}
      <VerticalsSection onNavigate={handleNavigate} />

      {/* 4. Transition: three boxes -> middle one expands while the letters of PROJECTS assemble */}
      <ProjectsReveal />

      {/* 4b. Projects (Winding polaroid road & tech stickers) */}
      <ProjectsSection scrollProgress={scrollProgress} />

      {/* 5. Events (Hero paper ticket & countdown) */}
      <EventsSection onNavigate={handleNavigate} />

      {/* 6. Team ("THE CREW!" trading-card deck with 3D flip) */}
      <TeamSection />

      {/* 7. Join us (5th slot 3D stack & playful form) */}
      <JoinSection />

      {/* 8. Site Footer with Extruded Wordmark */}
      <FooterSection />
    </main>
  );
}

function SiteApp() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    registerLenis(lenis);

    // Drive Lenis from GSAP's ticker and tell ScrollTrigger about every Lenis
    // scroll, so scrubbed animations never drift out of sync.
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  // Track overall scroll progress & active sections
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
      setScrollProgress(progress);

      // Other sections
      const sections = ['home', 'about', 'verticals', 'projects', 'events', 'team', 'join'];
      const currentScroll = scrollY + window.innerHeight * 0.35;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = docTop(el);
          const height = el.offsetHeight;
          if (currentScroll >= top && currentScroll < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavbarNavigate = (sectionId: string) => {
    if (sectionId === 'home') {
      scrollToY(0);
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) scrollToElement(el);
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#E6EDF7] font-body selection:bg-[#67E8F9] selection:text-[#0B0A16]">
      {/* Hidden Global SVG Filters for Organic Hand-Drawn Wobble */}
      <GlobalDoodleFilter />

      {/* ONE Fixed Full-Screen Background Layer interpolating smoothly across sections */}
      <FixedBackground />

      {/* Custom Context-Aware Desktop Cursor */}
      <CustomCursor />

      {/* The ONE hanging mascot for the Projects transition + reel */}
      <StageMascot />

      {/* Top Navbar */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavbarNavigate}
      />

      <HomePage scrollProgress={scrollProgress} />
    </div>
  );
}

// The main site lives at "/", the fly-through scene at "/flythrough".
export default function App() {
  return (
    <Routes>
      <Route path="/flythrough" element={<FlyThroughPage />} />
      <Route path="*" element={<SiteApp />} />
    </Routes>
  );
}
