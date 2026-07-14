import { useState, useCallback, useRef } from 'react';
import './DiceRoller.css';

// ---------- 类型 ----------
interface DieInstance {
  id: string;
  sides: number;
  color: string;
  label: string;
  value: number | null;
  selected: boolean;
  rolling: boolean;
}

interface Preset {
  sides: number;
  color: string;
  label: string;
}

// ---------- 预设骰子 ----------
const PRESETS: Preset[] = [
  { sides: 8, color: '#f57c00', label: 'd8' },
  { sides: 6, color: '#7b1fa2', label: 'd6' },
  { sides: 4, color: '#1565c0', label: 'd4' },
];

const CUSTOM_COLOR = '#c62828';
const SIDE_OPTIONS = [4, 6, 8, 10, 12, 20, 100];

let _nextId = 1;
function uid() {
  return `die-${_nextId++}`;
}

// ---------- 组件 ----------
export default function DiceRoller() {
  const [expanded, setExpanded] = useState(false);
  const [dice, setDice] = useState<DieInstance[]>([]);
  const [customSides, setCustomSides] = useState(6);
  const [customCount, setCustomCount] = useState(1);
  const rollingRef = useRef(false);

  const addDice = useCallback((sides: number, color: string, label: string, count: number) => {
    const newDice: DieInstance[] = [];
    for (let i = 0; i < count; i++) {
      newDice.push({ id: uid(), sides, color, label, value: null, selected: false, rolling: false });
    }
    setDice((prev) => [...prev, ...newDice]);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setDice((prev) => prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d)));
  }, []);

  const toggleAll = useCallback(() => {
    setDice((prev) => {
      const anySelected = prev.some((d) => d.selected);
      return prev.map((d) => ({ ...d, selected: !anySelected }));
    });
  }, []);

  const removeSelected = useCallback(() => {
    setDice((prev) => prev.filter((d) => !d.selected));
  }, []);

  const rollSelected = useCallback(() => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setDice((prev) => {
      const hasSelection = prev.some((d) => d.selected);
      return prev.map((d) => {
        const shouldRoll = hasSelection ? d.selected : true;
        return shouldRoll ? { ...d, rolling: true } : d;
      });
    });
    const tickInterval = 60;
    const totalDuration = 600;
    let elapsed = 0;
    const tick = () => {
      elapsed += tickInterval;
      setDice((prev) => prev.map((d) => (d.rolling ? { ...d, value: randomFace(d.sides) } : d)));
      if (elapsed < totalDuration) {
        setTimeout(tick, tickInterval);
      } else {
        setDice((prev) =>
          prev.map((d) =>
            d.rolling ? { ...d, value: randomFace(d.sides), rolling: false, selected: false } : d,
          ),
        );
        rollingRef.current = false;
      }
    };
    tick();
  }, []);

  const clearAll = useCallback(() => {
    if (rollingRef.current) return;
    setDice([]);
  }, []);

  const selectedCount = dice.filter((d) => d.selected).length;
  const totalCount = dice.length;
  const anyRolling = dice.some((d) => d.rolling);

  // ====== 折叠按钮（面板外） ======
  if (!expanded) {
    return (
      <button style={s.expandBtn} onClick={() => setExpanded(true)} title="展开掷骰">
        🎲 展开掷骰
      </button>
    );
  }

  // ====== 展开面板 ======
  return (
    <div style={s.overlay}>
      <div style={s.panel} onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 + 隐藏按钮 */}
        <div style={s.header}>
          <h3 style={s.title}>🎲 掷骰子</h3>
          <button style={s.hideBtn} onClick={() => setExpanded(false)}>
            隐藏区域
          </button>
        </div>

        <div style={s.body}>
          {/* 预设骰子 */}
          <div style={s.presetRow}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                style={{ ...s.presetBtn, backgroundColor: p.color, clipPath: getClipPath(p.sides) }}
                onClick={() => addDice(p.sides, p.color, p.label, 1)}
                disabled={anyRolling}
                title={`添加 ${p.label}（${p.sides}面）`}
              >
                <span style={s.presetIcon}>{getDieIcon(p.sides)}</span>
                <span style={s.presetLabel}>{p.label}</span>
              </button>
            ))}
          </div>

          {/* 自定义骰子 */}
          <div style={s.customRow}>
            <span style={s.customLabel}>自定义：</span>
            <select value={customSides} onChange={(e) => setCustomSides(Number(e.target.value))} style={s.select} disabled={anyRolling}>
              {SIDE_OPTIONS.map((v) => (<option key={v} value={v}>d{v}</option>))}
            </select>
            <span style={s.customLabel}>×</span>
            <input type="number" min={1} max={20} value={customCount}
              onChange={(e) => setCustomCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              style={s.numInput} disabled={anyRolling} />
            <button style={{ ...s.addCustomBtn, backgroundColor: CUSTOM_COLOR }}
              onClick={() => addDice(customSides, CUSTOM_COLOR, `d${customSides}`, customCount)} disabled={anyRolling}>
              添加
            </button>
          </div>

          {/* 骰子托盘 */}
          {totalCount > 0 && (
            <div style={s.trayActions}>
              <button style={s.smallBtn} onClick={toggleAll} disabled={anyRolling}>
                {selectedCount === totalCount ? '取消全选' : '全选'}
              </button>
              <button style={s.smallBtn} onClick={removeSelected} disabled={anyRolling || selectedCount === 0}>
                移除选中
              </button>
              <button style={s.smallBtnDanger} onClick={clearAll} disabled={anyRolling}>清空</button>
              <span style={s.trayCount}>{selectedCount > 0 ? `${selectedCount}/${totalCount}` : `${totalCount} 个`}</span>
            </div>
          )}

          {totalCount === 0 ? (
            <p style={s.emptyHint}>点击上方骰子添加到此处</p>
          ) : (
            <div style={s.diceGrid}>
              {dice.map((die) => (
                <button key={die.id}
                  style={{ ...s.dieBtn, backgroundColor: die.color, clipPath: getClipPath(die.sides), boxShadow: die.selected ? `0 0 0 3px #000, ${s.dieBtn.boxShadow}` : s.dieBtn.boxShadow }}
                  className={die.rolling ? 'dice-rolling' : ''}
                  onClick={() => toggleSelect(die.id)} disabled={anyRolling}>
                  <span style={s.dieLabel}>{die.label}</span>
                  <span style={s.dieValue}>{die.value ?? '?'}</span>
                </button>
              ))}
            </div>
          )}

          {totalCount > 0 && (
            <button style={{ ...s.rollBtn, opacity: anyRolling ? 0.6 : 1 }} onClick={rollSelected} disabled={anyRolling}>
              {anyRolling ? '🎲 掷骰中...' : selectedCount > 0 ? `🎲 重投选中 (${selectedCount})` : '🎲 全部重投'}
            </button>
          )}

          {/* 结果汇总 */}
          {totalCount > 0 && (
            <div style={s.summaryRow}>
              {(() => {
                const rolled = dice.filter((d) => d.value !== null);
                if (rolled.length === 0) return <span style={s.emptyHint}>尚未掷骰</span>;
                const sum = rolled.reduce((a, d) => a + (d.value ?? 0), 0);
                const faces = rolled.map((d) => `${d.label}=${d.value}`).join(', ');
                return <><span style={s.summaryDetail}>{faces}</span><span style={s.summarySum}>合计：{sum}</span></>;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- 工具 ----------
function randomFace(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}
function getDieIcon(sides: number): string {
  const map: Record<number, string> = { 4: '△', 6: '◻', 8: '⬠', 10: '⬡', 12: '✶', 20: '⬢', 100: '◉' };
  return map[sides] ?? '◻';
}

/** 骰子形状：d4=三角形, d6=正方形圆角, d8=六边形, 其他=矩形圆角 */
function getClipPath(sides: number): string | undefined {
  switch (sides) {
    case 4: return 'polygon(50% 8%, 94% 88%, 6% 88%)';
    case 8: return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    default: return undefined; // d6 等保持圆角矩形
  }
}

// ---------- 样式 ----------
const s: Record<string, React.CSSProperties> = {
  expandBtn: {
    position: 'fixed',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 999,
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #ff8f00, #f57c00)',
    color: '#fff',
    border: 'none',
    borderRadius: '0 10px 10px 0',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    writingMode: 'vertical-rl',
    letterSpacing: 4,
    boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  panel: {
    width: 340,
    maxHeight: '100vh',
    overflowY: 'auto',
    background: '#fff',
    borderRight: '2px solid #f57c00',
    boxShadow: '4px 0 16px rgba(0,0,0,0.12)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '2px solid #f57c00',
    background: '#fff8f0',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  title: { margin: 0, fontSize: 17 },
  hideBtn: {
    padding: '5px 14px',
    border: '2px solid #f57c00',
    borderRadius: 6,
    background: '#fff',
    color: '#f57c00',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  },
  body: { padding: '14px 18px 20px' },
  presetRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 },
  presetBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: 60, height: 60, border: 'none', borderRadius: 10, cursor: 'pointer',
    color: '#fff', fontWeight: 700, fontSize: 11, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  presetIcon: { fontSize: 20 },
  presetLabel: { marginTop: 1 },
  customRow: { display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: '1px solid #eee', marginBottom: 10 },
  customLabel: { fontSize: 13, color: '#555' },
  select: { padding: '5px 8px', borderRadius: 5, border: '1px solid #ccc', fontSize: 13, background: '#fff' },
  numInput: { width: 44, padding: '5px 6px', borderRadius: 5, border: '1px solid #ccc', fontSize: 13, textAlign: 'center' },
  addCustomBtn: { padding: '5px 14px', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  trayActions: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  smallBtn: { padding: '3px 10px', border: '1px solid #bbb', borderRadius: 5, background: '#fafafa', cursor: 'pointer', fontSize: 11 },
  smallBtnDanger: { padding: '3px 10px', border: '1px solid #e57373', borderRadius: 5, background: '#fff5f5', color: '#c62828', cursor: 'pointer', fontSize: 11 },
  trayCount: { marginLeft: 'auto', fontSize: 12, color: '#888' },
  emptyHint: { color: '#999', fontSize: 13, textAlign: 'center', margin: '8px 0' },
  diceGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  dieBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: 52, height: 52, border: 'none', borderRadius: 9, cursor: 'pointer',
    color: '#fff', fontWeight: 700, fontSize: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'transform 0.1s', userSelect: 'none',
  },
  dieLabel: { opacity: 0.75, fontSize: 9 },
  dieValue: { fontSize: 18, marginTop: 1 },
  rollBtn: {
    display: 'block', width: '100%', padding: '10px 0', border: 'none', borderRadius: 8,
    background: 'linear-gradient(135deg, #ff8f00, #f57c00)', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(245,124,0,0.3)', transition: 'opacity 0.2s',
  },
  summaryRow: { marginTop: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  summaryDetail: { fontSize: 12, color: '#555', flex: 1 },
  summarySum: { fontSize: 15, fontWeight: 700, color: '#e65100' },
};
