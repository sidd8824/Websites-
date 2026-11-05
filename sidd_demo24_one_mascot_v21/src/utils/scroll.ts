import type Lenis from 'lenis';

// One shared Lenis instance so every button/nav link scrolls through the same
// smooth-scroll engine (mixing native smooth scroll with Lenis causes jitter).
let instance: Lenis | null = null;

export function registerLenis(l: Lenis | null) {
  instance = l;
}

export function scrollToY(y: number, duration = 1.4) {
  if (instance) instance.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

export function scrollToElement(el: HTMLElement) {
  if (instance) instance.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

// Document-relative top of an element (offsetTop is relative to the nearest positioned parent, which breaks once sections sit inside colour panels).
export function docTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY;
}

// While the full-screen menu is open the page behind it must not scroll.
export function lockScroll() {
  if (instance) instance.stop();
  else document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (instance) instance.start();
  else document.body.style.overflow = '';
}
