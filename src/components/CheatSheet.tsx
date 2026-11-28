import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Lang } from '../types';
import { CHEATSHEET, GLOSSARY, getGlossaryTerm } from '../content/loadContent';
import { localizedText } from '../i18n';
import { LinkedText } from './TermLink';

interface Props {
  lang: Lang;
  onBack: () => void;
  onToggleLang: () => void;
  onOpenTerm: (termId: string) => void;
  onOpenGlossary: () => void;
}

const CS = {
  title: { ar: 'مرجع أنماط System Design', en: 'System Design Cheat Sheet' },
  subtitle: {
    ar: 'مشكلة/عرض → النمط المناسب. اضغط أي مصطلح لفتح القاموس. حمّل PDF في أي وقت — حتى بدون نت.',
    en: 'Problem/symptom → pattern to use. Tap any term for the glossary. Download PDF anytime — works offline.',
  },
  search: { ar: 'ابحث في الأنماط…', en: 'Search patterns…' },
  allCategories: { ar: 'كل التصنيفات', en: 'All categories' },
  downloadPdf: { ar: 'تحميل PDF / طباعة', en: 'Download PDF / Print' },
  back: { ar: 'رجوع', en: 'Back' },
  problem: { ar: 'المشكلة', en: 'Problem' },
  patterns: { ar: 'النمط', en: 'Pattern(s)' },
  when: { ar: 'امتى تستخدمه', en: 'When to use' },
  tradeoffs: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
  example: { ar: 'مثال', en: 'Example' },
  expandAll: { ar: 'افتح الكل', en: 'Expand all' },
  collapseAll: { ar: 'اقفل الكل', en: 'Collapse all' },
  results: { ar: 'نتيجة', en: 'results' },
  glossary: { ar: 'القاموس', en: 'Glossary' },
  glossaryAppendix: { ar: 'ملحق القاموس', en: 'Glossary Appendix' },
  relatedTerms: { ar: 'مصطلحات', en: 'Terms' },
} as const;

export function CheatSheet({ lang, onBack, onToggleLang, onOpenTerm, onOpenGlossary }: Props) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CHEATSHEET.categories.map(c => [c.id, true]))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHEATSHEET.categories
      .filter(c => categoryId === 'all' || c.id === categoryId)
      .map(c => ({
        ...c,
        entries: c.entries.filter(e => {
          if (!q) return true;
          const hay = [
            e.problem.ar, e.problem.en, e.patterns.ar, e.patterns.en,
            e.when.ar, e.when.en, e.tradeoffs.ar, e.tradeoffs.en,
            e.example.ar, e.example.en, ...e.tags, ...(e.termIds || []),
          ].join(' ').toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter(c => c.entries.length > 0);
  }, [query, categoryId]);

  const total = filtered.reduce((n, c) => n + c.entries.length, 0);
  const expandAll = (value: boolean) => setOpen(Object.fromEntries(CHEATSHEET.categories.map(c => [c.id, value])));

  const downloadPdf = () => {
    document.documentElement.setAttribute('data-print-cheatsheet', 'true');
    expandAll(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => document.documentElement.removeAttribute('data-print-cheatsheet'), 500);
    }, 50);
  };

  const toggleCategory = (id: string, headerEl: HTMLElement | null) => {
    const wasOpen = open[id] !== false;
    setOpen(o => ({ ...o, [id]: !wasOpen }));
    if (wasOpen && headerEl) {
      // After collapse, keep the header in view (important when it was stuck mid-section)
      requestAnimationFrame(() => {
        headerEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  };

  return (
    <div className="cheatsheet-page" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 80px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={onBack} style={btn}>{localizedText(CS.back, lang)}</button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onToggleLang} style={btn}>{lang === 'ar' ? 'English' : 'عربي'}</button>
          <button type="button" onClick={onOpenGlossary} style={btn}>{localizedText(CS.glossary, lang)}</button>
          <button type="button" onClick={downloadPdf} style={{ ...btn, background: 'var(--accent)', color: '#fff', border: 'none' }}>
            {localizedText(CS.downloadPdf, lang)}
          </button>
        </div>
      </div>

      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.4rem, 5vw, 1.85rem)' }}>{localizedText(CS.title, lang)}</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>{localizedText(CS.subtitle, lang)}</p>
      </header>

      <div className="no-print" style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={localizedText(CS.search, lang)}
          style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '1rem' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', minHeight: 40 }}>
            <option value="all">{localizedText(CS.allCategories, lang)}</option>
            {CHEATSHEET.categories.map(c => (
              <option key={c.id} value={c.id}>{localizedText(c.title, lang)}</option>
            ))}
          </select>
          <button type="button" onClick={() => expandAll(true)} style={btn}>{localizedText(CS.expandAll, lang)}</button>
          <button type="button" onClick={() => expandAll(false)} style={btn}>{localizedText(CS.collapseAll, lang)}</button>
          <span style={{ alignSelf: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{total} {localizedText(CS.results, lang)}</span>
        </div>
      </div>

      {filtered.map(cat => (
        <StickyCategory
          key={cat.id}
          title={`${localizedText(cat.title, lang)} (${cat.entries.length})`}
          open={open[cat.id] !== false}
          lang={lang}
          onToggle={(el) => toggleCategory(cat.id, el)}
        >
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {cat.entries.map(entry => (
              <article key={entry.id} id={`cheat-${entry.id}`} className="cheat-entry" style={{ padding: 14, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', breakInside: 'avoid' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--accent)' }}>{localizedText(CS.problem, lang)}:</span>{' '}
                  {localizedText(entry.problem, lang)}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '0.875rem', lineHeight: 1.55 }}>
                  <strong>{localizedText(CS.patterns, lang)}:</strong>{' '}
                  <LinkedText text={localizedText(entry.patterns, lang)} lang={lang} termIds={entry.termIds || []} onOpenTerm={onOpenTerm} />
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                  <strong>{localizedText(CS.when, lang)}:</strong> {localizedText(entry.when, lang)}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                  <strong>{localizedText(CS.tradeoffs, lang)}:</strong> {localizedText(entry.tradeoffs, lang)}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', lineHeight: 1.55 }}>
                  <strong>{localizedText(CS.example, lang)}:</strong> {localizedText(entry.example, lang)}
                </p>
                {(entry.termIds || []).length > 0 && (
                  <p style={{ margin: 0, fontSize: '0.75rem' }}>
                    <strong>{localizedText(CS.relatedTerms, lang)}:</strong>{' '}
                    {(entry.termIds || []).map((tid, i) => {
                      const term = getGlossaryTerm(tid);
                      if (!term) return null;
                      return (
                        <span key={tid}>
                          {i > 0 ? ' · ' : ''}
                          <a href={`#glossary-${tid}`} onClick={(e) => { e.preventDefault(); onOpenTerm(tid); }} style={{ color: 'var(--accent)' }}>
                            {localizedText(term.name, lang)}
                          </a>
                        </span>
                      );
                    })}
                  </p>
                )}
              </article>
            ))}
          </div>
        </StickyCategory>
      ))}

      <section className="cheat-numbers" style={{ marginTop: 28, padding: 16, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>{localizedText(CHEATSHEET.numbers.title, lang)}</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {CHEATSHEET.numbers.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '8px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{localizedText(item.label, lang)}</span>
              <span style={{ fontWeight: 600 }}>{localizedText(item.value, lang)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glossary-appendix print-only" style={{ marginTop: 32, pageBreakBefore: 'always' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 16px', color: 'var(--accent)' }}>{localizedText(CS.glossaryAppendix, lang)}</h2>
        {GLOSSARY.categories.map(cat => {
          const terms = GLOSSARY.terms.filter(t => t.category === cat.id);
          if (!terms.length) return null;
          return (
            <div key={cat.id} style={{ marginBottom: 18, breakInside: 'avoid' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 8px' }}>{localizedText(cat.title, lang)}</h3>
              {terms.map(term => (
                <div key={term.id} id={`glossary-${term.id}`} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', breakInside: 'avoid' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{localizedText(term.name, lang)}</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5 }}>{localizedText(term.definition, lang)}</p>
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function StickyCategory({
  title,
  open,
  lang,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  lang: Lang;
  onToggle: (headerEl: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLButtonElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: [1], rootMargin: '0px 0px 0px 0px' }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <section className="cheat-category" style={{ marginBottom: 16, breakInside: 'avoid' }}>
      <div ref={sentinelRef} className="cheat-category-sentinel no-print" aria-hidden="true" />
      <button
        ref={headerRef}
        type="button"
        className={`cheat-category-header no-print${stuck ? ' is-stuck' : ''}`}
        aria-expanded={open}
        onClick={() => onToggle(headerRef.current)}
        style={{
          width: '100%',
          textAlign: lang === 'ar' ? 'right' : 'left',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        {open ? '▾' : '▸'} {title}
      </button>
      <h2 className="print-only" style={{ fontSize: '1.1rem', margin: '16px 0 8px', color: 'var(--accent)' }}>{title}</h2>
      {open && children}
    </section>
  );
}

const btn: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '0.8125rem',
  cursor: 'pointer',
  minHeight: 40,
  touchAction: 'manipulation',
};
