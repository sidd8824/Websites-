import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerLenis, scrollToY, scrollToElement, docTop } from './utils/scroll';
import GlobalDoodleFilter from './components/GlobalDoodleFilter';
import FlyThroughPage from './components/FlyThroughPage';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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

function HomePage({ onNavigate }: { onNavigate: (sectionId: string) => void }) {
  return (
    <main className="relative z-10 w-full overflow-x-clip">
      <HeroSection onNavigate={onNavigate} />
      <AboutSection />
      <VerticalsSection onNavigate={onNavigate} />
      <EventsSection onNavigate={onNavigate} />
      <JoinSection />
      <FooterSection />
    </main>
  );
}

function ProjectsPage() {
  return (
    <main className="relative z-10 w-full overflow-x-clip">
      <ProjectsSection scrollProgress={0} />
      <FooterSection />
    </main>
  );
}

function CrewPage() {
  return (
    <main className="relative z-10 w-full overflow-x-clip">
      <div className="min-h-screen pt-20">
        <TeamSection />
      </div>
      <FooterSection />
    </main>
  );
}

function SiteApp() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (location.pathname === '/projects') {
      setActiveSection('projects');
      return;
    }
    if (location.pathname === '/team') {
      setActiveSection('team');
      return;
    }
    setActiveSection('home');
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0);
      const sections = ['home', 'about', 'verticals', 'events', 'join'];
      const currentScroll = scrollY + window.innerHeight * 0.35;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = docTop(el);
          if (currentScroll >= top && currentScroll < top + el.offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleNavbarNavigate = (sectionId: string) => {
    if (sectionId === 'projects') {
      navigate('/projects');
      scrollToY(0);
      return;
    }
    if (sectionId === 'team') {
      navigate('/team');
      scrollToY(0);
      return;
    }
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => {
        if (sectionId === 'home') scrollToY(0);
        else {
          const el = document.getElementById(sectionId);
          if (el) scrollToElement(el);
        }
      }, 80);
      return;
    }
    if (sectionId === 'home') {
      scrollToY(0);
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) scrollToElement(el);
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#E6EDF7] font-body selection:bg-[#67E8F9] selection:text-[#0B0A16]">
      <GlobalDoodleFilter />
      <FixedBackground />
      <CustomCursor />
      <StageMascot />
      <Navbar activeSection={activeSection} onNavigate={handleNavbarNavigate} />
      <Routes>
        <Route path="/" element={<HomePage onNavigate={handleNavbarNavigate} />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/team" element={<CrewPage />} />
        <Route path="*" element={<HomePage onNavigate={handleNavbarNavigate} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/flythrough" element={<FlyThroughPage />} />
      <Route path="*" element={<SiteApp />} />
    </Routes>
  );
}
