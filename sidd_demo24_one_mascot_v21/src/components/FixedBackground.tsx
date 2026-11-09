import SectionStage from './SectionStage';
import TerminalBackground from './TerminalBackground';

// One fixed backdrop for the whole site (see SectionStage):
//  - a near-black base that the hero sits on (no stars, no contour map, no violet haze)
//  - ONE indigo-violet colour family whose shade drifts smoothly with the scroll (no switching)
//  - a pixel-grid trail that lights up wherever the mouse passes over empty space
//  - scrolling terminal text (TerminalBackground) layered over all of it
// A light vignette keeps the edges deep without dulling the bright sections.
export default function FixedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#07060F]" aria-hidden="true">
      <SectionStage />
      <TerminalBackground />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(3,2,10,0) 55%, rgba(3,2,10,0.3) 100%)' }}
      />
    </div>
  );
}
