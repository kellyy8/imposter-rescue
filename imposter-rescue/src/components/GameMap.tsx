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

const JOURNAL_STORAGE_KEY = 'imposter-rescue-journal';

const screenStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'linear-gradient(135deg, #a7c3dc 0%, #96c2a6 50%, #dab9d5 100%)',
};

const mapAreaStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '70rem',
  height: '76vh',
  minHeight: '540px',
};

const pinStyle: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
};

const pinButtonStyle: CSSProperties = {
  width: '5rem',
  height: '5rem',
  borderRadius: '9999px',
  border: '4px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle: CSSProperties = {
  color: '#e2e8f0',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
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

  const nodes = [
    {
      id: 1,
      label: 'Home',
      icon: <Home size={28} />,
      color: '#3b82f6',
      x: 50,
      y: 16,
    },
    {
      id: 2,
      label: 'Mission 1',
      icon: <Music size={28} />,
      color: '#10b981',
      x: 76,
      y: 30,
    },
    {
      id: 3,
      label: 'Mission 2',
      icon: <FlaskConical size={28} />,
      color: '#f59e0b',
      x: 76,
      y: 70,
    },
    {
      id: 4,
      label: 'Mission 3',
      icon: <Briefcase size={28} />,
      color: '#a855f7',
      x: 50,
      y: 84,
    },
    {
      id: 5,
      label: 'Mission 4',
      icon: <PersonStanding size={28} />,
      color: '#f43f5e',
      x: 24,
      y: 70,
    },
    {
      id: 6,
      label: 'Store',
      icon: <ShoppingBag size={28} />,
      color: '#f97316',
      x: 24,
      y: 30,
    },
  ];

  return (
    <div style={screenStyle}>
      <div style={mapAreaStyle}>
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ ...pinStyle, left: `${node.x}%`, top: `${node.y}%` }}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (node.id === 1) {
                  setShowJournal(true);
                  return;
                }

                if (node.id === 2) {
                  navigate('/mission1');
                }
              }}
              style={{ ...pinButtonStyle, backgroundColor: node.color }}
            >
              {node.icon}
            </motion.button>
            <span style={labelStyle}>
              {node.label}
            </span>
          </motion.div>
        ))}
      </div>

      {showJournal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 13, 25, 0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 20,
            padding: '1rem',
          }}
          onClick={() => setShowJournal(false)}
        >
          <div
            style={{
              width: 'min(760px, 96vw)',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(17, 24, 39, 0.94)',
              padding: '1rem 1.1rem',
              color: '#e2e8f0',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem' }}>
              <h2 style={{ margin: 0 }}>Your Journal</h2>
              <button
                type="button"
                onClick={() => setShowJournal(false)}
                style={{
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'transparent',
                  color: '#e2e8f0',
                  borderRadius: '999px',
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <p style={{ opacity: 0.85, marginTop: '0.6rem' }}>
              Reflections you saved after missions appear here.
            </p>

            {journalEntries.length === 0 ? (
              <p style={{ opacity: 0.8, marginBottom: 0 }}>
                No journal entries yet. Complete a mission and save your response to see it here.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {[...journalEntries].reverse().map((entry) => (
                  <article
                    key={entry.id}
                    style={{
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.04)',
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
      )}
    </div>
  );
};

export default GameMap;