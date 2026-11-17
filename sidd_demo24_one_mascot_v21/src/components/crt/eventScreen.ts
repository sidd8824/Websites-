import type { ClubEvent } from '../../data/club';
import { DETAIL_CHAPTERS, DETAIL_END, detailChapter, sampleDetail } from './detailRail';

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

function framedPhoto(ctx: CanvasRenderingContext2D, photo: HTMLImageElement | null, column: number, row: number,
  x: number, width: number, caption: string, color: string) {
  const top = 161;
  const height = 386;
  ctx.fillStyle = '#151e18';
  ctx.fillRect(x, top, width, height);
  if (photo) {
    // The source is a three by two contact sheet. Trim the adjacent-cell seams.
    const cellWidth = photo.naturalWidth / 3;
    const cellHeight = photo.naturalHeight / 2;
    const scale = Math.max(width / (cellWidth - 4), height / (cellHeight - 4));
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    ctx.drawImage(photo, (column + .5) * cellWidth - sourceWidth / 2,
      (row + .5) * cellHeight - sourceHeight / 2, sourceWidth, sourceHeight, x, top, width, height);
  } else {
    coverArt(ctx, x + 24, top + 48, width - 48, height - 96, column, color);
  }
  ctx.strokeStyle = '#d6e2cf42';
  ctx.strokeRect(x + .5, top + .5, width - 1, height - 1);
  text(ctx, caption.toUpperCase(), x, 574, 17, MUTED, false, width);
}

function detailTrack(ctx: CanvasRenderingContext2D, event: ClubEvent, pagePosition: number, photo: HTMLImageElement | null) {
  const color = eventColor(event);
  const sample = sampleDetail(event);
  ctx.save();
  ctx.translate(-pagePosition * 720, 0);
  const textBlock = (x: number, label: string, headline: string, body: string) => {
    text(ctx, label, x, 200, 18, color);
    ctx.font = 'bold 44px Georgia, serif';
    const headingRows = lines(ctx, headline, 350);
    headingRows.forEach((line, i) => text(ctx, line, x, 294 + i * 46, 44, PAPER, true, 350));
    ctx.font = '21px monospace';
    lines(ctx, body, 350).forEach((line, i) =>
      text(ctx, line, x, 310 + headingRows.length * 46 + i * 26, 21, MUTED, false, 350));
  };
  textBlock(82, '[ EVENT OVERVIEW ]', sample.headline, sample.summary);
  text(ctx, event.dateStr, 82, 232, 17, MUTED, false, 350);
  framedPhoto(ctx, photo, sample.photo, 0, 480, 566, sample.captions[0], color);
  text(ctx, '[ SAMPLE SESSION PLAN ]', 1090, 200, 18, color);
  text(ctx, 'The run of show.', 1090, 294, 43, PAPER, true, 335);
  sample.agenda.forEach((entry, i) => text(ctx, entry, 1090, 345 + i * 37, 19, MUTED, false, 340));
  rule(ctx, 1090, 471, 330);
  ctx.font = '20px monospace';
  lines(ctx, event.location, 330).forEach((line, i) => text(ctx, line, 1090, 506 + i * 27, 20, MUTED));
  framedPhoto(ctx, photo, sample.photo, 1, 1470, 530, sample.captions[1], color);
  textBlock(2055, '[ FIELD NOTES ]', 'Before you arrive.', sample.field);
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

export function drawEventScreen(ctx: CanvasRenderingContext2D, state: ScreenState, photo: HTMLImageElement | null = null) {
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
    detailTrack(ctx, event, pagePosition, photo);
    ctx.restore();
    rule(ctx, 72, 621, 878);
    for (let i = 0; i <= 60; i++) {
      ctx.fillStyle = i <= pagePosition / DETAIL_END * 60 ? color : '#46524a';
      ctx.fillRect(73 + 14.55 * i, 616, 2, 11);
    }
    const chapter = detailChapter(pagePosition);
    text(ctx, DETAIL_CHAPTERS[chapter].toUpperCase(), 73, 664, 24, color);
    ctx.textAlign = 'right';
    text(ctx, `‹    ${chapter + 1} / ${DETAIL_CHAPTERS.length}    ›`, 950, 664, 24);
    ctx.textAlign = 'left';
    text(ctx, 'SAMPLE EVENT DETAILS  /  SCROLL OR DRAG SIDEWAYS', 73, 694, 17, MUTED);
  }
  ctx.restore();
}
