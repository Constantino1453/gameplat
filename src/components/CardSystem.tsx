import { useState, useCallback, useRef, useEffect } from 'react';
import { ALL_CARDS, CARD_MAP, getCardImage, getCardbackPath, CARDBACK_OPTIONS, CARD_BACK, NULL_CARD, CardDef } from '../data/cards';
import CardTooltip from './CardTooltip';

// ---------- 类型 ----------
interface Pile {
  id: string;
  label: string;
  cardNames: string[];
  count: number;
  cardback: string;
}

interface HandCard {
  id: string;
  cardDef: CardDef;
  pileId: string;
}

let _pid = 1;
function pid() { return `pile-${_pid++}`; }
let _hid = 1;
function hid() { return `hand-${_hid++}`; }

// ---------- 组件 ----------
export default function CardSystem() {
  const [piles, setPiles] = useState<Pile[]>([]);
  const [hand, setHand] = useState<HandCard[]>([]);
  const [selectedHandId, setSelectedHandId] = useState<string | null>(null);
  const [showAddPile, setShowAddPile] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(new Map());
  const [selectedCardback, setSelectedCardback] = useState('default');

  // 动画锁：非 null 表示正在抽牌动画中，禁止再次抽牌
  const [drawingPileId, setDrawingPileId] = useState<string | null>(null);
  const drawingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 点击空白区域取消手牌选中
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSelectedHandId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 添加牌堆
  const addPile = useCallback(() => {
    const names: string[] = [];
    selectedCards.forEach((count, name) => {
      for (let i = 0; i < count; i++) names.push(name);
    });
    if (names.length === 0) return;
    setPiles((prev) => [...prev, { id: pid(), label: `${names.length} 张卡牌`, cardNames: names, count: names.length, cardback: selectedCardback }]);
    setSelectedCards(new Map());
    setShowAddPile(false);
  }, [selectedCards]);

  const toggleCardSelect = useCallback((name: string) => {
    setSelectedCards((prev) => {
      const next = new Map(prev);
      next.has(name) ? next.delete(name) : next.set(name, 1);
      return next;
    });
  }, []);

  const selectAllCards = useCallback(() => {
    const next = new Map<string, number>();
    ALL_CARDS.forEach((c) => next.set(c.name, 1));
    setSelectedCards(next);
  }, []);

  const adjustCardCount = useCallback((name: string, delta: number) => {
    setSelectedCards((prev) => {
      const next = new Map(prev);
      const cur = next.get(name) ?? 1;
      const val = Math.max(0, Math.min(99, cur + delta));
      val === 0 ? next.delete(name) : next.set(name, val);
      return next;
    });
  }, []);

  // ---- 核心：从牌堆抽 1 张 ----
  const drawOne = useCallback((pileId: string) => {
    if (drawingPileId !== null) return;

    // 从闭包中同步读取当前 piles（React 事件处理内读取的 state 是触发渲染时的最新值）
    const pile = piles.find((p) => p.id === pileId);
    if (!pile || pile.cardNames.length === 0) return;

    const remaining = [...pile.cardNames];
    const idx = Math.floor(Math.random() * remaining.length);
    const drawn = remaining.splice(idx, 1)[0];
    const cardDef = CARD_MAP.get(drawn);

    // 两个独立的 setState，都不嵌套在对方 updater 内
    setPiles((prev) =>
      prev.map((p) => (p.id === pileId ? { ...p, cardNames: remaining, count: remaining.length } : p)),
    );
    if (cardDef) {
      setHand((prev) => [...prev, { id: hid(), cardDef, pileId }]);
    }

    // 启动 300ms 动画锁
    setDrawingPileId(pileId);
    if (drawingTimerRef.current) clearTimeout(drawingTimerRef.current);
    drawingTimerRef.current = setTimeout(() => setDrawingPileId(null), 300);
  }, [piles, drawingPileId]);

  // ---- 核心：从牌堆抽 N 张 ----
  const drawMultiple = useCallback((pileId: string, count: number) => {
    if (drawingPileId !== null) return;

    const pile = piles.find((p) => p.id === pileId);
    if (!pile || pile.cardNames.length < count) return;

    const remaining = [...pile.cardNames];
    const drawn: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * remaining.length);
      drawn.push(remaining.splice(idx, 1)[0]);
    }

    setPiles((prev) =>
      prev.map((p) => (p.id === pileId ? { ...p, cardNames: remaining, count: remaining.length } : p)),
    );
    setHand((prev) => {
      const newCards = drawn
        .map((name) => ({ name, cardDef: CARD_MAP.get(name) }))
        .filter((d): d is { name: string; cardDef: CardDef } => !!d.cardDef)
        .map((d) => ({ id: hid(), cardDef: d.cardDef, pileId }));
      return [...prev, ...newCards];
    });

    setDrawingPileId(pileId);
    if (drawingTimerRef.current) clearTimeout(drawingTimerRef.current);
    drawingTimerRef.current = setTimeout(() => setDrawingPileId(null), 300);
  }, [piles, drawingPileId]);

  // 手牌点击：选中/打出
  const handleHandClick = useCallback((handId: string) => {
    setSelectedHandId((prev) => {
      if (prev === handId) {
        setHand((h) => h.filter((c) => c.id !== handId));
        return null;
      }
      return handId;
    });
  }, []);

  const removePile = useCallback((pileId: string) => {
    setPiles((prev) => prev.filter((p) => p.id !== pileId));
  }, []);

  const selectedCount = Array.from(selectedCards.values()).reduce((a, b) => a + b, 0);

  return (
    <div style={s.wrapper} ref={wrapperRef}>
      {/* 飞出动画样式 */}
      <style>{flyKeyframes}</style>

      {/* ====== 牌堆区域 ====== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>📚 牌堆</h3>
          <button style={s.addPileBtn} onClick={() => setShowAddPile(!showAddPile)}>
            {showAddPile ? '取消' : '+ 添加牌堆'}
          </button>
        </div>

        {showAddPile && (
          <div style={s.addPilePanel}>
            <div style={s.cardSelectGrid}>
              {ALL_CARDS.map((card) => {
                const selCount = selectedCards.get(card.name) ?? 0;
                const isSelected = selCount > 0;
                return (
                  <div key={card.name}
                    style={{
                      ...s.cardSelectItem,
                      background: isSelected ? '#e8f0fe' : '#fff',
                      borderColor: isSelected ? '#1a73e8' : '#ddd',
                    }}
                    onClick={() => toggleCardSelect(card.name)}>
                    <CardImage name={card.name} size={56} faceUp />
                    <div style={s.cardSelectInfo}>
                      <span style={s.cardSelectName}>{card.name}</span>
                      <span style={s.cardSelectCost}>{card.cost} 费</span>
                    </div>
                    {isSelected && (
                      <div style={s.qtyCtrl} onClick={(e) => e.stopPropagation()}>
                        <button style={s.qtyBtn} onClick={() => adjustCardCount(card.name, -1)}>−</button>
                        <span style={s.qtyVal}>{selCount}</span>
                        <button style={s.qtyBtn} onClick={() => adjustCardCount(card.name, 1)}>+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showAddPile && (
          <div style={s.addPileFooter}>
            <button style={s.selectAllBtn} onClick={selectAllCards}>一键全选</button>
            <div style={s.cardbackPicker}>
              <span style={s.cardbackPickerLabel}>牌背：</span>
              {CARDBACK_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  style={{
                    ...s.cardbackOption,
                    borderColor: selectedCardback === o.key ? "#1a73e8" : "#ccc",
                    background: selectedCardback === o.key ? "#e8f0fe" : "#fff",
                  }}
                  onClick={() => setSelectedCardback(o.key)}
                  title={o.label}>
                  {o.label}
                </button>
              ))}
            </div>
            <span>已选 {selectedCount} 张</span>
            <button
              style={{ ...s.confirmBtn, opacity: selectedCount > 0 ? 1 : 0.4 }}
              onClick={addPile}
              disabled={selectedCount === 0}>
              确定创建
            </button>
          </div>
        )}

        {piles.length === 0 ? (
          <p style={s.emptyHint}>点击「添加牌堆」来创建你的第一副牌堆</p>
        ) : (
          <div style={s.pileGrid}>
            {piles.map((pile) => {
              const isAnimating = drawingPileId === pile.id;
              const canDraw = !isAnimating && pile.count > 0;
              return (
                <div key={pile.id} style={s.pileItem}>
                  <button
                    style={s.pileBtn}
                    onClick={() => drawOne(pile.id)}
                    disabled={!canDraw}
                    title="点击抽 1 张">
                    <div style={s.pileImgWrap}>
                      <img src={getCardbackPath(pile.cardback)} alt="牌背" style={s.pileImg}
                        onError={(e) => { (e.target as HTMLImageElement).src = NULL_CARD; }} />
                      {pile.count === 0 && <span style={s.emptyOverlay}>空</span>}
                      {/* 飞出动画 */}
                      {isAnimating && (
                        <img src={getCardbackPath(pile.cardback)} alt="" className="card-fly-out" style={s.flyImg} />
                      )}
                    </div>
                  </button>
                  <span style={s.pileLabel}>{pile.label}</span>
                  <span style={s.pileCount}>{pile.count} 张</span>

                  {/* 抽3张按钮 */}
                  <button
                    style={{
                      ...s.draw3Btn,
                      opacity: pile.count >= 3 && !isAnimating ? 1 : 0.35,
                      cursor: pile.count >= 3 && !isAnimating ? 'pointer' : 'not-allowed',
                    }}
                    onClick={() => drawMultiple(pile.id, 3)}
                    disabled={pile.count < 3 || isAnimating}
                    title="一次抽 3 张">
                    抽3张
                  </button>

                  <button style={s.removePileBtn} onClick={() => removePile(pile.id)} title="删除牌堆">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== 手牌区域 ====== */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>
          🃏 手牌
          {hand.length > 0 && <span style={s.handCount}>{hand.length} 张</span>}
        </h3>
        {hand.length === 0 ? (
          <p style={s.emptyHint}>点击上方牌堆抽牌，卡牌将出现在此处</p>
        ) : (
          <div style={s.handRow}>
            {hand.map((hc) => {
              const isSelected = hc.id === selectedHandId;
              return (
                <CardTooltip key={hc.id} card={hc.cardDef}>
                  <button
                    style={{
                      ...s.handCard,
                      boxShadow: isSelected
                        ? '0 0 0 3px #f9a825, 0 4px 12px rgba(249,168,37,0.4)'
                        : '0 2px 8px rgba(0,0,0,0.15)',
                      transform: isSelected ? 'translateY(-8px)' : 'none',
                    }}
                    onClick={() => handleHandClick(hc.id)}>
                    <CardImage name={hc.cardDef.name} size={90} faceUp />
                    <span style={s.handCardName}>{hc.cardDef.name}</span>
                  </button>
                </CardTooltip>
              );
            })}
          </div>
        )}
        {selectedHandId && (
          <p style={s.hintText}>再次点击已选中的手牌即可打出</p>
        )}
      </div>
    </div>
  );
}

// ---------- 飞出动画 CSS ----------
const flyKeyframes = `
@keyframes card-fly-out {
  0%   { transform: translateX(0) rotateZ(0deg); opacity: 1; }
  100% { transform: translateX(90px) translateY(-20px) rotateZ(18deg); opacity: 0; }
}
.card-fly-out {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  animation: card-fly-out 300ms ease-out forwards;
  pointer-events: none;
}
`;

// ---------- 卡牌图片 ----------
function CardImage({ name, size, faceUp }: { name: string; size: number; faceUp: boolean }) {
  const src = faceUp ? getCardImage(name) : CARD_BACK;
  return (
    <img src={src} alt={name}
      style={{ width: size, height: size * 1.4, borderRadius: 6, objectFit: 'cover' }}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (faceUp && img.src.endsWith('.png')) {
          // PNG 不存在，尝试 JPEG
          img.src = `/cards/${encodeURIComponent(name)}.jpeg`;
        } else if (img.src !== NULL_CARD) {
          img.src = NULL_CARD;
        }
      }} />
  );
}

// ---------- 样式 ----------
const s: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 },
  section: { background: '#fff', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 },
  handCount: { fontSize: 13, background: '#e8e8e8', padding: '2px 10px', borderRadius: 10, fontWeight: 400 },
  addPileBtn: { padding: '7px 18px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #1976d2, #1565c0)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  addPilePanel: { border: '1px solid #e0e0e0', borderRadius: 10, padding: 12, marginBottom: 6, maxHeight: 360, overflowY: 'auto', background: '#fafafa' },
  cardSelectGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  cardSelectItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, border: '2px solid #ddd', cursor: 'pointer', transition: 'background 0.15s' },
  cardSelectInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  cardSelectName: { fontSize: 14, fontWeight: 600 },
  cardSelectCost: { fontSize: 12, color: '#888' },
  qtyCtrl: { display: 'flex', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 26, height: 26, border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: '24px', textAlign: 'center', padding: 0 },
  qtyVal: { minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 14 },
  addPileFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e0e0e0', fontSize: 14, marginBottom: 14 },
  confirmBtn: { padding: '8px 24px', border: 'none', borderRadius: 8, background: '#1a73e8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  selectAllBtn: { padding: '8px 18px', border: '2px solid #1a73e8', borderRadius: 8, background: '#fff', color: '#1a73e8', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  cardbackPicker: { display: 'flex', alignItems: 'center', gap: 4 },
  cardbackPickerLabel: { fontSize: 13, color: '#555', flexShrink: 0 },
  cardbackOption: { padding: '4px 8px', border: '2px solid #ccc', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'border-color 0.15s, background 0.15s' },
  pileGrid: { display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  pileItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' },
  pileBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.15s' },
  pileImgWrap: { position: 'relative' },
  pileImg: { width: 80, height: 112, borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
  flyImg: { width: 80, height: 112, borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  emptyOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828', fontWeight: 900, fontSize: 28, background: 'rgba(0,0,0,0.4)', borderRadius: 8, pointerEvents: 'none' },
  pileLabel: { fontSize: 12, color: '#555', maxWidth: 80, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pileCount: { fontSize: 11, color: '#888' },
  draw3Btn: { padding: '3px 12px', border: '1px solid #888', borderRadius: 5, background: '#fff', fontSize: 11, fontWeight: 600, transition: 'opacity 0.2s' },
  removePileBtn: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, border: 'none', borderRadius: '50%', background: '#c62828', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', lineHeight: '22px', padding: 0, textAlign: 'center' },
  handRow: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  handCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', padding: 4, borderRadius: 10, transition: 'transform 0.15s, box-shadow 0.15s' },
  handCardName: { fontSize: 11, color: '#555', maxWidth: 90, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  hintText: { textAlign: 'center', fontSize: 12, color: '#999', marginTop: 8 },
  emptyHint: { color: '#999', fontSize: 14, textAlign: 'center', margin: '8px 0' },
};
