import type { ComponentType, Lang } from '../types';
import { PALETTE_ITEMS } from '../content/loadContent';

export interface PaletteItem {
  type: ComponentType;
  label: { ar: string; en: string };
  color: string;
  short: string;
}

export const PALETTE: PaletteItem[] = PALETTE_ITEMS as PaletteItem[];

export function paletteLabel(type: ComponentType, lang: Lang): string {
  return PALETTE.find(p => p.type === type)?.label[lang] || type;
}

export function paletteColor(type: ComponentType): string {
  return PALETTE.find(p => p.type === type)?.color || '#666';
}

export function paletteShort(type: ComponentType): string {
  return PALETTE.find(p => p.type === type)?.short || type.slice(0, 3).toUpperCase();
}
