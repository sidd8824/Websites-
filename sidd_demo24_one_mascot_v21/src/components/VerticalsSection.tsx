import { glowStyle } from '../utils/glow';
import { useState, useRef } from 'react';
import { VERTICALS, Vertical, TEAM_MEMBERS, PROJECTS, EVENTS } from '../data/club';
import VerticalStack3D from './VerticalStack3D';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  FolderGit2,
  Cpu,
  Terminal,
  Trophy,
  GitBranch,
  ArrowRight,
} from 'lucide-react';

interface VerticalsSectionProps {
  onNavigate: (sectionId: string) => void;
}

export default function VerticalsSection({ onNavigate }: VerticalsSectionProps) {
  const [selectedVerticalId, setSelectedVerticalId] = useState<Vertical['id'] | null>(null);

  const stackCtl = useRef<{ select: (id: string) => void } | null>(null);

  const selectedVertical = selectedVerticalId ? VERTICALS[selectedVerticalId] : null;

  // Filter lead & members for the active vertical
  const verticalLead = selectedVerticalId
    ? TEAM_MEMBERS.find((m) => m.isLead && m.verticals.includes(selectedVerticalId)) || TEAM_MEMBERS[0]
    : null;

  // Filter projects & events for this vertical
  const verticalProjects = selectedVerticalId
    ? PROJECTS.filter((p) => p.vertical === selectedVerticalId)
    : [];

  const verticalEvents = selectedVerticalId
    ? EVENTS.filter((e) => e.vertical === selectedVerticalId || e.vertical === 'All')
    : [];

  return (
    <section
      id="verticals"
      className="relative min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center"
      aria-label="Verticals Section"
    >
      {/* If No Vertical is selected: Show Overview with 3D Stack */}
      {!selectedVertical ? (
        <div className="w-full">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip text-xs font-mono text-[#67E8F9] mb-3">
              <span>04 SPECIALIZED VERTICALS</span>
            </div>
            <h2 className="font-display font-black text-4xl sm:text-6xl text-[#E6EDF7] tracking-tight">
              Four verticals, <span className="text-[#8B5CF6]">one</span> <span className="text-[#1D9E75]">s</span><span className="text-[#D85A30]">t</span><span className="text-[#378ADD]">ack</span>.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A7A3C7]">
              Every member chooses their home vertical, but code, hardware, and hackathon projects cross-pollinate continuously.
            </p>
          </div>

          {/* DYNAMIC DESIGN VIEW */}
          {(
            <div>
              <div className="relative max-w-6xl mx-auto">
                <VerticalStack3D
                  controlRef={stackCtl}
                  onJoin={() => onNavigate('join')}
                />
              </div>

              {/* Quick Selection Pills below 3D stack */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8">
                {(Object.keys(VERTICALS) as Vertical['id'][]).map((vKey) => {
                  const vert = VERTICALS[vKey];
                  return (
                    <button
                      key={vert.id}
                      onClick={() => stackCtl.current?.select(vert.id)}
                      data-cursor="view"
                      className="glass p-4 rounded-xl text-left hover:-translate-y-1 cursor-pointer group"
                      style={glowStyle(vert.color)}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-display font-black text-lg"
                          style={{ color: vert.color }}
                        >
                          {vert.name}
                        </span>
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: vert.color }}
                        />
                      </div>
                      <div className="font-mono text-[11px] text-[#A7A3C7] uppercase mt-1">
                        {vert.tagline}
                      </div>
                      <div className="mt-3 flex items-center gap-1 font-mono text-[10px] font-bold text-[#E6EDF7] group-hover:text-[#67E8F9]">
                        <span>Dive in</span>
                        <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* DETAIL VIEW: Dive in when layer clicked */
        <div className="w-full animate-fadeIn transition-all duration-500">
          {/* Back link */}
          <button
            onClick={() => setSelectedVerticalId(null)}
            className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#67E8F9] hover:text-white transition-colors mb-8 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>← All verticals</span>
          </button>

          {/* Header Card with themed object */}
          <div
            className="glass glass-tint p-6 sm:p-10 rounded-3xl relative overflow-hidden"
            style={glowStyle(selectedVertical.color)}
          >
            {/* Themed visual badge in top right */}
            <div className="relative w-fit mb-4 p-3 sm:p-4 sm:absolute sm:top-6 sm:right-6 sm:mb-0 rounded-2xl glass-chip">
              {selectedVertical.id === 'B/Algo' && (
                <div className="flex items-center gap-2 text-[#8B5CF6] text-2xl font-mono font-black">
                  <span>{'{ }'}</span>
                  <span className="text-[#67E8F9]">λ</span>
                  <span>{'</>'}</span>
                </div>
              )}
              {selectedVertical.id === 'B/Uild' && (
                <div className="flex items-center gap-2 text-[#1D9E75]">
                  <Cpu className="w-8 h-8 animate-wobble-subtle" />
                  <span className="font-mono text-xs font-bold text-white">ROBOTIC ARM</span>
                </div>
              )}
              {selectedVertical.id === 'B/Hack' && (
                <div className="flex items-center gap-2 text-[#D85A30]">
                  <Trophy className="w-8 h-8 animate-bounce" />
                  <span className="font-mono text-xs font-bold text-white">36H SPRINT</span>
                </div>
              )}
              {selectedVertical.id === 'B/Dev' && (
                <div className="flex items-center gap-2 text-[#378ADD]">
                  <GitBranch className="w-8 h-8" />
                  <span className="font-mono text-xs font-bold text-white">OPEN SOURCE</span>
                </div>
              )}
            </div>

            <span
              className="font-mono text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full text-white inline-block mb-3"
              style={{ backgroundColor: selectedVertical.color }}
            >
              VERTICAL DOSSIER
            </span>
            <h3 className="font-display font-black text-4xl min-[400px]:text-5xl sm:text-7xl text-[#E6EDF7] tracking-tight break-words">
              {selectedVertical.name}
            </h3>
            <p className="font-mono text-sm sm:text-base text-[#67E8F9] mt-2">
              {selectedVertical.tagline}
            </p>
            <p className="mt-4 text-base sm:text-lg text-[#E6EDF7]/90 max-w-2xl leading-relaxed">
              {selectedVertical.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('join')}
                className="px-6 py-3 rounded-full font-display font-bold text-xs uppercase tracking-wider text-[#E6EDF7] transition-all hover:scale-105 shadow-lg cursor-pointer"
                style={{ backgroundColor: selectedVertical.color }}
              >
                Join {selectedVertical.name}
              </button>
              <button
                onClick={() => setSelectedVerticalId(null)}
                className="px-6 py-3 rounded-full font-mono font-bold text-xs uppercase tracking-wider text-[#E6EDF7] bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                Switch Vertical
              </button>
            </div>
          </div>

          {/* Vertical Details Grid: What you'll do + Lead + Projects + Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-10">
            {/* Column 1: What you'll do */}
            <div className="glass p-6 rounded-2xl flex flex-col justify-between" style={glowStyle(selectedVertical.color)}>
              <div>
                <h4 className="font-display font-bold text-xl text-[#E6EDF7] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#8B5CF6]" />
                  What you&apos;ll do
                </h4>
                <div className="mt-4 space-y-3.5">
                  {selectedVertical.whatYoullDo.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: selectedVertical.color }}
                      />
                      <span className="font-body text-xs sm:text-sm text-[#E6EDF7]/85 leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 font-mono text-[11px] text-[#A7A3C7]">
                Weekly syncs, hardware kits, and cloud runner compute provided.
              </div>
            </div>

            {/* Column 2: Vertical Lead Member Card */}
            {verticalLead && (
              <div
                className="glass p-6 rounded-2xl relative"
                style={glowStyle(selectedVertical.color)}
                data-cursor="wave"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#67E8F9] text-[#0B0A16]">
                    VERTICAL LEAD
                  </span>
                  <span className="font-mono text-xs text-[#A7A3C7]">
                    since {verticalLead.memberSince}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-14 h-14 rounded-xl border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center font-display font-black text-xl text-white"
                    style={{ backgroundColor: selectedVertical.color }}
                  >
                    👑
                  </div>
                  <div>
                    <h5 className="font-display font-black text-base text-[#E6EDF7]">
                      {verticalLead.name}
                    </h5>
                    <p className="font-mono text-xs text-[#C4B5FD] font-semibold">
                      {verticalLead.role}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-[#E6EDF7]/85 leading-relaxed font-body">
                  &ldquo;{verticalLead.description}&rdquo;
                </p>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#A7A3C7]">What I build:</span>
                  <span className="font-bold text-[#E6EDF7] truncate min-w-0 max-w-[55%] sm:max-w-[180px]">
                    {verticalLead.whatIBuild}
                  </span>
                </div>
              </div>
            )}

            {/* Column 3: Upcoming Vertical Events & Active Projects */}
            <div className="space-y-4">
              {/* Upcoming Events Box */}
              <div className="glass glow-cyan p-5 rounded-2xl">
                <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-[#67E8F9] flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  Upcoming Missions
                </h5>
                {verticalEvents.length > 0 ? (
                  verticalEvents.slice(0, 2).map((evt) => (
                    <div key={evt.id} className="text-xs space-y-1 mb-2.5 pb-2.5 border-b border-white/10 last:border-none last:mb-0">
                      <div className="font-display font-bold text-[#E6EDF7]">{evt.title}</div>
                      <div className="font-mono text-[10px] text-[#A7A3C7]">{evt.dateStr}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#A7A3C7]">No upcoming sessions scheduled.</p>
                )}
              </div>

              {/* Active Projects Box */}
              <div className="glass glow-blue p-5 rounded-2xl">
                <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-[#63B0FF] flex items-center gap-2 mb-3">
                  <FolderGit2 className="w-4 h-4" />
                  Flagship Builds
                </h5>
                {verticalProjects.length > 0 ? (
                  verticalProjects.slice(0, 2).map((p) => (
                    <div key={p.id} className="text-xs space-y-1 mb-2.5 pb-2.5 border-b border-white/10 last:border-none last:mb-0">
                      <div className="font-display font-bold text-[#E6EDF7]">{p.title}</div>
                      <div className="font-mono text-[10px] text-[#A7A3C7] truncate">{p.tags.join(' · ')}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#A7A3C7]">New prototypes currently in stealth.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
