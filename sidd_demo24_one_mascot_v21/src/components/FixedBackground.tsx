import TerminalBackground from './TerminalBackground';

// One fixed backdrop for the whole site: a near-black terminal screen with scrolling
// prompts and boot logs (see TerminalBackground). Everything else on the page sits above it.
export default function FixedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#050805]" aria-hidden="true">
      <TerminalBackground />
    </div>
  );
}
