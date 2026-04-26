import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

interface BadgeEntry {
  id: string;
  earnedAt: string;
  missionLabel: string;
  badgeName: string;
}

interface JournalEntry {
  id: string;
  createdAt: string;
  missionLabel: string;
  prompt: string;
  response: string;
}

interface StarEventEntry {
  id: string;
  earnedAt: string;
  missionLabel: string;
  activityLabel: string;
  stars: number;
}

type HomeView = 'home' | 'badges' | 'journal';

const BADGE_STORAGE_KEY = 'imposter-rescue-badges';
const JOURNAL_STORAGE_KEY = 'imposter-rescue-journal';
const STAR_EVENTS_STORAGE_KEY = 'imposter-rescue-star-events';

const ALL_BADGES: Array<{ id: string; name: string }> = [
  { id: 'mission-1-stage-confidence', name: 'Stage Confidence' },
  { id: 'mission-2-physics-champion', name: 'Physics Champion' },
  { id: 'mission-3-resilience-builder', name: 'Resilience Builder' },
  { id: 'mission-4-dance-achiever', name: 'Dance Achiever' },
];

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#fef9ed',
  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  color: '#1a1a2e',
};

const topBarStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1.5rem',
  background: '#ffffff',
  borderBottom: '1px solid rgba(0,0,0,0.07)',
  boxSizing: 'border-box',
};

const mapButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '0.5rem 1rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  textDecoration: 'none',
};

const starBadgeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  background: '#ffffff',
  border: '2px solid #f59e0b',
  borderRadius: '10px',
  padding: '0.4rem 0.8rem',
  fontWeight: 700,
  fontSize: '1rem',
  color: '#92400e',
};

const contentWrapStyle: CSSProperties = {
  maxWidth: '860px',
  margin: '2.5rem auto',
  padding: '0 1.5rem',
};

const backButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  background: 'linear-gradient(135deg, #f97316, #fb923c)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '0.5rem 1rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  textDecoration: 'none',
};

function readStoredList<T>(storageKey: string): T[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function HomeDashboard({
  onBadgesClick,
  onJournalClick,
  earnedCount,
  journalCount,
}: {
  onBadgesClick: () => void;
  onJournalClick: () => void;
  earnedCount: number;
  journalCount: number;
}) {
  return (
    <div style={contentWrapStyle}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.08)',
          padding: '1.75rem',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            margin: '0 0 1.5rem',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#7c2d12',
          }}
        >
          Your Safe Space
        </h1>

        <div
          style={{
            background: 'linear-gradient(145deg, #c7dff7 0%, #d4edd8 50%, #e8f0d8 100%)',
            borderRadius: '18px',
            border: '2.5px solid #f59e0b',
            padding: '2rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            position: 'relative',
          }}
        >
          <FeatureTile
            label="Vision Board"
            borderColor="#a855f7"
            icon={
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            }
            onClick={() => {}}
          />

          <FeatureTile
            label="Mirror"
            borderColor="#ec4899"
            icon={
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                <circle cx="18" cy="5" r="1.5" fill="#ec4899" stroke="none" />
                <circle cx="20" cy="9" r="1" fill="#ec4899" stroke="none" />
              </svg>
            }
            onClick={() => {}}
          />

          <BottomTile
            onClick={onBadgesClick}
            borderColor="#f59e0b"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
              </svg>
            }
            label="Badge Collection"
            sublabel={`${earnedCount} / ${ALL_BADGES.length} earned`}
            labelColor="#92400e"
            sublabelColor="#b45309"
          />

          <BottomTile
            onClick={onJournalClick}
            borderColor="#6366f1"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="9" y1="7" x2="15" y2="7" />
                <line x1="9" y1="11" x2="15" y2="11" />
                <line x1="9" y1="15" x2="12" y2="15" />
              </svg>
            }
            label="My Journal"
            sublabel={journalCount === 0 ? 'No entries yet' : `${journalCount} entr${journalCount === 1 ? 'y' : 'ies'}`}
            labelColor="#312e81"
            sublabelColor="#4338ca"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureTile({
  label,
  borderColor,
  icon,
  onClick,
}: {
  label: string;
  borderColor: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: `2.5px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '1.5rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.6rem',
        maxWidth: '200px',
        justifySelf: label === 'Vision Board' ? 'start' : 'end',
        width: '100%',
      }}
    >
      {icon}
      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{label}</span>
    </button>
  );
}

function BottomTile({
  onClick,
  borderColor,
  icon,
  label,
  sublabel,
  labelColor,
  sublabelColor,
}: {
  onClick: () => void;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  labelColor: string;
  sublabelColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: `2.5px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '0.9rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        width: '100%',
      }}
    >
      {icon}
      <div style={{ textAlign: 'left' }}>
        <p style={{ margin: 0, fontWeight: 800, color: labelColor }}>{label}</p>
        <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: sublabelColor }}>{sublabel}</p>
      </div>
    </button>
  );
}

function BadgesView({
  onBack,
  earnedIds,
}: {
  onBack: () => void;
  earnedIds: Set<string>;
}) {
  return (
    <div style={contentWrapStyle}>
      <button type="button" onClick={onBack} style={backButtonStyle}>
        ← Back to Home
      </button>

      <div
        style={{
          maxWidth: '860px',
          margin: '1.25rem auto 0',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.08)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
          </svg>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>Your Badges</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
          }}
        >
          {ALL_BADGES.map((badge) => (
            <BadgeTile key={badge.id} name={badge.name} earned={earnedIds.has(badge.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JournalView({
  onBack,
  journalEntries,
}: {
  onBack: () => void;
  journalEntries: JournalEntry[];
}) {
  return (
    <div style={contentWrapStyle}>
      <button type="button" onClick={onBack} style={backButtonStyle}>
        ← Back to Home
      </button>

      <div
        style={{
          maxWidth: '860px',
          margin: '1.25rem auto 0',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.08)',
          padding: '1.75rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>My Journal</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
          Reflections saved after missions appear here.
        </p>

        {journalEntries.length === 0 ? (
          <p style={{ opacity: 0.8, marginBottom: 0 }}>No entries yet. Complete a mission and save your reflection.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            {[...journalEntries].reverse().map((entry) => (
              <article
                key={entry.id}
                style={{
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.015)',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.75 }}>
                  {entry.missionLabel} • {new Date(entry.createdAt).toLocaleString()}
                </p>
                <p style={{ margin: '0.45rem 0 0.35rem', fontWeight: 700 }}>{entry.prompt}</p>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{entry.response}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeTile({ name, earned }: { name: string; earned: boolean }) {
  return (
    <div
      style={{
        borderRadius: '18px',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.6rem',
        background: earned ? 'linear-gradient(145deg, #f97316, #fbbf24)' : '#f0f0f0',
        boxShadow: earned ? '0 6px 20px rgba(251, 146, 60, 0.35)' : 'none',
      }}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={earned ? '#ffffff' : '#c0c0c0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>
      <span
        style={{
          fontWeight: 800,
          fontSize: '0.9rem',
          textAlign: 'center',
          color: earned ? '#ffffff' : '#9ca3af',
          lineHeight: 1.3,
        }}
      >
        {name}
      </span>
      {!earned && <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>Not earned yet</span>}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<HomeView>('home');

  const badgeEntries = readStoredList<BadgeEntry>(BADGE_STORAGE_KEY);
  const journalEntries = readStoredList<JournalEntry>(JOURNAL_STORAGE_KEY);
  const starEvents = readStoredList<StarEventEntry>(STAR_EVENTS_STORAGE_KEY);

  const earnedIds = useMemo(() => new Set(badgeEntries.map((entry) => entry.id)), [badgeEntries]);
  const earnedCount = earnedIds.size;
  const totalStars = useMemo(
    () => starEvents.reduce((sum, event) => sum + event.stars, 0),
    [starEvents]
  );
  const journalCount = journalEntries.length;

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Link to="/" style={mapButtonStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          Map
        </Link>
        <div style={starBadgeStyle}>
          <span style={{ fontSize: '1.1rem' }}>⭐</span>
          <span>{totalStars}</span>
        </div>
      </div>

      {view === 'home' && (
        <HomeDashboard
          onBadgesClick={() => setView('badges')}
          onJournalClick={() => setView('journal')}
          earnedCount={earnedCount}
          journalCount={journalCount}
        />
      )}

      {view === 'badges' && <BadgesView onBack={() => setView('home')} earnedIds={earnedIds} />}

      {view === 'journal' && <JournalView onBack={() => setView('home')} journalEntries={journalEntries} />}
    </div>
  );
}
