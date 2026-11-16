import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createJourney, stops } from './scene';
import { CLUB_META, EVENTS } from '../../data/club';
import HeroSection from '../HeroSection';
import AboutSection from '../AboutSection';
import VerticalsSection from '../VerticalsSection';
import EventsSection from '../EventsSection';
import JoinSection from '../JoinSection';
import FooterSection from '../FooterSection';
import GlobalDoodleFilter from '../GlobalDoodleFilter';
import './journey.css';

const chapters = [
  { eyebrow: 'BOSSCODER SCHOOL OF TECHNOLOGY', title: 'A place for\npeople who build.', text: CLUB_META.heroSubtitle, action: 'Explore B/Stack' },
  { eyebrow: 'THE CLUB', title: 'Make. Break.\nShip. Together.', text: 'Meet the student builders behind the code, the hardware, and the ideas.', action: 'Get to know us' },
  { eyebrow: 'FOUR VERTICALS. ONE STACK.', title: 'Find your\nkind of curious.', text: 'Algorithms, hardware, hackathons, and open source. Choose a band to explore.', action: 'Explore the verticals' },
  { eyebrow: 'THINGS WE BUILT', title: 'Ideas become\nthings you can use.', text: 'Enter the Projects building to explore our work, from rovers to open source.', action: 'Enter Projects ↗' },
  { eyebrow: 'UPCOMING EVENTS', title: 'Something good\nis coming up.', text: 'Drag the tower to rotate. Select a banner to open its event.', action: 'Open the calendar' },
  { eyebrow: 'THE CREW', title: 'The people\nbehind the builds.', text: 'Step inside to meet the crew and find the people who share your interests.', action: 'Meet the crew ↗' },
  { eyebrow: 'YOUR PLACE IN THE STACK', title: 'Bring your curiosity.\nBuild with us.', text: 'Pick your vertical and take the next step with B/Stack.', action: 'Join B/Stack' },
];

export default function HomeJourney() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createJourney> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [chapter, setChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [opened, setOpened] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const select = useCallback((id: string) => {
    setPlaying(false);
    if (id === 'projects' || id === 'team') {
      navigate('/' + id);
      window.scrollTo(0, 0);
    } else setOpened(id);
  }, [navigate]);

  useEffect(() => {
    try {
      scene.current = createJourney(canvas.current!, select);
      setReady(true);
    } catch (error) {
      console.error('Unable to initialize the journey', error);
      setFailed(true);
    }
    return () => scene.current?.dispose();
  }, [select]);

  useEffect(() => {
    function read() {
      const travel = (wrapper.current?.offsetHeight ?? 0) - innerHeight;
      const value = travel > 0 ? Math.max(0, Math.min(1, scrollY / travel)) : 0;
      scene.current?.setProgress(value * 6);
      setChapter(Math.round(value * 6));
      setProgress(value);
    }
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const travel = (wrapper.current?.offsetHeight ?? 0) - innerHeight;
      window.scrollBy(0, Math.min(now - last, 50) * travel / 75000);
      last = now;
      if (scrollY >= travel - 1) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const stop = () => setPlaying(false);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
  }, [playing]);

  useEffect(() => {
    if (!opened) return;
    const element = dialog.current!;
    const focusBefore = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      focusBefore?.focus();
    };
  }, [opened]);

  function go(index: number) {
    setPlaying(false);
    const travel = (wrapper.current?.offsetHeight ?? 0) - innerHeight;
    window.scrollTo({ top: travel * index / 6, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function navigateFromContent(id: string) {
    setOpened(null);
    const index = stops.findIndex(stop => stop.id === id);
    if (id === 'projects' || id === 'team') select(id);
    else if (index >= 0) go(index);
  }
  useEffect(() => {
    const requested = location.state?.journeyStop || location.hash.slice(1);
    const index = stops.findIndex(stop => stop.id === requested);
    if (index >= 0) {
      const frame = requestAnimationFrame(() => go(index));
      return () => cancelAnimationFrame(frame);
    }
  }, [location.key]);
  const event = EVENTS.find(item => item.id === opened);
  const current = chapters[chapter];
  return (
    <div className="journey" ref={wrapper}>
      <GlobalDoodleFilter />
      <div className="journey-stage">
        <canvas ref={canvas} className="journey-canvas" aria-label="Interactive B/Stack campus. Use the chapter navigation and buttons to access every landmark." />
        <div className="journey-shade" />
        <header className="journey-header">
          <button className="journey-logo" onClick={() => go(0)} aria-label="B/Stack home">B<span>/</span>Stack</button>
          <span className="journey-institution">BOSSCODER TECH</span>
          <nav aria-label="Quick navigation">
            <Link to="/projects" onClick={() => window.scrollTo(0, 0)}>Projects ↗</Link>
            <Link to="/team" onClick={() => window.scrollTo(0, 0)}>Crew ↗</Link>
            <button onClick={() => select('join')}>Join us ↗</button>
          </nav>
        </header>
        <section key={chapter} className="journey-copy" aria-label={stops[chapter].label}>
          <p className="journey-eyebrow">{current.eyebrow}</p>
          <h1>{current.title}</h1>
          <p className="journey-description">{current.text}</p>
          <button className="journey-action" onClick={() => select(stops[chapter].id)}>{current.action} <span aria-hidden="true">↗</span></button>
          {chapter === 4 && <div className="journey-event-links" aria-label="Choose an event">{EVENTS.filter(item => item.status === 'upcoming').map(item => <button key={item.id} onClick={() => select(item.id)}>{item.vertical}</button>)}</div>}
        </section>
        {(!ready || failed) && <p className="journey-loading" role="status">{failed ? 'The 3D scene is unavailable on this device. Every section is accessible using the controls.' : 'Preparing the campus…'}</p>}
        <div className="journey-controls">
          <span>Scroll to explore</span>
          <button onClick={() => setPlaying(!playing)} aria-pressed={playing}>{playing ? 'Ⅱ Pause journey' : '▷ Play journey'}</button>
          <button onClick={() => go(Math.min(6, chapter + 1))} disabled={chapter === 6}>Next stop →</button>
        </div>
        <nav className="journey-chapters" aria-label="Journey chapters">
          <div className="journey-progress"><i style={{ transform: `scaleX(${progress})` }} /></div>
          {stops.map((stop, i) => <button key={stop.id} onClick={() => go(i)} aria-current={chapter === i ? 'step' : undefined}><span>{stop.label}</span><i /></button>)}
        </nav>
      </div>
      {opened && <dialog ref={dialog} className={event ? 'journey-dialog journey-event-dialog' : 'journey-dialog'} aria-label={event?.title ?? stops.find(stop => stop.id === opened)?.label ?? 'B/Stack'} onCancel={() => setOpened(null)} onClick={e => { if (e.target === e.currentTarget) setOpened(null); }}>
        <button className="journey-close" onClick={() => setOpened(null)} aria-label="Close details">Close ×</button>
        <div className="journey-dialog-content">
          {event ? <article className="journey-event-detail" style={{ borderColor: event.verticalColor }}>
            <p className="journey-eyebrow" style={{ color: event.verticalColor }}>{event.vertical}</p>
            <h2>{event.title}</h2>
            <p>{event.dateStr}</p><p>{event.location}</p><p>{event.note}</p>
            <button className="journey-action" onClick={() => setOpened('events')}>Registration and calendar ↗</button>
          </article> : <>
            {opened === 'home' && <HeroSection onNavigate={navigateFromContent} />}
            {opened === 'about' && <AboutSection />}
            {opened === 'verticals' && <VerticalsSection onNavigate={navigateFromContent} />}
            {opened === 'events' && <EventsSection onNavigate={navigateFromContent} />}
            {opened === 'join' && <JoinSection />}
            <FooterSection />
          </>}
        </div>
      </dialog>}
    </div>
  );
}
