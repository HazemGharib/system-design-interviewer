import { useMemo, useState, type CSSProperties } from 'react';
import type { Lang } from '../types';
import { GLOSSARY, getGlossaryByCategory, getGlossaryTerm } from '../content/loadContent';
import { localizedText } from '../i18n';

interface Props {
  lang: Lang;
  termId?: string | null;
  onBack: () => void;
  onToggleLang: () => void;
  onOpenTerm: (termId: string) => void;
  onOpenCheatsheet: () => void;
}

const UI = {
  title: { ar: 'قاموس المصطلحات', en: 'Glossary' },
  subtitle: {
    ar: 'تعريفات لأنماط ومفاهيم System Design اللي بتظهر في الشيت والسيناريوهات.',
    en: 'Definitions for system design patterns and concepts used in the cheat sheet and scenarios.',
  },
  search: { ar: 'ابحث عن مصطلح…', en: 'Search terms…' },
  back: { ar: 'رجوع', en: 'Back' },
  all: { ar: 'الكل', en: 'All' },
  when: { ar: 'امتى تستخدمه', en: 'When to use' },
  pros: { ar: 'المميزات', en: 'Pros' },
  cons: { ar: 'العيوب', en: 'Cons' },
  example: { ar: 'مثال', en: 'Example' },
  related: { ar: 'مصطلحات مرتبطة', en: 'Related terms' },
  az: { ar: 'أ–ي / A–Z', en: 'A–Z' },
  categories: { ar: 'حسب التصنيف', en: 'By category' },
  results: { ar: 'نتيجة', en: 'results' },
  cheatsheet: { ar: 'الشيت', en: 'Cheat sheet' },
  notFound: { ar: 'المصطلح مش موجود.', en: 'Term not found.' },
} as const;

export function Glossary({ lang, termId, onBack, onToggleLang, onOpenTerm, onOpenCheatsheet }: Props) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'az' | 'category'>('category');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.terms.filter(t => {
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      if (!q) return true;
      const hay = [t.name.ar, t.name.en, t.definition.ar, t.definition.en, t.id].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, catFilter]);

  const azGroups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const letter = (lang === 'ar' ? t.name.ar : t.name.en).trim().charAt(0).toUpperCase() || '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], lang === 'ar' ? 'ar' : 'en'));
  }, [filtered, lang]);

  const byCat = useMemo(() => getGlossaryByCategory().map(c => ({
    ...c,
    terms: c.terms.filter(t => filtered.some(f => f.id === t.id)),
  })).filter(c => c.terms.length), [filtered]);

  if (termId) {
    const term = getGlossaryTerm(termId);
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 80px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button type="button" onClick={onBack} style={btn}>{localizedText(UI.back, lang)}</button>
          <button type="button" onClick={() => { location.hash = '#/glossary'; }} style={btn}>{localizedText(UI.title, lang)}</button>
          <button type="button" onClick={onToggleLang} style={btn}>{lang === 'ar' ? 'English' : 'عربي'}</button>
          <button type="button" onClick={onOpenCheatsheet} style={btn}>{localizedText(UI.cheatsheet, lang)}</button>
        </div>
        {!term ? (
          <p>{localizedText(UI.notFound, lang)}</p>
        ) : (
          <article id={`glossary-${term.id}`}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {localizedText(GLOSSARY.categories.find(c => c.id === term.category)?.title || { ar: term.category, en: term.category }, lang)}
            </p>
            <h1 style={{ margin: '8px 0 12px', fontSize: 'clamp(1.4rem, 5vw, 1.85rem)' }}>{localizedText(term.name, lang)}</h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, margin: '0 0 16px' }}>{localizedText(term.definition, lang)}</p>
            <Section title={localizedText(UI.when, lang)} body={localizedText(term.when, lang)} />
            <Section title={localizedText(UI.pros, lang)} body={localizedText(term.pros, lang)} tone="success" />
            <Section title={localizedText(UI.cons, lang)} body={localizedText(term.cons, lang)} tone="warning" />
            <Section title={localizedText(UI.example, lang)} body={localizedText(term.example, lang)} />
            {term.related.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 8px' }}>{localizedText(UI.related, lang)}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {term.related.map(id => {
                    const rel = getGlossaryTerm(id);
                    if (!rel) return null;
                    return (
                      <a
                        key={id}
                        href={`#/glossary/${id}`}
                        onClick={(e) => { e.preventDefault(); onOpenTerm(id); }}
                        style={{ ...btn, background: 'var(--accent-soft)', border: 'none', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                      >
                        {localizedText(rel.name, lang)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        )}
      </div>
    );
  }

  return (
    <div className="glossary-page" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 80px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={onBack} style={btn}>{localizedText(UI.back, lang)}</button>
        <button type="button" onClick={onToggleLang} style={btn}>{lang === 'ar' ? 'English' : 'عربي'}</button>
        <button type="button" onClick={onOpenCheatsheet} style={btn}>{localizedText(UI.cheatsheet, lang)}</button>
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.4rem, 5vw, 1.85rem)' }}>{localizedText(UI.title, lang)}</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{localizedText(UI.subtitle, lang)}</p>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={localizedText(UI.search, lang)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={() => setMode('category')} style={{ ...btn, background: mode === 'category' ? 'var(--accent)' : undefined, color: mode === 'category' ? '#fff' : undefined, border: mode === 'category' ? 'none' : undefined }}>
          {localizedText(UI.categories, lang)}
        </button>
        <button type="button" onClick={() => setMode('az')} style={{ ...btn, background: mode === 'az' ? 'var(--accent)' : undefined, color: mode === 'az' ? '#fff' : undefined, border: mode === 'az' ? 'none' : undefined }}>
          {localizedText(UI.az, lang)}
        </button>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}>
          <option value="all">{localizedText(UI.all, lang)}</option>
          {GLOSSARY.categories.map(c => (
            <option key={c.id} value={c.id}>{localizedText(c.title, lang)}</option>
          ))}
        </select>
        <span style={{ alignSelf: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {filtered.length} {localizedText(UI.results, lang)}
        </span>
      </div>

      {mode === 'category' ? byCat.map(cat => (
        <section key={cat.id} style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.05rem', margin: '0 0 8px', color: 'var(--accent)' }}>{localizedText(cat.title, lang)}</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {cat.terms.map(t => (
              <button key={t.id} type="button" onClick={() => onOpenTerm(t.id)} style={termCard}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{localizedText(t.name, lang)}</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{localizedText(t.short, lang)}</span>
              </button>
            ))}
          </div>
        </section>
      )) : azGroups.map(([letter, terms]) => (
        <section key={letter} style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.05rem', margin: '0 0 8px', color: 'var(--accent)' }}>{letter}</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {terms.map(t => (
              <button key={t.id} type="button" onClick={() => onOpenTerm(t.id)} style={termCard}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{localizedText(t.name, lang)}</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{localizedText(t.short, lang)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Section({ title, body, tone }: { title: string; body: string; tone?: 'success' | 'warning' }) {
  return (
    <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: tone === 'success' ? 'var(--success-bg)' : tone === 'warning' ? 'var(--warning-bg)' : 'var(--bg-subtle)' }}>
      <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.875rem' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>{body}</p>
    </div>
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
};

const termCard: CSSProperties = {
  textAlign: 'inherit',
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};
