import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ComponentType, Lang } from '../types';
import {
  PALETTE,
  groupPaletteByCategory,
  paletteAws,
  paletteIconUrl,
  paletteItem,
  paletteLabel,
  pushRecentType,
  readRecentTypes,
  type PaletteItem,
} from '../interactive/palette';
import { t } from '../i18n';

interface SharedProps {
  lang: Lang;
  armedType: ComponentType | null;
  onArm: (type: ComponentType | null) => void;
  onDragStartPlace?: (type: ComponentType, clientX: number, clientY: number) => void;
}

function Chip({
  item,
  lang,
  armed,
  onArm,
  showCaption,
}: {
  item: PaletteItem;
  lang: Lang;
  armed: boolean;
  onArm: () => void;
  showCaption?: boolean;
}) {
  const label = paletteLabel(item.type, lang);
  const aws = paletteAws(item.type, lang);
  const title = `${label} · ${aws}`;
  return (
    <button
      type="button"
      className={`drawing-chip${armed ? ' is-armed' : ''}`}
      onClick={onArm}
      title={title}
      aria-label={title}
      aria-pressed={armed}
    >
      <img src={paletteIconUrl(item.type)} alt="" width={24} height={24} draggable={false} />
      {showCaption && <span className="drawing-chip__cap">{item.short}</span>}
    </button>
  );
}

function PaletteRow({
  item,
  lang,
  armed,
  onArm,
  onDragStartPlace,
}: {
  item: PaletteItem;
  lang: Lang;
  armed: boolean;
  onArm: () => void;
  onDragStartPlace?: (type: ComponentType, clientX: number, clientY: number) => void;
}) {
  const label = paletteLabel(item.type, lang);
  const aws = paletteAws(item.type, lang);
  return (
    <button
      type="button"
      className={`drawing-palette-row${armed ? ' is-armed' : ''}`}
      onClick={onArm}
      title={`${label} · ${aws}`}
      onPointerDown={e => {
        if (e.button !== 0) return;
        const startX = e.clientX;
        const startY = e.clientY;
        const pid = e.pointerId;
        const target = e.currentTarget;
        target.setPointerCapture(pid);
        const onMove = (ev: PointerEvent) => {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 12) {
            cleanup();
            onDragStartPlace?.(item.type, ev.clientX, ev.clientY);
          }
        };
        const onUp = () => cleanup();
        const cleanup = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          try { target.releasePointerCapture(pid); } catch { /* */ }
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      }}
    >
      <img src={paletteIconUrl(item.type)} alt="" width={22} height={22} draggable={false} />
      <span className="drawing-palette-row__text">
        <span className="drawing-palette-row__label">{label}</span>
        <span className="drawing-palette-row__aws">{aws}</span>
      </span>
    </button>
  );
}

export function DrawingPaletteDesktop({
  lang,
  armedType,
  onArm,
  onDragStartPlace,
  collapsed,
  onToggleCollapse,
}: SharedProps & { collapsed?: boolean; onToggleCollapse?: () => void }) {
  const [recent, setRecent] = useState<ComponentType[]>(() => readRecentTypes());
  const arm = (type: ComponentType) => {
    setRecent(pushRecentType(type));
    onArm(type);
  };
  const recentItems = recent.map(t0 => paletteItem(t0)).filter(Boolean) as PaletteItem[];

  return (
    <aside className={`drawing-palette-desk${collapsed ? ' is-collapsed' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="drawing-palette-desk__head">
        <span>{t('palette', lang)}</span>
        <button type="button" className="drawing-icon-btn" onClick={onToggleCollapse}>
          {collapsed ? t('expandPalette', lang) : t('collapsePalette', lang)}
        </button>
      </div>
      {!collapsed && (
        <div className="drawing-palette-desk__body">
          {recentItems.length > 0 && (
            <div className="drawing-palette-desk__group">
              <p className="drawing-palette-desk__cat">{t('paletteRecent', lang)}</p>
              <div className="drawing-palette-desk__grid">
                {recentItems.map(item => (
                  <PaletteRow
                    key={`r-${item.type}`}
                    item={item}
                    lang={lang}
                    armed={armedType === item.type}
                    onArm={() => arm(item.type)}
                    onDragStartPlace={onDragStartPlace}
                  />
                ))}
              </div>
            </div>
          )}
          {groupPaletteByCategory().map(g => (
            <div key={g.id} className="drawing-palette-desk__group">
              <p className="drawing-palette-desk__cat">{g.label[lang]}</p>
              <div className="drawing-palette-desk__grid">
                {g.items.map(item => (
                  <PaletteRow
                    key={item.type}
                    item={item}
                    lang={lang}
                    armed={armedType === item.type}
                    onArm={() => arm(item.type)}
                    onDragStartPlace={onDragStartPlace}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

export function DrawingPaletteMobile({
  lang,
  armedType,
  onArm,
  onDragStartPlace,
}: SharedProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ComponentType[]>(() => readRecentTypes());
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!sheetOpen) setQuery('');
  }, [sheetOpen]);

  const arm = (type: ComponentType) => {
    setRecent(pushRecentType(type));
    onArm(type);
    setSheetOpen(false);
  };

  const recentItems = recent.map(t0 => paletteItem(t0)).filter(Boolean) as PaletteItem[];
  const stripItems = useMemo(() => {
    const seen = new Set<string>();
    const out: PaletteItem[] = [];
    for (const it of [...recentItems, ...PALETTE]) {
      if (seen.has(it.type)) continue;
      seen.add(it.type);
      out.push(it);
      if (out.length >= 10) break;
    }
    return out;
  }, [recentItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PALETTE;
    return PALETTE.filter(p => {
      const hay = `${p.label.en} ${p.label.ar} ${p.awsService.en} ${p.awsService.ar} ${p.short}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const groups = groupPaletteByCategory(filtered);

  const onSheetPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('.drawing-sheet__handle')) {
      dragStartY.current = e.clientY;
    }
  };
  const onSheetPointerMove = (e: ReactPointerEvent) => {
    if (dragStartY.current == null) return;
    if (e.clientY - dragStartY.current > 80) {
      setSheetOpen(false);
      dragStartY.current = null;
    }
  };

  return (
    <>
      <div className="drawing-palette-strip" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {recentItems.length > 0 && (
          <span className="drawing-palette-strip__label">{t('paletteRecent', lang)}</span>
        )}
        <div className="drawing-palette-strip__scroll">
          {stripItems.map(item => (
            <Chip
              key={item.type}
              item={item}
              lang={lang}
              armed={armedType === item.type}
              onArm={() => arm(item.type)}
              showCaption
            />
          ))}
          <button
            type="button"
            className="drawing-chip drawing-chip--more"
            onClick={() => setSheetOpen(true)}
            aria-label={t('paletteMore', lang)}
          >
            <span className="drawing-chip__more-plus">+</span>
            <span className="drawing-chip__cap">{t('paletteMore', lang)}</span>
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div className="drawing-sheet-backdrop" onClick={() => setSheetOpen(false)} role="presentation">
          <div
            className="drawing-sheet"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            role="dialog"
            aria-modal="true"
            aria-label={t('palette', lang)}
            onClick={e => e.stopPropagation()}
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={() => { dragStartY.current = null; }}
          >
            <div className="drawing-sheet__handle" aria-hidden />
            <div className="drawing-sheet__top">
              <input
                className="drawing-sheet__search"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('paletteSearch', lang)}
                autoFocus
              />
              <button type="button" className="drawing-icon-btn" onClick={() => setSheetOpen(false)}>
                {t('closeSheet', lang)}
              </button>
            </div>
            <div className="drawing-sheet__body">
              {groups.map(g => (
                <div key={g.id} className="drawing-sheet__group">
                  <p className="drawing-sheet__cat">{g.label[lang]}</p>
                  <div className="drawing-sheet__grid">
                    {g.items.map(item => (
                      <PaletteRow
                        key={item.type}
                        item={item}
                        lang={lang}
                        armed={armedType === item.type}
                        onArm={() => arm(item.type)}
                        onDragStartPlace={(type, x, y) => {
                          onDragStartPlace?.(type, x, y);
                          setSheetOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {groups.length === 0 && <p className="drawing-sheet__empty">—</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
