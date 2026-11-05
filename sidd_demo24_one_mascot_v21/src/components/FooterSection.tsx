import { useState } from 'react';
import { CLUB_META } from '../data/club';
import { Github, Instagram, Linkedin, Mail, ArrowUp, Rocket } from 'lucide-react';
import { scrollToY } from '../utils/scroll';

export default function FooterSection() {
  const [rocketAscending, setRocketAscending] = useState(false);

  const handleBackToTop = () => {
    setRocketAscending(true);
    scrollToY(0);
    setTimeout(() => {
      setRocketAscending(false);
    }, 1400);
  };

  return (
    <footer
      className="relative w-full pt-20 pb-12 border-t border-white/5 bg-[#06050E]/90 backdrop-blur-md select-none"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to top rocket launcher button */}
        <div className="flex justify-center -mt-28 mb-12">
          <button
            onClick={handleBackToTop}
            data-magnetic="true"
            className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full glass glow-cyan text-[#E6EDF7] font-mono text-xs font-bold uppercase tracking-wider transition-all transform hover:scale-105 cursor-pointer"
          >
            <Rocket
              className={`w-4 h-4 text-[#67E8F9] transform transition-transform ${
                rocketAscending ? '-translate-y-8 opacity-0' : 'group-hover:-translate-y-1'
              }`}
            />
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#A7A3C7]" />
          </button>
        </div>

        {/* GIANT EXTRUDED WORDMARK */}
        <div className="w-full flex items-center justify-center my-8 overflow-hidden">
          <span className="font-display font-black text-5xl min-[400px]:text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-tight leading-none wordmark-extrusion opacity-90 select-none">
            B<span className="text-[#67E8F9]">/</span>Stack
          </span>
        </div>

        {/* Navigation & Social Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-y border-white/10">
          <div className="text-center md:text-left">
            <p className="font-body text-sm text-[#E6EDF7] font-semibold">
              {CLUB_META.heroSubtitle}
            </p>
            <p className="font-mono text-xs text-[#A7A3C7] mt-1">
              B/Algo · B/Uild · B/Hack · B/Dev · {CLUB_META.established}
            </p>
          </div>

          {/* Social icons */}
          <div className="flex items-center space-x-4">
            <a
              href={CLUB_META.socials.github}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-[#E6EDF7] hover:text-[#67E8F9] transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href={CLUB_META.socials.instagram}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-[#E6EDF7] hover:text-[#67E8F9] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={CLUB_META.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-[#E6EDF7] hover:text-[#67E8F9] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href={`mailto:${CLUB_META.socials.email}`}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-[#E6EDF7] hover:text-[#67E8F9] transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#A7A3C7]/70 gap-4">
          <div>
            © 20XX B/Stack Tech Club. Built with passion by student builders.
          </div>
          <div>
            Bosscoder School of Technology · Autonomous Student Chapter
          </div>
        </div>
      </div>
    </footer>
  );
}
