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

function eventArtwork(ctx: CanvasRenderingContext2D, event: ClubEvent, index: number, x: number, page: number) {
  const color = eventColor(event);
  const gradient = ctx.createLinearGradient(x, 171, x + 390, 579);
  gradient.addColorStop(0, page === 0 ? '#18241f' : '#dadcc9');
  gradient.addColorStop(1, page === 0 ? '#0d1310' : '#9da99a');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, 167, 390, 406);
  ctx.strokeStyle = color;
  ctx.strokeRect(x + .5, 167.5, 389, 405);
  const ink = page === 0 ? PAPER : '#17241d';
  text(ctx, 'B/STACK', x + 30, 222, 30, ink, true);
  text(ctx, event.vertical.toUpperCase(), x + 30, 259, 19, page === 0 ? color : ink);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 26, 278, 338, 200);
  ctx.clip();
  coverArt(ctx, x + 28, 279, 334, 198, index, page === 0 ? color : '#233d2d');
  ctx.restore();
  rule(ctx, x + 30, 495, 330, page === 0 ? color : ink);
  text(ctx, event.missionNumber ?? 'EVENT TAPE', x + 30, 532, 18, ink);
}

function detailPanel(ctx: CanvasRenderingContext2D, event: ClubEvent, index: number, page: number, offset: number) {
  if (Math.abs(offset) > 1.1) return;
  const color = eventColor(event);
  ctx.save();
  ctx.translate(offset * 890, 0);
  const column = page === 0 ? 82 : 510;
  const width = page === 0 ? 445 : 416;
  eventArtwork(ctx, event, index, page === 0 ? 540 : 82, page);
  text(ctx, page === 0 ? '[ EVENT ]' : '[ VENUE ]', column, 193, 18, color);
  text(ctx, page === 0 ? event.vertical.toUpperCase() : 'DATE & LOCATION', column, 222, 21, MUTED);
  if (page === 0) {
    text(ctx, '[ DATE ]', column + 180, 193, 18, color);
    text(ctx, event.dateStr, column + 180, 222, 19, MUTED, false, 258);
  }

  const heading = page === 0 ? event.title.replace(/^B\/\w+:\s*/i, '') : event.location;
  const titleSize = page === 0 ? 49 : 52;
  ctx.font = `bold ${titleSize}px Georgia, serif`;
  const rows = lines(ctx, heading, width);
  rows.slice(0, 4).forEach((row, i) => text(ctx, row, column, 304 + i * 50, titleSize, PAPER, true, width));
  const body = page === 0 ? event.note : event.dateStr;
  ctx.font = '22px monospace';
  lines(ctx, body, width).slice(0, 5)
    .forEach((row, i) => text(ctx, row, column, 312 + Math.min(rows.length, 4) * 50 + i * 26, 22, MUTED, false, width));
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
  gradient.addColorStop(0, showEvents ? '#25312a' : '#214033');
  gradient.addColorStop(1, showEvents ? '#090d0b' : '#0a1915');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = showEvents ? '#a6d7b10b' : '#a6d7b116';
  for (let x = 72; x < 952; x += 48) ctx.fillRect(x, 125, 1, 550);
  for (let y = 125; y < 675; y += 48) ctx.fillRect(72, y, 880, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(62, 58, 900, 652);
  ctx.clip();
  text(ctx, !showEvents ? 'B/STACK  /  UPCOMING EVENTS' : page === null ? '‹ UPCOMING EVENTS' : '‹ ALL EVENTS', 72, 106, 23, color);
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
    rule(ctx, 72, 621, 878);
    for (let i = 0; i <= 30; i++) {
      ctx.fillStyle = i <= pagePosition * 30 ? color : '#46524a';
      ctx.fillRect(73 + 29.1 * i, 616, 2, 11);
    }
    text(ctx, page === 0 ? 'OVERVIEW' : 'DATE & LOCATION', 73, 664, 24, color);
    ctx.textAlign = 'right';
    text(ctx, `‹    ${page + 1} / 2    ›`, 950, 664, 24);
    ctx.textAlign = 'left';
    text(ctx, 'SCROLL SIDEWAYS TO DISCOVER', 73, 694, 17, MUTED);
  }
  ctx.restore();
}
