import type { ComponentType, Lang } from '../types';
import { PALETTE_ITEMS } from '../content/loadContent';

export type PaletteCategory =
  | 'networking'
  | 'compute'
  | 'storage'
  | 'data'
  | 'messaging'
  | 'observability'
  | 'security';

export interface PaletteItem {
  type: ComponentType;
  label: { ar: string; en: string };
  color: string;
  short: string;
  category: PaletteCategory;
  awsService: { ar: string; en: string };
  /** Path under site base, e.g. aws-icons/s3.svg */
  icon: string;
}

export const PALETTE_CATEGORIES: { id: PaletteCategory; label: { ar: string; en: string } }[] = [
  { id: 'networking', label: { ar: 'شبكات', en: 'Networking' } },
  { id: 'compute', label: { ar: 'حوسبة', en: 'Compute' } },
  { id: 'storage', label: { ar: 'تخزين', en: 'Storage' } },
  { id: 'data', label: { ar: 'بيانات', en: 'Data' } },
  { id: 'messaging', label: { ar: 'رسائل', en: 'Messaging' } },
  { id: 'observability', label: { ar: 'مراقبة', en: 'Observability' } },
  { id: 'security', label: { ar: 'أمان', en: 'Security' } },
];

export const PALETTE: PaletteItem[] = PALETTE_ITEMS as PaletteItem[];

const RECENT_KEY = 'sysdesign-drawing-recent-v1';
const RECENT_MAX = 8;

export function paletteItem(type: ComponentType): PaletteItem | undefined {
  return PALETTE.find(p => p.type === type);
}

export function paletteLabel(type: ComponentType, lang: Lang): string {
  return paletteItem(type)?.label[lang] || type;
}

export function paletteColor(type: ComponentType): string {
  return paletteItem(type)?.color || '#666';
}

export function paletteShort(type: ComponentType): string {
  return paletteItem(type)?.short || type.slice(0, 3).toUpperCase();
}

export function paletteAws(type: ComponentType, lang: Lang): string {
  return paletteItem(type)?.awsService[lang] || '';
}

export function paletteIconUrl(type: ComponentType): string {
  const icon = paletteItem(type)?.icon;
  if (!icon) return '';
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${icon.replace(/^\//, '')}`;
}

export function readRecentTypes(): ComponentType[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return arr.filter(t => PALETTE.some(p => p.type === t)) as ComponentType[];
  } catch {
    return [];
  }
}

export function pushRecentType(type: ComponentType) {
  const next = [type, ...readRecentTypes().filter(t => t !== type)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function groupPaletteByCategory(items: PaletteItem[] = PALETTE) {
  return PALETTE_CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.id),
  })).filter(g => g.items.length > 0);
}
