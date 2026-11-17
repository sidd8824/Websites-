import { tapePose } from './tapeMotion';
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

function drawPhoto(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, column: number, row: number,
  x: number, y: number, width: number, height: number) {
  // Crop inside one cell of the three-column, two-row photo sheet.
  const cellWidth = photo.naturalWidth / 3;
  const cellHeight = photo.naturalHeight / 2;
  const scale = Math.max(width / (cellWidth - 4), height / (cellHeight - 4));
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(photo, (column + .5) * cellWidth - sourceWidth / 2,
    (row + .5) * cellHeight - sourceHeight / 2, sourceWidth, sourceHeight, x, y, width, height);
}

function tape(ctx: CanvasRenderingContext2D, event: ClubEvent, index: number, offset: number,
  photo: HTMLImageElement | null, hover?: ScreenState['tapeHover']) {
  const distance = Math.abs(offset);
  if (distance > 2) return;
  const lift = hover?.amount ?? 0;
  const pose = tapePose(offset, lift);
  const sample = sampleDetail(event);
  const isQuad = event.vertical === 'B/Uild';
  const isRust = event.vertical === 'B/Dev';
  const isGraph = event.vertical === 'B/Algo';
  const paper = isQuad ? '#272c22' : isRust ? '#f1e4c9' : '#e8d3f1';
  const stock = isQuad ? '#d8d9a1' : isRust ? '#11182a' : '#211a2d';
  const accent = isQuad ? '#535b2c' : isRust ? '#95b4f8' : '#d5b4fd';

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.rotation + lift * (hover?.lean ?? 0) * .048);
  ctx.scale(pose.scale, pose.scale);
  ctx.globalAlpha = pose.alpha;
  ctx.fillStyle = '#070906';
  ctx.fillRect(-106, -172, 230, 368);

  // A molded cassette slides up from behind the printed sleeve when it lifts.
  const cassetteY = -173 - (distance < .5 ? 12 : 0) - lift * 28;
  const plastic = ctx.createLinearGradient(0, cassetteY, 0, cassetteY + 64);
  plastic.addColorStop(0, '#45483c');
  plastic.addColorStop(1, '#1a201a');
  ctx.fillStyle = plastic;
  ctx.beginPath();
  ctx.roundRect(-78, cassetteY, 156, 61, 5);
  ctx.fill();
  ctx.strokeStyle = '#8e8b72';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (lift > .12) {
    for (const x of [-42, 42]) {
      ctx.fillStyle = '#121612';
      ctx.beginPath();
      ctx.arc(x, cassetteY + 15, 9, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#a9a389';
      ctx.stroke();
      ctx.fillStyle = '#767360';
      ctx.fillRect(x - 2, cassetteY + 12, 4, 6);
    }
  }

  ctx.fillStyle = stock;
  ctx.fillRect(-114, -181, 228, 366);
  ctx.strokeStyle = isQuad ? '#f4edb5' : accent;
  ctx.globalAlpha = pose.alpha * .52;
  ctx.strokeRect(-113.5, -180.5, 227, 365);
  ctx.globalAlpha = pose.alpha;

  const photoX = isRust ? -113 : -98;
  const photoY = isQuad ? -43 : -119;
  const photoW = isRust ? 226 : 196;
  const photoH = isQuad ? 170 : isRust ? 255 : 177;
  ctx.fillStyle = isQuad ? '#9d9d70' : '#282e35';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  if (photo) {
    ctx.filter = 'grayscale(1) contrast(1.28)';
    drawPhoto(ctx, photo, sample.photo, isQuad ? 1 : 0, photoX, photoY, photoW, photoH);
    ctx.filter = 'none';
  } else {
    coverArt(ctx, photoX + 9, photoY + 21, photoW - 18, photoH - 42, index, accent);
  }
  const dye = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
  dye.addColorStop(0, isQuad ? '#d8d9a158' : isRust ? '#4668b592' : '#9c63c17d');
  dye.addColorStop(1, isQuad ? '#384c2a50' : isRust ? '#07122bd1' : '#160f24d9');
  ctx.fillStyle = dye;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  text(ctx, 'B/STACK', -97, -151, 15, paper);
  ctx.textAlign = 'right';
  text(ctx, String(index + 1).padStart(2, '0'), 97, -151, 15, paper);
  ctx.textAlign = 'left';
  rule(ctx, -97, -138, 194, paper + '75');

  if (isQuad) {
    ctx.font = '900 83px Arial Black, sans-serif';
    ctx.fillStyle = paper;
    ctx.fillText('QUAD', -103, -57, 204);
    ctx.fillStyle = '#d8d9a1ee';
    ctx.fillRect(-96, -26, 178, 25);
    text(ctx, 'SOLDERING BOOTCAMP', -91, -9, 14, paper, false, 166);
  } else if (isRust) {
    text(ctx, 'RUST', -105, -27, 88, paper, true, 208);
    rule(ctx, -96, 70, 192, paper + 'a0');
    text(ctx, 'WEBASSEMBLY', -96, 95, 22, paper, false, 192);
    text(ctx, 'WORKSHOP', -96, 118, 22, paper, false, 192);
  } else if (isGraph) {
    text(ctx, 'Graph', -98, 66, 59, paper, true, 200);
    text(ctx, 'Heats', -98, 116, 59, paper, true, 200);
  } else {
    ctx.font = 'bold 35px Georgia, serif';
    lines(ctx, sample.coverTitle, 198).slice(0, 2)
      .forEach((row, line) => text(ctx, row, -98, 80 + line * 38, 35, paper, true, 198));
  }

  rule(ctx, -97, 139, 194, paper + '75');
  text(ctx, event.vertical.toUpperCase(), -97, 165, 15, paper);
  ctx.textAlign = 'right';
  text(ctx, 'VHS', 97, 165, 14, paper);
  ctx.textAlign = 'left';
  // Printed sleeves catch small abrasions along their folds and corners.
  ctx.fillStyle = paper + '80';
  for (let i = 0; i < 96; i++) {
    const x = ((i * 83 + index * 17) % 224) - 112;
    const y = i % 2 ? -180 + i % 5 : 181 - i % 5;
    ctx.fillRect(x, y, 1 + i % 5, .6 + i % 2);
    if (i % 3 === 0) {
      const side = i % 2 ? -113 : 111;
      ctx.fillRect(side, ((i * 47) % 356) - 178, 1.2, 1 + i % 6);
    }
  }
  ctx.strokeStyle = paper + '18';
  ctx.lineWidth = .5;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 61 + index * 29) % 190) - 95;
    const y = ((i * 97) % 320) - 160;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12 + i * 3, y + 27 + i * 7);
    ctx.stroke();
  }
  ctx.restore();
}

function framedPhoto(ctx: CanvasRenderingContext2D, photo: HTMLImageElement | null, column: number, row: number,
  x: number, width: number, caption: string, color: string) {
  const top = 161;
  const height = 386;
  ctx.fillStyle = '#151e18';
  ctx.fillRect(x, top, width, height);
  if (photo) {
    drawPhoto(ctx, photo, column, row, x, top, width, height);
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
  tapeHover?: { index: number; lean: number; amount: number };
}

let tubeBackground: HTMLCanvasElement | undefined;

function drawTubeBackground(ctx: CanvasRenderingContext2D) {
  if (!tubeBackground) {
    // Cache a neutral charcoal tube with fine RGB phosphors and horizontal scanlines.
    // It is painted before the sleeves and UI so their edges stay clean.
    tubeBackground = document.createElement('canvas');
    tubeBackground.width = SCREEN_WIDTH * 2;
    tubeBackground.height = SCREEN_HEIGHT * 2;
    const bg = tubeBackground.getContext('2d')!;
    bg.scale(2, 2);
    const glow = bg.createRadialGradient(512, 330, 30, 512, 384, 650);
    glow.addColorStop(0, '#303132');
    glow.addColorStop(.65, '#252628');
    glow.addColorStop(1, '#101113');
    bg.fillStyle = glow;
    bg.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const phosphors = ['#ae635c16', '#72a98016', '#667eac16'];
    for (let x = 0; x < SCREEN_WIDTH; x += 1.5) {
      phosphors.forEach((ink, channel) => {
        bg.fillStyle = ink;
        bg.fillRect(x + channel * .5, 0, .5, SCREEN_HEIGHT);
      });
    }
    bg.fillStyle = '#00000022';
    for (let y = 0; y < SCREEN_HEIGHT; y += 2) {
      bg.fillRect(0, y, SCREEN_WIDTH, .5);
    }
    // A restrained, deterministic grain avoids a moving haze over the artwork.
    let seed = 14;
    for (let i = 0; i < 45000; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const x = (seed & 65535) / 65536 * SCREEN_WIDTH;
      const y = (seed >>> 16) / 65536 * SCREEN_HEIGHT;
      bg.fillStyle = i % 2 ? '#ffffff08' : '#0000000d';
      bg.fillRect(x, y, .5, .5);
    }
    const sheen = bg.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    sheen.addColorStop(0, '#ffffff00');
    sheen.addColorStop(.055, '#ffffff08');
    sheen.addColorStop(.13, '#ffffff00');
    sheen.addColorStop(1, '#00000000');
    bg.fillStyle = sheen;
    bg.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  ctx.drawImage(tubeBackground, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

export function drawEventScreen(ctx: CanvasRenderingContext2D, state: ScreenState, photo: HTMLImageElement | null = null) {
  const { events, selected, position, page, pagePosition, showEvents, tapeHover } = state;
  const event = events[selected];
  const color = eventColor(event);
  drawTubeBackground(ctx);
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
      .forEach(({ item, index, offset }) => tape(ctx, item, index, offset, photo, tapeHover?.index === index ? tapeHover : undefined));
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
