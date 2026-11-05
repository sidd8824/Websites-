import { useState, useRef, useEffect } from 'react';
import { VERTICALS, CLUB_META } from '../data/club';
import confetti from 'canvas-confetti';
import { Rocket, Send, Sparkles, Check, ArrowDown, ExternalLink } from 'lucide-react';

export default function JoinSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    branchYear: '',
    selectedVerticals: ['B/Algo'] as string[],
    reason: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rocketLaunching, setRocketLaunching] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const toggleVerticalChip = (vKey: string) => {
    setFormData((prev) => {
      const exists = prev.selectedVerticals.includes(vKey);
      if (exists) {
        if (prev.selectedVerticals.length === 1) return prev; // keep at least 1
        return { ...prev, selectedVerticals: prev.selectedVerticals.filter((v) => v !== vKey) };
      } else {
        return { ...prev, selectedVerticals: [...prev.selectedVerticals, vKey] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.branchYear) return;

    setRocketLaunching(true);

    // Launch confetti bursts
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#67E8F9', '#8B5CF6', '#1D9E75', '#D85A30', '#378ADD'],
    });

    setTimeout(() => {
      setIsSubmitted(true);
      setRocketLaunching(false);
    }, 1200);
  };

  const words = ['Build', 'with', 'us.'];

  return (
    <section
      ref={sectionRef}
      id="join"
      className="relative min-h-screen py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center select-none"
      aria-label="Join B/Stack Section"
    >
      {/* Soft violet backdrop glow */}
      <div className="absolute inset-0 bg-[#8B5CF6]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Huge heavy line "Build with us." that animates word by word */}
      <div className="text-center max-w-4xl mx-auto mb-16 relative">
        <h2 className="font-display font-black text-6xl sm:text-8xl md:text-9xl text-[#E6EDF7] tracking-tight leading-none flex items-center justify-center flex-wrap gap-x-4 sm:gap-x-8">
          {words.map((word, idx) => (
            <span
              key={word}
              className={`inline-block transform transition-all duration-700 ${
                idx === 2 ? 'text-[#67E8F9] animate-wobble-subtle' : ''
              } ${
                inView
                  ? 'translate-y-0 opacity-100 scale-100'
                  : 'translate-y-16 opacity-0 scale-90'
              }`}
              style={{ transitionDelay: `${idx * 160}ms` }}
            >
              {word}
            </span>
          ))}
        </h2>
        <p className="font-mono text-sm sm:text-base text-[#A7A3C7] mt-6 max-w-lg mx-auto">
          No gatekeeping. Bring your curiosity, your laptop, and your hunger to hack.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: 3D Stack of 4 colored layers + 5th dotted empty slot "You" */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="font-mono text-xs text-[#67E8F9] uppercase font-bold tracking-widest mb-6 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>THE 5TH SLOT IS YOURS</span>
          </div>

          {/* Perspective 3D Stack */}
          <div className="w-64 sm:w-72 space-y-3.5 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
            {/* Slot 5: Empty dotted slot labeled "You" */}
            <div className="p-4 rounded-2xl glass glass-tint glass-dashed glow-cyan text-center animate-pulse">
              <span className="font-display font-black text-2xl text-[#67E8F9]">
                YOU
              </span>
              <div className="font-mono text-[10px] text-white/90 uppercase font-bold mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#67E8F9]" />
                <span>Slot Reserved For Next Recruit</span>
              </div>
            </div>

            {/* Layer 1: B/Algo */}
            <div className="p-3.5 rounded-2xl glass glass-tint glow-violet text-white font-display font-black text-lg flex items-center justify-between">
              <span>B/Algo</span>
              <span className="font-mono text-[10px] glass-chip px-2 py-0.5 rounded">ALGORITHMS</span>
            </div>

            {/* Layer 2: B/Uild */}
            <div className="p-3.5 rounded-2xl glass glass-tint glow-green text-white font-display font-black text-lg flex items-center justify-between">
              <span>B/Uild</span>
              <span className="font-mono text-[10px] glass-chip px-2 py-0.5 rounded">ROBOTICS</span>
            </div>

            {/* Layer 3: B/Hack */}
            <div className="p-3.5 rounded-2xl glass glass-tint glow-coral text-white font-display font-black text-lg flex items-center justify-between">
              <span>B/Hack</span>
              <span className="font-mono text-[10px] glass-chip px-2 py-0.5 rounded">HACKATHONS</span>
            </div>

            {/* Layer 4: B/Dev */}
            <div className="p-3.5 rounded-2xl glass glass-tint glow-blue text-white font-display font-black text-lg flex items-center justify-between">
              <span>B/Dev</span>
              <span className="font-mono text-[10px] glass-chip px-2 py-0.5 rounded">OPEN SOURCE</span>
            </div>
          </div>
        </div>

        {/* Right column: Playful Form with sticker chips */}
        <div className="lg:col-span-7 relative">
          {/* Hand-drawn arrow doodle pointing to form */}
          <div className="hidden sm:flex items-center gap-2 absolute -top-10 left-8 text-[#67E8F9]">
            <span className="font-mono text-xs font-bold">jump in right here!</span>
            <svg className="wobble-doodle w-10 h-6" viewBox="0 0 50 30" fill="none">
              <path d="M 5 5 Q 25 10, 35 22 M 25 20 L 35 22 L 34 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="glass glow-violet p-6 sm:p-10 rounded-3xl relative">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#1D9E75] text-white mx-auto flex items-center justify-center text-4xl shadow-xl animate-bounce">
                  🚀
                </div>
                <h3 className="font-display font-black text-3xl text-[#E6EDF7]">
                  Welcome to the Stack, {formData.name}!
                </h3>
                <p className="font-body text-sm text-[#E6EDF7]/85 max-w-md mx-auto">
                  Your application was beamed directly to our crew leads. We host onboarding sessions weekly at Bosscoder School of Technology.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-6 py-2.5 rounded-full glass-chip font-mono text-xs font-bold"
                  >
                    Submit another response
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-[#E6EDF7] mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Chen"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-inset font-body text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-black uppercase text-[#E6EDF7] mb-1.5">
                    Branch & Year of Study *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science, 2nd Year"
                    value={formData.branchYear}
                    onChange={(e) => setFormData({ ...formData, branchYear: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-inset font-body text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-black uppercase text-[#E6EDF7] mb-2">
                    Interested Verticals (select all that spark joy):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(VERTICALS) as (keyof typeof VERTICALS)[]).map((vKey) => {
                      const vert = VERTICALS[vKey];
                      const isSelected = formData.selectedVerticals.includes(vKey);
                      return (
                        <button
                          key={vKey}
                          type="button"
                          onClick={() => toggleVerticalChip(vKey)}
                          className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'text-white scale-105 border border-white/50 shadow-[0_0_22px_rgba(255,255,255,0.28)]'
                              : 'glass-chip text-[#E6EDF7]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? vert.color : undefined,
                          }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{vert.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-black uppercase text-[#E6EDF7] mb-1.5">
                    Why do you want to join B/Stack?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you love to tinker with, or what wild idea you want to build..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-inset font-body text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={rocketLaunching}
                    data-magnetic="true"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#378ADD] hover:brightness-125 text-white font-display font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(139,92,246,0.55)] flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                  >
                    {rocketLaunching ? (
                      <>
                        <Rocket className="w-5 h-5 animate-spin text-[#67E8F9]" />
                        <span>Igniting Propulsion Engines...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 text-[#67E8F9]" />
                        <span>Launch Application</span>
                        <Send className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>

                {/* Fallback link for external Google Form */}
                <div className="text-center pt-2">
                  <a
                    href="https://forms.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-[#A7A3C7] hover:text-[#8B5CF6] inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Prefer external Google Form? Click here</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
