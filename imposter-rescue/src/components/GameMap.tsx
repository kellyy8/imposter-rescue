import { useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, FlaskConical, Briefcase, Music, PersonStanding } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JournalEntry {
  id: string;
  createdAt: string;
  missionLabel: string;
  prompt: string;
  response: string;
}

interface BadgeEntry {
  id: string;
  earnedAt: string;
  missionLabel: string;
  badgeName: string;
}

const JOURNAL_STORAGE_KEY = 'imposter-rescue-journal';
const BADGE_STORAGE_KEY = 'imposter-rescue-badges';

const screenStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'linear-gradient(145deg, #e8eaf6 0%, #f3e5f5 40%, #fce4ec 100%)',
  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
};

const topBarStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
  background: '#ffffff',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
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

const pinStyle: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.55rem',
};

const pinButtonStyle: CSSProperties = {
  width: '5rem',
  height: '5rem',
  borderRadius: '9999px',
  border: '4px solid rgba(255, 255, 255, 0.85)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const labelStyle: CSSProperties = {
  background: '#ffffff',
  color: '#1a1a2e',
  fontWeight: 700,
  fontSize: '0.85rem',
  padding: '0.3rem 0.75rem',
  borderRadius: '999px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  whiteSpace: 'nowrap',
};

const headingAreaStyle: CSSProperties = {
  textAlign: 'center',
  paddingTop: '2rem',
  paddingBottom: '0.5rem',
};

const GameMap = () => {
  const navigate = useNavigate();
  const [showJournal, setShowJournal] = useState(false);

  const journalEntries = useMemo<JournalEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as JournalEntry[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }, [showJournal]);

  const badgeEntries = useMemo<BadgeEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(BADGE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as BadgeEntry[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }, [showJournal]);

  const totalBadges = badgeEntries.length;

  const nodes = [
    {
      id: 1,
      label: 'Home',
      icon: <Home size={28} />,
      color: '#3b82f6',
      x: 46,
      y: 10,
    },
    {
      id: 2,
      label: 'Mission #1',
      icon: <Music size={28} />,
      color: '#a855f7',
      x: 72,
      y: 26,
    },
    {
      id: 3,
      label: 'Mission #2',
      icon: <FlaskConical size={28} />,
      color: '#ec4899',
      x: 72,
      y: 56,
    },
    {
      id: 4,
      label: 'Mission #3',
      icon: <Briefcase size={28} />,
      color: '#f97316',
      x: 46,
      y: 74,
    },
    {
      id: 5,
      label: 'Mission #4',
      icon: <PersonStanding size={28} />,
      color: '#ef4444',
      x: 20,
      y: 56,
    },
    {
      id: 6,
      label: 'Store',
      icon: <ShoppingBag size={28} />,
      color: '#10b981',
      x: 20,
      y: 26,
    },
  ];

  return (
    <div style={screenStyle}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <button style={mapButtonStyle} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          Map
        </button>
        <div style={starBadgeStyle}>
          <span style={{ fontSize: '1.1rem' }}>⭐</span>
          <span>{totalBadges}</span>
        </div>
      </div>

      {/* Title */}
      <div style={headingAreaStyle}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#4c1d95' }}>Your Journey Map</h1>
        <p style={{ margin: '0.4rem 0 0', color: '#7c3aed', fontWeight: 600, fontSize: '1rem' }}>Select a location to explore</p>
      </div>

      {/* Map nodes */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '900px', flex: 1, minHeight: '420px', paddingBottom: '2rem' }}>
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ ...pinStyle, left: `${node.x}%`, top: `${node.y}%` }}
          >
            <motion.button
              whileHover={{ scale: 1.12, y: -4 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => {
                if (node.id === 1) {
                  navigate('/home');
                }
                if (node.id === 2) {
                  navigate('/mission1');
                }
                if (node.id === 3) {
                  navigate('/mission2');
                }
                if (node.id === 4) {
                  navigate('/mission3');
                }
                if (node.id === 5) {
                  navigate('/mission4');
                }
                if (node.id === 6) {
                  navigate('/store');
                }
              }}
              style={{ ...pinButtonStyle, backgroundColor: node.color }}
            >
              {node.icon}
            </motion.button>
            <span style={labelStyle}>{node.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Journal modal */}
      {showJournal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 10, 60, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 20,
            padding: '1rem',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowJournal(false)}
        >
          <div
            style={{
              width: 'min(760px, 96vw)',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.6)',
              background: '#ffffff',
              padding: '1.5rem',
              color: '#1a1a2e',
              boxShadow: '0 20px 60px rgba(124, 58, 237, 0.18)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem' }}>
              <h2 style={{ margin: 0, color: '#4c1d95', fontWeight: 800 }}>Your Journal</h2>
              <button
                type="button"
                onClick={() => setShowJournal(false)}
                style={{
                  border: '1.5px solid #e5e7eb',
                  background: 'transparent',
                  color: '#374151',
                  borderRadius: '999px',
                  padding: '0.4rem 0.9rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>

            <p style={{ opacity: 0.7, marginTop: '0.6rem', color: '#374151' }}>
              Reflections and earned badges you saved after missions appear here.
            </p>

            <section style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 0.55rem', color: '#6d28d9' }}>Badges</h3>
              {badgeEntries.length === 0 ? (
                <p style={{ opacity: 0.7, marginBottom: 0, color: '#374151' }}>No badges yet. Finish a mission to earn one.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  {[...badgeEntries].reverse().map((badge) => (
                    <article
                      key={badge.id}
                      style={{
                        border: '1.5px solid #ede9fe',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        background: '#f5f3ff',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.65, color: '#374151' }}>
                        {badge.missionLabel} • {new Date(badge.earnedAt).toLocaleString()}
                      </p>
                      <p style={{ margin: '0.45rem 0 0', fontWeight: 800, color: '#4c1d95' }}>{badge.badgeName}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section style={{ marginTop: '1.2rem' }}>
              <h3 style={{ margin: '0 0 0.55rem', color: '#6d28d9' }}>Journal</h3>
              {journalEntries.length === 0 ? (
                <p style={{ opacity: 0.7, marginBottom: 0, color: '#374151' }}>
                  No journal entries yet. Complete a mission and save your response to see it here.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  {[...journalEntries].reverse().map((entry) => (
                    <article
                      key={entry.id}
                      style={{
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        background: '#f9fafb',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.65, color: '#374151' }}>
                        {entry.missionLabel} • {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      <p style={{ margin: '0.45rem 0 0.35rem', fontWeight: 700, color: '#1a1a2e' }}>{entry.prompt}</p>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#374151' }}>{entry.response}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameMap;