import type { ClubEvent } from '../../data/club';

export const DETAIL_CHAPTERS = ['Overview', 'Session plan', 'Field notes'] as const;
export const DETAIL_END = DETAIL_CHAPTERS.length - 1;

export function detailPosition(value: number) {
  return Math.max(0, Math.min(DETAIL_END, value));
}

export function detailChapter(value: number) {
  return Math.round(detailPosition(value));
}

const samples = {
  'B/Algo': {
    photo: 0,
    coverTitle: 'Graph Heats',
    headline: 'Find the shortest way through.',
    summary: 'Work through a warm-up graph, then try a timed round in pairs. Bring a laptop and use the language you know best.',
    agenda: ['18:00 · Sketch a solution', '18:25 · Pair up for the heats', '19:15 · Compare approaches'],
    field: 'Bring a laptop and charger. Scratch paper and sample inputs will be on the desks.',
    captions: ['Lab warm-up', 'Notes from the heats'],
  },
  'B/Uild': {
    photo: 1,
    coverTitle: 'Quadcopter Bootcamp',
    headline: 'Get a quad off the workbench.',
    summary: 'From a bare board to a bench-tested quadcopter. Work in small teams with a mentor at each soldering station.',
    agenda: ['14:00 · Bench safety', '14:25 · Solder the ESC leads', '15:40 · Test continuity and motor direction'],
    field: 'Kits and eye protection are provided. Bring a laptop if you want to flash the controller yourself.',
    captions: ['Team workbench', 'Bench-tested prototype'],
  },
  'B/Dev': {
    photo: 2,
    coverTitle: 'Rust & WebAssembly',
    headline: 'Run native code in the browser.',
    summary: 'Build a small Rust module, compile it to WebAssembly, and wire it into a browser demo you can share.',
    agenda: ['17:00 · Set up the toolchain', '17:35 · Compile a Rust module', '18:25 · Show the browser demo'],
    field: 'Bring a laptop with Rust installed if you can. We’ll have a browser-based starter for everyone else.',
    captions: ['Evening walkthrough', 'Pair programming'],
  },
};

export function sampleDetail(event: ClubEvent) {
  if (event.vertical === 'B/Algo' || event.vertical === 'B/Uild' || event.vertical === 'B/Dev') {
    return samples[event.vertical];
  }
  return {
    ...samples['B/Dev'],
    coverTitle: event.title,
    headline: event.title,
    summary: event.note,
  };
}
