import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Lang } from '../types';
import { getGlossaryTerm } from '../content/loadContent';
import { localizedText } from '../i18n';

interface Props {
  termId: string;
  lang: Lang;
  children?: ReactNode;
  onOpenTerm: (termId: string) => void;
}

export function TermLink({ termId, lang, children, onOpenTerm }: Props) {
  const term = getGlossaryTerm(termId);
  const [open, setOpen] = useState(false);
  if (!term) return <>{children || termId}</>;

  return (
    <span
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={`#glossary-${termId}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenTerm(termId); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={linkStyle}
        aria-label={localizedText(term.name, lang)}
      >
        {children || localizedText(term.name, lang)}
      </a>
      {open && (
        <span role="tooltip" className="no-print" style={tooltipStyle}>
          <strong style={{ display: 'block', marginBottom: 4 }}>{localizedText(term.name, lang)}</strong>
          {localizedText(term.short, lang)}
        </span>
      )}
    </span>
  );
}

/** Replace known term names inside a string with TermLink buttons (longest match first). */
export function LinkedText({
  text,
  lang,
  termIds,
  onOpenTerm,
}: {
  text: string;
  lang: Lang;
  termIds: string[];
  onOpenTerm: (id: string) => void;
}) {
  const terms = termIds
    .map(id => getGlossaryTerm(id))
    .filter(Boolean)
    .sort((a, b) => localizedText(b!.name, lang).length - localizedText(a!.name, lang).length) as NonNullable<ReturnType<typeof getGlossaryTerm>>[];

  if (!terms.length) return <>{text}</>;

  const patterns = terms.map(t => ({
    id: t.id,
    name: localizedText(t.name, lang),
  }));

  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length) {
    let earliest = -1;
    let match: { id: string; name: string; index: number } | null = null;
    for (const p of patterns) {
      const idx = remaining.toLowerCase().indexOf(p.name.toLowerCase());
      if (idx >= 0 && (earliest < 0 || idx < earliest)) {
        earliest = idx;
        match = { ...p, index: idx };
      }
    }
    if (!match) {
      parts.push(remaining);
      break;
    }
    if (match.index > 0) parts.push(remaining.slice(0, match.index));
    const raw = remaining.slice(match.index, match.index + match.name.length);
    parts.push(
      <TermLink key={key++} termId={match.id} lang={lang} onOpenTerm={onOpenTerm}>
        {raw}
      </TermLink>
    );
    remaining = remaining.slice(match.index + match.name.length);
  }
  return <>{parts}</>;
}

const linkStyle: CSSProperties = {
  display: 'inline',
  padding: 0,
  margin: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--accent)',
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  cursor: 'pointer',
  font: 'inherit',
  textUnderlineOffset: 2,
};

const tooltipStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 50,
  bottom: '125%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 240,
  maxWidth: '70vw',
  padding: '10px 12px',
  borderRadius: 10,
  background: 'var(--color-teal-dark, #0C2E36)',
  color: '#F6F1E8',
  fontSize: '0.75rem',
  lineHeight: 1.45,
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  pointerEvents: 'none',
};
