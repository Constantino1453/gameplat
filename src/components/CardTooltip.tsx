import { useState, useRef, useCallback } from 'react';
import { CardDef, FIELD_LABELS } from '../data/cards';

interface Props {
  card: CardDef;
  children: React.ReactNode;
}

export default function CardTooltip({ card, children }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((e: React.MouseEvent) => {
    timerRef.current = setTimeout(() => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    }, 500);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setVisible(false);
  }, []);

  const move = useCallback((e: React.MouseEvent) => {
    if (visible) setPos({ x: e.clientX, y: e.clientY });
  }, [visible]);

  return (
    <span onMouseEnter={show} onMouseLeave={hide} onMouseMove={move} style={{ display: 'inline-flex' }}>
      {children}
      {visible && (
        <div style={{ ...s.tip, left: pos.x - 14, top: pos.y }}>
          <div style={s.arrow} />
          <div style={s.content}>
            {(['cost', 'name', 'type', 'description', 'sign'] as const).map((key) => {
              const label = FIELD_LABELS[key];
              const value = card[key];
              const display = key === 'sign'
                ? `[${card.sign[0] ?? '—'}, ${card.sign[1] ?? '—'}]`
                : value ?? '—';
              return (
                <div key={key} style={s.row}>
                  <span style={s.label}>{label}</span>
                  <span style={s.value}>{String(display)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </span>
  );
}

const s: Record<string, React.CSSProperties> = {
  tip: {
    position: 'fixed',
    transform: 'translate(-100%, -12px)',
    zIndex: 2000,
    pointerEvents: 'none',
  },
  arrow: {
    position: 'absolute',
    right: -6,
    top: 18,
    width: 12,
    height: 12,
    background: '#1a1a2e',
    transform: 'rotate(45deg)',
    borderRadius: 2,
  },
  content: {
    background: '#1a1a2e',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: '10px 14px',
    minWidth: 190,
    maxWidth: 280,
    fontSize: 13,
    lineHeight: 1.5,
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
  },
  row: {
    display: 'flex',
    gap: 8,
    padding: '2px 0',
  },
  label: {
    color: '#8ab4f8',
    fontWeight: 600,
    minWidth: 38,
    flexShrink: 0,
  },
  value: {
    color: '#e8eaed',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
};
