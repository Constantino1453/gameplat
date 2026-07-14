// 卡牌数据定义与 JSON 加载

export interface CardDef {
  cost: number;
  name: string;
  description: string;
  type: string | null;
  sign: [number | null, number | null];
}

// 属性中文映射
export const FIELD_LABELS: Record<string, string> = {
  cost: '费用',
  name: '名称',
  description: '描述',
  type: '类型',
  sign: '印记',
};

// 从 cards.json 加载的原始数据
import cardsRaw from './cards.json';
export const ALL_CARDS: CardDef[] = cardsRaw as CardDef[];

// 按名称索引
export const CARD_MAP = new Map<string, CardDef>();
ALL_CARDS.forEach((c) => CARD_MAP.set(c.name, c));

// 图片路径
export function getCardImage(name: string): string {
  return `/cards/${encodeURIComponent(name)}.png`;
}

// 牌背选项
export interface CardbackOption {
  key: string;    // 存储值
  label: string;  // 中文名
  path: string;   // 图片路径
}
export const CARDBACK_OPTIONS: CardbackOption[] = [
  { key: 'default', label: '默认', path: '/cards/cardback/cardback_default.PNG' },
  { key: 'lotus',   label: '莲花', path: '/cards/cardback/cardback_totus.png' },
  { key: 'loong',   label: '龙',   path: '/cards/cardback/cardback_loong.png' },
  { key: 'mys',     label: '神秘', path: '/cards/cardback/carback_mys.png' },
  { key: 'saber',   label: '长剑', path: '/cards/cardback/cardback_saber.png' },
];
const CARDBACK_MAP = new Map(CARDBACK_OPTIONS.map((o) => [o.key, o.path]));

export function getCardbackPath(key?: string): string {
  return CARDBACK_MAP.get(key ?? 'default') ?? CARDBACK_OPTIONS[0].path;
}

// 向后兼容：默认牌背
export const CARD_BACK = CARDBACK_OPTIONS[0].path;
export const NULL_CARD = '/cards/nullcard.PNG';
