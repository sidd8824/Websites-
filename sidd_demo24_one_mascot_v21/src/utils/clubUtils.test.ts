import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCountdown,
  getFibonacciSpherePoints,
  interpolateColor,
  getBackgroundGradientForScroll,
  filterTeamMembers,
  filterProjects,
  categorizeEvents,
  createTrailParticle,
  type ClubEventData,
} from './clubUtils.ts';

test('categorizeEvents correctly finds nearest future event as heroEvent', () => {
  const events: ClubEventData[] = [
    {
      id: 'e-past',
      title: 'Past Event',
      vertical: 'B/Algo',
      verticalColor: '#7F77DD',
      dateStr: 'September 2026',
      targetIso: '2026-09-01T10:00:00.000Z',
      location: 'Auditorium',
      note: 'Past kickoff',
      status: 'completed',
    },
    {
      id: 'e-future-2',
      title: 'Later Event',
      vertical: 'B/Dev',
      verticalColor: '#378ADD',
      dateStr: 'December 2026',
      targetIso: '2026-12-10T10:00:00.000Z',
      location: 'Lab',
      note: 'Later workshop',
      status: 'upcoming',
    },
    {
      id: 'e-future-1',
      title: 'Nearest Future Event',
      vertical: 'B/Hack',
      verticalColor: '#D85A30',
      dateStr: 'November 2026',
      targetIso: '2026-11-14T09:00:00.000Z',
      location: 'Tech Hall',
      note: 'Nearest hackathon',
      status: 'upcoming',
    },
  ];

  const now = '2026-10-17T05:00:00.000Z';
  const result = categorizeEvents(events, now);

  assert.equal(result.heroEvent.id, 'e-future-1');
  assert.equal(result.upcomingEvents.length, 1);
  assert.equal(result.upcomingEvents[0].id, 'e-future-2');
  assert.equal(result.completedEvents.length, 1);
  assert.equal(result.completedEvents[0].id, 'e-past');
});

test('categorizeEvents moves finished event to completed trail', () => {
  const events: ClubEventData[] = [
    {
      id: 'e-finished',
      title: 'Finished Yesterday',
      vertical: 'B/Uild',
      verticalColor: '#1D9E75',
      dateStr: 'October 10, 2026',
      targetIso: '2026-10-10T10:00:00.000Z',
      location: 'Maker Lab',
      note: 'Done',
      status: 'upcoming',
    },
    {
      id: 'e-next',
      title: 'Next Week',
      vertical: 'B/Hack',
      verticalColor: '#D85A30',
      dateStr: 'October 25, 2026',
      targetIso: '2026-10-25T10:00:00.000Z',
      location: 'Arena',
      note: 'Upcoming',
      status: 'upcoming',
    },
  ];

  const now = '2026-10-17T05:00:00.000Z';
  const result = categorizeEvents(events, now);

  assert.equal(result.heroEvent.id, 'e-next');
  assert.equal(result.completedEvents.length, 1);
  assert.equal(result.completedEvents[0].id, 'e-finished');
  assert.equal(result.completedEvents[0].status, 'completed');
});

test('createTrailParticle generates valid particle within limits', () => {
  let mockRandIdx = 0;
  const mockRandomValues = [0.1, 0.4, 0.7, 0.3, 0.5];
  const deterministicRand = () => {
    const val = mockRandomValues[mockRandIdx % mockRandomValues.length];
    mockRandIdx++;
    return val;
  };

  const p = createTrailParticle(100, 200, 42, 1000, deterministicRand);
  assert.equal(p.id, 42);
  assert.equal(p.x, 100);
  assert.equal(p.y, 200);
  assert.ok(['clock', 'digit', 'word', 'sparkle'].includes(p.type));
  assert.ok(p.driftX >= -15 && p.driftX <= 15);
  assert.ok(p.rotation >= -25 && p.rotation <= 25);
});


test('computeCountdown calculates correct future time remaining', () => {
  const target = '2026-11-20T12:00:00.000Z';
  const now = '2026-11-18T10:00:00.000Z'; // exactly 2 days and 2 hours = 50 hours = 180,000s
  const res = computeCountdown(target, now);

  assert.equal(res.days, 2);
  assert.equal(res.hours, 2);
  assert.equal(res.minutes, 0);
  assert.equal(res.seconds, 0);
  assert.equal(res.dd, '02');
  assert.equal(res.hh, '02');
  assert.equal(res.isLive, false);
  assert.equal(res.isPast, false);
});

test('computeCountdown flags live event within 24 hours of target start', () => {
  const target = '2026-11-20T12:00:00.000Z';
  const now = '2026-11-20T14:00:00.000Z'; // 2 hours after start
  const res = computeCountdown(target, now);

  assert.equal(res.isLive, true);
  assert.equal(res.isPast, false);
});

test('computeCountdown flags past event after 24 hours', () => {
  const target = '2026-11-20T12:00:00.000Z';
  const now = '2026-11-22T14:00:00.000Z'; // 50 hours after start
  const res = computeCountdown(target, now);

  assert.equal(res.isLive, false);
  assert.equal(res.isPast, true);
});

test('getFibonacciSpherePoints generates uniform distribution on sphere', () => {
  const points = getFibonacciSpherePoints(24, 10);
  assert.equal(points.length, 24);

  // Each point must lie at distance radius = 10 from origin (within floating precision)
  for (const p of points) {
    const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    assert.ok(Math.abs(dist - 10) < 0.001, `Point ${p.index} radius mismatch: ${dist}`);
  }
});

test('interpolateColor blends between two hex values', () => {
  const c1 = '#000000';
  const c2 = '#ffffff';
  const mid = interpolateColor(c1, c2, 0.5);
  assert.equal(mid.toLowerCase(), '#808080');

  const start = interpolateColor('#06050e', '#121026', 0);
  assert.equal(start.toLowerCase(), '#06050e');
});

test('getBackgroundGradientForScroll interpolates through defined stops', () => {
  const atZero = getBackgroundGradientForScroll(0);
  assert.equal(atZero.colorStart.toLowerCase(), '#0b0a16');
  assert.equal(atZero.colorEnd.toLowerCase(), '#1a1240');

  const atMid = getBackgroundGradientForScroll(0.72);
  assert.equal(atMid.colorStart.toLowerCase(), '#0c0b1a');
  assert.equal(atMid.colorEnd.toLowerCase(), '#2b1048');
  assert.equal(atMid.glowColor, '#8B5CF6');
});

test('filterTeamMembers filters correctly by vertical and ALL', () => {
  const testMembers = [
    { id: '1', verticals: ['B/Algo', 'B/Dev'] },
    { id: '2', verticals: ['B/Uild'] },
    { id: '3', verticals: ['B/Algo', 'B/Hack'] },
  ];

  const all = filterTeamMembers(testMembers, 'ALL');
  assert.equal(all.length, 3);

  const algo = filterTeamMembers(testMembers, 'B/Algo');
  assert.equal(algo.length, 2);

  const unit = filterTeamMembers(testMembers, 'B/Uild');
  assert.equal(unit.length, 1);
});

test('filterProjects filters correctly by vertical and ALL', () => {
  const testProjects = [
    { id: 'p1', vertical: 'B/Algo' },
    { id: 'p2', vertical: 'B/Uild' },
    { id: 'p3', vertical: 'B/Dev' },
  ];

  assert.equal(filterProjects(testProjects, 'ALL').length, 3);
  assert.equal(filterProjects(testProjects, 'B/Uild').length, 1);
  assert.equal(filterProjects(testProjects, 'B/Uild')[0].id, 'p2');
});
