import { useCallback, useEffect, useState } from 'react';
import MenuOverlay, { type MenuItem } from './MenuOverlay';
import { lockScroll, unlockScroll } from '../utils/scroll';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}
const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Home', icon: '🖥️' },
  { id: 'about', label: 'About', icon: '📄' },
  { id: 'verticals', label: 'Verticals', icon: '🗂️' },
  { id: 'projects', label: 'Projects', icon: '🛠️' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'team', label: 'Crew', icon: '👥' },
];

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (menuOpen) lockScroll();
    return () => { if (menuOpen) unlockScroll(); };
  }, [menuOpen]);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const go = (id: string) => {
    setMenuOpen(false);
    window.setTimeout(() => onNavigate(id), 30);
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-40" aria-label="Main Navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-40 flex items-center justify-between h-14 sm:h-16 rounded-full mt-2 sm:mt-3 px-3 sm:px-5 border bg-[#0B0A16]/65 backdrop-blur-md border-white/10 shadow-lg">
          <button onClick={() => go('home')} className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none" aria-label="B/Stack Home">
            <div className="font-display font-black text-xl tracking-tighter text-[#E6EDF7] drop-shadow-[0_2px_6px_rgba(83,74,183,0.8)]">
              B<span className="text-[#67E8F9]">/</span>Stack
            </div>
          </button>
          <button type="button" className="win95-trigger" onClick={() => setMenuOpen(value => !value)}
            aria-expanded={menuOpen} aria-controls="win95-site-menu" aria-haspopup="dialog"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            <span className="win95-trigger-icon" aria-hidden="true">🖥️</span>
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>
      <MenuOverlay open={menuOpen} items={MENU_ITEMS} activeId={activeSection} onSelect={go} onClose={closeMenu} />
    </nav>
  );
}
