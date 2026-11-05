import { useCallback, useEffect, useState } from 'react';
import MenuOverlay, { type MenuItem } from './MenuOverlay';
import { lockScroll, unlockScroll } from '../utils/scroll';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

// Every section link lives inside the menu.
const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'verticals', label: 'Verticals' },
  { id: 'projects', label: 'Projects' },
  { id: 'events', label: 'Events' },
  { id: 'team', label: 'Team' },
];

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // The page behind the full-screen menu stays put while it is open.
  useEffect(() => {
    if (menuOpen) lockScroll();
    return () => {
      if (menuOpen) unlockScroll();
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const go = (id: string) => {
    setMenuOpen(false);
    // The scroll lock is released by the effect above; give it a tick so Lenis is running again.
    window.setTimeout(() => onNavigate(id), 30);
  };

  const open = menuOpen;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" aria-label="Main Navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`relative z-40 flex items-center justify-between h-14 sm:h-16 rounded-full mt-2 sm:mt-3 px-3 sm:px-5 border transition-all duration-300 ${
            open
              ? 'bg-transparent border-transparent shadow-none'
              : 'bg-[#0B0A16]/65 backdrop-blur-md border-white/10 shadow-lg'
          }`}
        >
          {/* Logo */}
          <button
            onClick={() => go('home')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            aria-label="B/Stack Home"
          >
            <div className="font-display font-black text-xl tracking-tighter">
              <span
                className={`transition-colors duration-300 ${
                  open ? 'text-[#0B0A16]' : 'text-[#E6EDF7] drop-shadow-[0_2px_6px_rgba(83,74,183,0.8)]'
                }`}
              >
                B<span className={open ? 'text-[#7C5CF0]' : 'text-[#67E8F9]'}>/</span>Stack
              </span>
            </div>
            <span
              className={`hidden lg:inline-block font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded border transition-colors duration-300 ${
                open ? 'text-[#0B0A16]/60 border-[#0B0A16]/25' : 'text-[#A7A3C7] border-[#A7A3C7]/30'
              }`}
            >
              Bosscoder Tech
            </span>
          </button>

          {/* Menu toggle, right side */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            data-magnetic="true"
            className={`inline-flex items-center gap-2 pl-4 pr-3 py-1.5 sm:py-2 rounded-full border font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] cursor-pointer transition-colors duration-300 ${
              open
                ? 'bg-[#0B0A16] text-[#F4F0E6] border-[#0B0A16] hover:bg-[#7C5CF0] hover:border-[#7C5CF0]'
                : 'bg-white/10 text-[#E6EDF7] border-white/20 hover:bg-white/20'
            }`}
          >
            <span>{open ? 'Close' : 'Menu'}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              {open ? (
                <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M1.5 4.5h11M1.5 9.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <MenuOverlay open={open} items={MENU_ITEMS} activeId={activeSection} onSelect={go} onClose={closeMenu} />
    </nav>
  );
}
