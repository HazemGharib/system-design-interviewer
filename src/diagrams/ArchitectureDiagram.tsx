import type { Lang } from '../types';
import { localizedText } from '../i18n';

interface DiagramProps {
  scenarioId: string;
  lang: Lang;
}

const labels = {
  imageUpload: {
    user: { ar: 'المستخدم', en: 'User' },
    lb: { ar: 'Load Balancer', en: 'Load Balancer' },
    api: { ar: 'API Server', en: 'API Server' },
    s3orig: { ar: 'S3 الأصليات', en: 'S3 Originals' },
    queue: { ar: 'Queue', en: 'Queue' },
    workers: { ar: 'Resize Workers', en: 'Resize Workers' },
    s3thumb: { ar: 'S3 Thumbnails', en: 'S3 Thumbnails' },
    db: { ar: 'Database', en: 'Database' },
    cache: { ar: 'Redis Cache', en: 'Redis Cache' },
    cdn: { ar: 'CDN', en: 'CDN' },
    viewers: { ar: 'المشاهدين', en: 'Viewers' },
    presigned: { ar: 'Presigned URL', en: 'Presigned URL' },
    directUpload: { ar: 'رفع مباشر', en: 'Direct Upload' },
    event: { ar: 'S3 Event', en: 'S3 Event' },
    metadata: { ar: 'Metadata', en: 'Metadata' },
  },
  urlShortener: {
    user: { ar: 'المستخدم', en: 'User' },
    lb: { ar: 'Load Balancer', en: 'Load Balancer' },
    api: { ar: 'API Server', en: 'API Server' },
    keygen: { ar: 'Key Generator', en: 'Key Generator' },
    cache: { ar: 'Redis Cache', en: 'Redis Cache' },
    db: { ar: 'Database', en: 'Database' },
    kafka: { ar: 'Kafka', en: 'Kafka' },
    analytics: { ar: 'Analytics DB', en: 'Analytics DB' },
    create: { ar: 'إنشاء', en: 'Create' },
    redirect: { ar: '301 Redirect', en: '301 Redirect' },
    lookup: { ar: 'Lookup', en: 'Lookup' },
  },
  chatMessaging: {
    sender: { ar: 'المرسل', en: 'Sender' },
    recipient: { ar: 'المستلم', en: 'Recipient' },
    connServer: { ar: 'Connection Server', en: 'Connection Server' },
    router: { ar: 'Message Router', en: 'Message Router' },
    presence: { ar: 'Presence Service', en: 'Presence Service' },
    queue: { ar: 'Message Queue', en: 'Message Queue' },
    db: { ar: 'Message Store', en: 'Message Store' },
    push: { ar: 'Push Service', en: 'Push Service' },
    websocket: { ar: 'WebSocket', en: 'WebSocket' },
  },
};

function ImageUploadDiagram({ lang }: { lang: Lang }) {
  const l = labels.imageUpload;
  return (
    <svg viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', maxHeight: 400 }}>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="var(--accent)" />
        </marker>
      </defs>
      
      {/* Background regions */}
      <rect x="10" y="10" width="180" height="380" rx="8" fill="var(--accent-soft)" opacity="0.3" />
      <text x="100" y="35" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">Upload Path</text>
      
      <rect x="200" y="10" width="200" height="180" rx="8" fill="var(--success-bg)" opacity="0.3" />
      <text x="300" y="35" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">Processing</text>
      
      <rect x="410" y="10" width="380" height="380" rx="8" fill="var(--warning-bg)" opacity="0.3" />
      <text x="600" y="35" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">Read Path</text>
      
      {/* User */}
      <rect x="30" y="60" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="70" y="85" textAnchor="middle" fontSize="12" fill="var(--text-primary)">{localizedText(l.user, lang)}</text>
      
      {/* API + LB */}
      <rect x="30" y="140" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="70" y="165" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.lb, lang)}</text>
      
      <rect x="30" y="200" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="70" y="225" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.api, lang)}</text>
      
      {/* S3 Originals */}
      <rect x="30" y="280" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="70" y="305" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.s3orig, lang)}</text>
      
      {/* Queue */}
      <rect x="220" y="60" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="260" y="85" textAnchor="middle" fontSize="12" fill="var(--text-primary)">{localizedText(l.queue, lang)}</text>
      
      {/* Workers */}
      <rect x="220" y="130" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="260" y="155" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.workers, lang)}</text>
      
      {/* DB */}
      <rect x="320" y="60" width="70" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="355" y="85" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.db, lang)}</text>
      
      {/* S3 Thumbnails */}
      <rect x="430" y="130" width="90" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="475" y="155" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.s3thumb, lang)}</text>
      
      {/* Cache */}
      <rect x="550" y="130" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="590" y="155" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.cache, lang)}</text>
      
      {/* CDN */}
      <rect x="660" y="130" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="700" y="155" textAnchor="middle" fontSize="12" fill="var(--text-primary)">{localizedText(l.cdn, lang)}</text>
      
      {/* Viewers */}
      <rect x="660" y="60" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="700" y="85" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.viewers, lang)}</text>
      
      {/* Arrows - Upload path */}
      <line x1="70" y1="100" x2="70" y2="135" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="70" y1="180" x2="70" y2="195" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="90" y="195" fontSize="8" fill="var(--text-secondary)">{localizedText(l.presigned, lang)}</text>
      
      <line x1="70" y1="240" x2="70" y2="275" stroke="var(--success)" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="90" y="265" fontSize="8" fill="var(--text-secondary)">{localizedText(l.directUpload, lang)}</text>
      
      {/* S3 to Queue */}
      <line x1="110" y1="300" x2="145" y2="300" stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="4" />
      <line x1="145" y1="300" x2="145" y2="80" stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="4" />
      <line x1="145" y1="80" x2="215" y2="80" stroke="var(--warning)" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="160" y="70" fontSize="8" fill="var(--text-secondary)">{localizedText(l.event, lang)}</text>
      
      {/* Queue to Workers */}
      <line x1="260" y1="100" x2="260" y2="125" stroke="var(--warning)" strokeWidth="2" markerEnd="url(#arrow)" />
      
      {/* Workers to Thumbnails */}
      <line x1="300" y1="150" x2="425" y2="150" stroke="var(--success)" strokeWidth="2" markerEnd="url(#arrow)" />
      
      {/* Workers to DB */}
      <line x1="280" y1="130" x2="315" y2="95" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="285" y="105" fontSize="8" fill="var(--text-secondary)">{localizedText(l.metadata, lang)}</text>
      
      {/* API to DB */}
      <line x1="110" y1="210" x2="320" y2="85" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arrow)" />
      
      {/* Read path */}
      <line x1="700" y1="100" x2="700" y2="125" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="660" y1="150" x2="635" y2="150" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <line x1="550" y1="150" x2="525" y2="150" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#arrow)" />
      
      {/* Cache to DB */}
      <line x1="590" y1="130" x2="390" y2="85" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4" />
    </svg>
  );
}

function UrlShortenerDiagram({ lang }: { lang: Lang }) {
  const l = labels.urlShortener;
  return (
    <svg viewBox="0 0 700 300" style={{ width: '100%', height: 'auto', maxHeight: 300 }}>
      <defs>
        <marker id="arrow2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="var(--accent)" />
        </marker>
      </defs>
      
      {/* User */}
      <rect x="30" y="120" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="70" y="145" textAnchor="middle" fontSize="12" fill="var(--text-primary)">{localizedText(l.user, lang)}</text>
      
      {/* LB */}
      <rect x="150" y="120" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="190" y="145" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.lb, lang)}</text>
      
      {/* API */}
      <rect x="270" y="120" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="310" y="145" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.api, lang)}</text>
      
      {/* Key Generator */}
      <rect x="270" y="40" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="310" y="65" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.keygen, lang)}</text>
      
      {/* Cache */}
      <rect x="390" y="120" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="430" y="145" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.cache, lang)}</text>
      
      {/* DB */}
      <rect x="510" y="120" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="550" y="145" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.db, lang)}</text>
      
      {/* Kafka */}
      <rect x="390" y="210" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="430" y="235" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.kafka, lang)}</text>
      
      {/* Analytics */}
      <rect x="510" y="210" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="550" y="235" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.analytics, lang)}</text>
      
      {/* Arrows */}
      <line x1="110" y1="140" x2="145" y2="140" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow2)" />
      <line x1="230" y1="140" x2="265" y2="140" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow2)" />
      <line x1="310" y1="120" x2="310" y2="85" stroke="var(--warning)" strokeWidth="1.5" markerEnd="url(#arrow2)" />
      <text x="320" y="105" fontSize="8" fill="var(--text-secondary)">{localizedText(l.create, lang)}</text>
      
      <line x1="350" y1="140" x2="385" y2="140" stroke="var(--success)" strokeWidth="2" markerEnd="url(#arrow2)" />
      <text x="365" y="130" fontSize="8" fill="var(--text-secondary)">{localizedText(l.lookup, lang)}</text>
      
      <line x1="470" y1="140" x2="505" y2="140" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arrow2)" />
      
      {/* Analytics flow */}
      <line x1="310" y1="160" x2="310" y2="230" stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="4" />
      <line x1="310" y1="230" x2="385" y2="230" stroke="var(--warning)" strokeWidth="2" markerEnd="url(#arrow2)" />
      <line x1="470" y1="230" x2="505" y2="230" stroke="var(--warning)" strokeWidth="2" markerEnd="url(#arrow2)" />
      
      {/* Return arrow */}
      <path d="M 230 155 Q 180 180 130 155" fill="none" stroke="var(--success)" strokeWidth="2" markerEnd="url(#arrow2)" />
      <text x="175" y="185" fontSize="8" fill="var(--text-secondary)">{localizedText(l.redirect, lang)}</text>
    </svg>
  );
}

function ChatMessagingDiagram({ lang }: { lang: Lang }) {
  const l = labels.chatMessaging;
  return (
    <svg viewBox="0 0 750 320" style={{ width: '100%', height: 'auto', maxHeight: 320 }}>
      <defs>
        <marker id="arrow3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="var(--accent)" />
        </marker>
      </defs>
      
      {/* Sender side */}
      <rect x="20" y="130" width="70" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="55" y="155" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.sender, lang)}</text>
      
      <rect x="120" y="130" width="90" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="165" y="150" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.connServer, lang)}</text>
      <text x="165" y="162" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">#1</text>
      
      {/* Central services */}
      <rect x="260" y="50" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="300" y="75" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.presence, lang)}</text>
      
      <rect x="260" y="130" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="300" y="155" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.router, lang)}</text>
      
      <rect x="260" y="210" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth="2" />
      <text x="300" y="235" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.queue, lang)}</text>
      
      <rect x="390" y="210" width="80" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="430" y="235" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.db, lang)}</text>
      
      <rect x="390" y="280" width="80" height="30" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="430" y="300" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.push, lang)}</text>
      
      {/* Recipient side */}
      <rect x="520" y="130" width="90" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--success)" strokeWidth="2" />
      <text x="565" y="150" textAnchor="middle" fontSize="9" fill="var(--text-primary)">{localizedText(l.connServer, lang)}</text>
      <text x="565" y="162" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">#2</text>
      
      <rect x="650" y="130" width="70" height="40" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="2" />
      <text x="685" y="155" textAnchor="middle" fontSize="10" fill="var(--text-primary)">{localizedText(l.recipient, lang)}</text>
      
      {/* Arrows */}
      <line x1="90" y1="150" x2="115" y2="150" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow3)" />
      <text x="97" y="140" fontSize="7" fill="var(--text-secondary)">{localizedText(l.websocket, lang)}</text>
      
      <line x1="210" y1="150" x2="255" y2="150" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow3)" />
      
      {/* Router to presence */}
      <line x1="300" y1="130" x2="300" y2="95" stroke="var(--warning)" strokeWidth="1.5" markerEnd="url(#arrow3)" />
      
      {/* Router to queue */}
      <line x1="300" y1="170" x2="300" y2="205" stroke="var(--warning)" strokeWidth="2" markerEnd="url(#arrow3)" />
      
      {/* Queue to DB */}
      <line x1="340" y1="230" x2="385" y2="230" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#arrow3)" />
      
      {/* Queue to push */}
      <line x1="340" y1="245" x2="360" y2="295" stroke="var(--success)" strokeWidth="1.5" strokeDasharray="4" />
      <line x1="360" y1="295" x2="385" y2="295" stroke="var(--success)" strokeWidth="1.5" markerEnd="url(#arrow3)" />
      
      {/* Router to recipient conn server */}
      <line x1="340" y1="150" x2="515" y2="150" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow3)" />
      
      {/* Recipient conn server to recipient */}
      <line x1="610" y1="150" x2="645" y2="150" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow3)" />
      <text x="623" y="140" fontSize="7" fill="var(--text-secondary)">{localizedText(l.websocket, lang)}</text>
    </svg>
  );
}

export function ArchitectureDiagram({ scenarioId, lang }: DiagramProps) {
  switch (scenarioId) {
    case 'image-upload':
      return <ImageUploadDiagram lang={lang} />;
    case 'url-shortener':
      return <UrlShortenerDiagram lang={lang} />;
    case 'chat-messaging':
      return <ChatMessagingDiagram lang={lang} />;
    default:
      return null;
  }
}
