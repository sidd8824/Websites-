import { useEffect, useRef, useState } from 'react';
import './MenuOverlay.css';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
}
interface Props {
  open: boolean;
  items: MenuItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function MenuOverlay({ open, items, activeId, onSelect, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlighted, setHighlighted] = useState(activeId);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setHighlighted(activeId);
    const frame = requestAnimationFrame(() => {
      const active = items.findIndex(item => item.id === activeId);
      buttons.current[Math.max(0, active)]?.focus({ preventScroll: true });
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab') {
        const controls = panel.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      opener?.focus({ preventScroll: true });
    };
  }, [open, activeId, items, onClose]);

  if (!open) return null;
  return (
    <div className="win95-menu-layer">
      <div className="win95-menu-backdrop" aria-hidden="true" onClick={onClose} />
      <div ref={panel} id="win95-site-menu" className="win95-menu" role="dialog" aria-modal="true" aria-label="Site menu"
        onKeyDown={event => {
          const controls = buttons.current.filter((button): button is HTMLButtonElement => button !== null);
          const current = controls.indexOf(document.activeElement as HTMLButtonElement);
          let next = current;
          if (event.key === 'ArrowDown') next = (current + 1) % controls.length;
          else if (event.key === 'ArrowUp') next = (current - 1 + controls.length) % controls.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = controls.length - 1;
          else return;
          event.preventDefault();
          controls[next]?.focus();
        }}>
        <div className="win95-menu-brand" aria-hidden="true"><span><strong>B/Stack</strong><span>95</span></span></div>
        <div className="win95-menu-content">
          {items.map((item, index) => (
            <button key={item.id} ref={button => { buttons.current[index] = button; }} type="button"
              className={`win95-menu-item${highlighted === item.id ? ' is-highlighted' : ''}`}
              aria-current={activeId === item.id ? 'page' : undefined}
              onMouseEnter={() => setHighlighted(item.id)} onFocus={() => setHighlighted(item.id)}
              onClick={() => onSelect(item.id)}>
              <span className="win95-menu-icon" aria-hidden="true">{item.icon ?? '📁'}</span>
              <span className="win95-menu-label"><span className="win95-menu-initial">{item.label[0]}</span>{item.label.slice(1)}</span>
              <span className="win95-menu-arrow" aria-hidden="true">▸</span>
            </button>
          ))}
          <div className="win95-menu-separator" role="separator" />
          <button ref={button => { buttons.current[items.length] = button; }} type="button"
            className={`win95-menu-item win95-menu-close${highlighted === 'close' ? ' is-highlighted' : ''}`}
            onMouseEnter={() => setHighlighted('close')} onFocus={() => setHighlighted('close')} onClick={onClose}>
            <span className="win95-menu-icon" aria-hidden="true">🚪</span>
            <span className="win95-menu-label"><span className="win95-menu-initial">C</span>lose menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
