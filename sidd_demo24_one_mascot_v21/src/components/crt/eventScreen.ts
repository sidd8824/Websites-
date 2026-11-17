import type { ClubEvent } from '../../data/club';

export const SCREEN_WIDTH = 1024;
export const SCREEN_HEIGHT = 768;
const PAPER = '#f3efdf';
const MUTED = '#bfcabb';

export function eventColor(event: ClubEvent) {
  return /^#[a-f0-9]{6}$/i.test(event.verticalColor) ? event.verticalColor : '#b8ddb7';
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number,
  size: number, color = PAPER, display = false, maxWidth = 900) {
  ctx.font = display ? `bold ${size}px Georgia, serif` : `${size}px monospace`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y, maxWidth);
}

function lines(ctx: CanvasRenderingContext2D, value: string, width: number) {
  const rows: string[] = [];
  let row = '';
  for (const word of value.split(/\s+/)) {
    const candidate = row ? `${row} ${word}` : word;
    if (row && ctx.measureText(candidate).width > width) {
      rows.push(row);
      row = word;
    } else {
      row = candidate;
    }
  }
  if (row) rows.push(row);
  return rows;
}

function rule(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color = '#4f5c53') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, 2);
}

function coverArt(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, index: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  for (let strand = 0; strand < 20; strand++) {
    ctx.beginPath();
    for (let step = 0; step <= 48; step++) {
      const t = step / 48;
      const phase = (index % 4 + 1) * t * Math.PI;
      const curve = Math.sin(phase + strand / 7) * Math.sin(t * Math.PI) * .16;
      const py = height * (.09 + strand * .04 + curve);
      if (step === 0) ctx.moveTo(0, py);
      else ctx.lineTo(t * width, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function tape(ctx: CanvasRenderingContext2D, event: ClubEvent, index: number, offset: number) {
  const distance = Math.abs(offset);
  if (distance > 2) return;
  const scale = 1 - Math.min(.34, distance * .16);
  const color = eventColor(event);
  ctx.save();
  ctx.translate(512 + offset * 285, 358 + distance * 15);
  ctx.rotate(offset * .14);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 1 - Math.min(.73, distance * .34);
  ctx.fillStyle = '#090c0a';
  ctx.fillRect(-106, -167, 224, 364);
  ctx.fillStyle = '#242b26';
  ctx.fillRect(-63, -196, 126, 28);
  ctx.fillStyle = '#141b18';
  ctx.fillRect(-112, -178, 224, 364);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(-111, -177, 222, 362);
  text(ctx, 'B/STACK EVENT TAPE', -98, -150, 16, MUTED);
  rule(ctx, -98, -138, 196, color);
  ctx.font = 'bold 32px Georgia, serif';
  const rows = lines(ctx, event.title.replace(/^B\/\w+:\s*/i, ''), 195);
  rows.slice(0, 4).forEach((row, i) => text(ctx, row, -98, -98 + i * 33, 32, PAPER, true, 196));
  coverArt(ctx, -98, 43, 196, 91, index, color);
  rule(ctx, -98, 141, 196, color);
  text(ctx, event.vertical.toUpperCase(), -98, 165, 18, color);
  ctx.restore();
}

function detailPanel(ctx: CanvasRenderingContext2D, event: ClubEvent, index: number, page: number, offset: number) {
  if (Math.abs(offset) > 1.1) return;
  const color = eventColor(event);
  ctx.save();
  ctx.translate(offset * 885, 0);
  ctx.globalAlpha = Math.max(0, 1 - Math.abs(offset) * .55);
  text(ctx, page === 0 ? event.vertical.toUpperCase() : 'WHEN & WHERE', 82, 200, 25, color);
  const heading = page === 0 ? event.title : event.location;
  ctx.font = 'bold 55px Georgia, serif';
  const rows = lines(ctx, heading, 478);
  rows.slice(0, 4).forEach((row, i) => text(ctx, row, 82, 267 + i * 57, 55, PAPER, true, 480));
  const content = page === 0 ? event.note : event.dateStr;
  ctx.font = '24px monospace';
  lines(ctx, content, 470).slice(0, 5)
    .forEach((row, i) => text(ctx, row, 83, 290 + Math.min(rows.length, 4) * 57 + i * 31, 24, MUTED));
  ctx.fillStyle = '#1b251f';
  ctx.fillRect(590, 177, 346, 385);
  ctx.strokeStyle = color;
  ctx.strokeRect(590, 177, 346, 385);
  text(ctx, event.vertical.toUpperCase(), 616, 221, 24, color);
  coverArt(ctx, 616, 260, 294, 210, index, color);
  rule(ctx, 616, 505, 294, color);
  text(ctx, event.missionNumber ?? 'B/STACK EVENTS', 616, 536, 20, MUTED);
  ctx.restore();
}

export interface ScreenState {
  events: readonly ClubEvent[];
  selected: number;
  position: number;
  page: number | null;
  pagePosition: number;
  showEvents: boolean;
  powered: boolean;
}

export function drawEventScreen(ctx: CanvasRenderingContext2D, state: ScreenState) {
  const { events, selected, position, page, pagePosition, showEvents } = state;
  const event = events[selected];
  const color = eventColor(event);
  const gradient = ctx.createRadialGradient(500, 344, 0, 512, 384, 670);
  gradient.addColorStop(0, '#214033');
  gradient.addColorStop(1, '#0a1915');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = '#a6d7b116';
  for (let x = 72; x < 952; x += 48) ctx.fillRect(x, 125, 1, 550);
  for (let y = 125; y < 675; y += 48) ctx.fillRect(72, y, 880, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(62, 58, 900, 652);
  ctx.clip();
  text(ctx, page === null ? 'B/STACK  /  UPCOMING EVENTS' : '‹ ALL EVENTS', 72, 106, 23, color);
  if (showEvents) {
    ctx.textAlign = 'right';
    text(ctx, `${selected + 1} / ${events.length}`, 950, 106, 21, MUTED);
    ctx.textAlign = 'left';
  }
  rule(ctx, 72, 125, 878);
  if (!showEvents) {
    text(ctx, 'Upcoming', 100, 358, 104, PAPER, true);
    text(ctx, 'events', 100, 461, 104, PAPER, true);
    text(ctx, 'SCROLL SIDEWAYS TO BROWSE  ›', 106, 602, 26, MUTED);
  } else if (page === null) {
    events.map((item, index) => ({ item, index, offset: index - position }))
      .sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset))
      .forEach(({ item, index, offset }) => tape(ctx, item, index, offset));
    ctx.textAlign = 'center';
    text(ctx, event.title, 512, 607, 38, PAPER, true, 855);
    text(ctx, event.dateStr, 512, 648, 24, color, false, 855);
    text(ctx, 'SCROLL SIDEWAYS  /  SELECT TAPE TO OPEN', 512, 689, 19, MUTED);
    ctx.textAlign = 'left';
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.rect(69, 141, 885, 477);
    ctx.clip();
    detailPanel(ctx, event, selected, 0, -pagePosition);
    detailPanel(ctx, event, selected, 1, 1 - pagePosition);
    ctx.restore();
    rule(ctx, 72, 622, 878);
    text(ctx, page === 0 ? 'OVERVIEW' : 'DATE & LOCATION', 73, 664, 24, color);
    ctx.textAlign = 'right';
    text(ctx, `‹    ${page + 1} / 2    ›`, 950, 664, 24);
    ctx.textAlign = 'left';
  }
  ctx.restore();
  ctx.fillStyle = '#00000020';
  for (let y = 0; y < SCREEN_HEIGHT; y += 5) ctx.fillRect(0, y, SCREEN_WIDTH, 1.5);
}
