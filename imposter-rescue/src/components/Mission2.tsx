import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { speakIsabella } from '../services/speak';

type MissionStage = 'intro' | 'memory' | 'wordmatch' | 'puzzle' | 'done';

type MemoryCardDefinition = {
  pairId: string;
  label: string;
  emoji: string;
};

type MemoryCard = MemoryCardDefinition & {
  id: string;
};

type WordMatchPair = {
  id: string;
  negative: string;
  positive: string;
};

type WordMatchCard = {
  id: string;
  pairId: string;
  label: string;
  side: 'negative' | 'positive';
};

interface BadgeEntry {
  id: string;
  earnedAt: string;
  missionLabel: string;
  badgeName: string;
}

interface StarEventEntry {
  id: string;
  earnedAt: string;
  missionLabel: string;
  activityLabel: string;
  stars: number;
}

interface JournalEntry {
  id: string;
  createdAt: string;
  missionLabel: string;
  prompt: string;
  response: string;
}

const BADGE_STORAGE_KEY = 'imposter-rescue-badges';
const STAR_EVENTS_STORAGE_KEY = 'imposter-rescue-star-events';
const JOURNAL_STORAGE_KEY = 'imposter-rescue-journal';
const BADGE_ID = 'mission-2-gravity-defier';
const BADGE_NAME = 'Gravity Defier';
const MISSION_LABEL = 'Mission 2: The Gravitas Equation';
const JOURNAL_PROMPT = 'What helped you believe you belonged in the room, even a little bit?';
const STAR_INCREMENT = 10;

const memoryPairs: MemoryCardDefinition[] = [
  { pairId: 'believe', label: 'I believe in myself', emoji: '✨' },
  { pairId: 'belong', label: 'I belong here', emoji: '🌱' },
  { pairId: 'learn', label: 'I can learn this', emoji: '📘' },
  { pairId: 'voice', label: 'My voice matters', emoji: '🗣️' },
  { pairId: 'grow', label: 'I am growing', emoji: '🌿' },
  { pairId: 'keep-going', label: 'I keep going', emoji: '⭐' },
];

const wordMatchPairs: WordMatchPair[] = [
  { id: 'failure-courage', negative: 'Failure', positive: 'Courage' },
  { id: 'mistake-learning', negative: 'Mistake', positive: 'Learning' },
  { id: 'challenge-strength', negative: 'Challenge', positive: 'Strength' },
  { id: 'doubt-growth', negative: 'Doubt', positive: 'Growth' },
  { id: 'fear-opportunity', negative: 'Fear', positive: 'Opportunity' },
];

const puzzleWords = ['BELIEVE', 'IN', 'YOUR', 'JOURNEY'];
const puzzleTarget = 'BELIEVE IN YOUR JOURNEY';

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 42%, #312e81 100%)',
  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  color: '#f8fafc',
};

const topBarStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1.5rem',
  background: 'rgba(15, 23, 42, 0.75)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  boxSizing: 'border-box',
  backdropFilter: 'blur(8px)',
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
  maxWidth: '1100px',
  margin: '2rem auto',
  padding: '0 1.25rem 2rem',
};

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.94)',
  color: '#1f2937',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.2)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.25)',
  padding: '1.5rem',
  backdropFilter: 'blur(8px)',
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '999px',
  padding: '0.75rem 1.2rem',
  fontWeight: 700,
  cursor: 'pointer',
  color: '#ffffff',
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  boxShadow: '0 6px 18px rgba(124, 58, 237, 0.32)',
};

const secondaryButtonStyle: CSSProperties = {
  border: '1.5px solid #d1d5db',
  borderRadius: '999px',
  padding: '0.75rem 1.2rem',
  fontWeight: 600,
  cursor: 'pointer',
  color: '#374151',
  background: '#ffffff',
};

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.85rem',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '0.85rem',
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

function writeStoredList<T>(storageKey: string, entries: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(entries));
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function shuffleCards(cards: MemoryCardDefinition[]): MemoryCard[] {
  return shuffleArray(
    cards.flatMap((card) => [card, card]).map((card, index) => ({
      ...card,
      id: `${card.pairId}-${index}`,
    }))
  );
}

function shuffleWordMatchCards(pairs: WordMatchPair[]): WordMatchCard[] {
  return shuffleArray(
    pairs.flatMap((pair) => [
      { id: `${pair.id}-negative`, pairId: pair.id, label: pair.negative, side: 'negative' as const },
      { id: `${pair.id}-positive`, pairId: pair.id, label: pair.positive, side: 'positive' as const },
    ])
  );
}

function getInitialTotalStars() {
  return readStoredList<StarEventEntry>(STAR_EVENTS_STORAGE_KEY).reduce((sum, event) => sum + event.stars, 0);
}

export default function Mission2() {
  const [stage, setStage] = useState<MissionStage>('intro');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [totalStars, setTotalStars] = useState(getInitialTotalStars);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [showResource, setShowResource] = useState(false);
  const [journalResponse, setJournalResponse] = useState('');
  const [journalSaveStatus, setJournalSaveStatus] = useState<string | null>(null);

  const [memoryDeck, setMemoryDeck] = useState<MemoryCard[]>(() => shuffleCards(memoryPairs));
  const [faceUpIds, setFaceUpIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const [wordMatchCards, setWordMatchCards] = useState<WordMatchCard[]>(() => shuffleWordMatchCards(wordMatchPairs));
  const [wordMatchSelectedIds, setWordMatchSelectedIds] = useState<string[]>([]);
  const [wordMatchMatchedPairIds, setWordMatchMatchedPairIds] = useState<string[]>([]);
  const [wordMatchAttempts, setWordMatchAttempts] = useState(0);

  const [puzzlePool, setPuzzlePool] = useState<string[]>(() => shuffleArray(puzzleWords));
  const [puzzleSequence, setPuzzleSequence] = useState<string[]>([]);
  const [puzzleMoves, setPuzzleMoves] = useState(0);

  const completionAnnouncedRef = useRef(false);
  const poseCompletionAnnouncedRef = useRef(false);
  const wordMatchCompletionAnnouncedRef = useRef(false);
  const puzzleCompletionAnnouncedRef = useRef(false);
  const clearFlipTimeoutRef = useRef<number | null>(null);
  const wordMatchTimeoutRef = useRef<number | null>(null);

  const activityOneDone = matchedPairIds.length === memoryPairs.length;
  const activityTwoDone = wordMatchMatchedPairIds.length === wordMatchPairs.length;
  const activityThreeDone = puzzleSequence.join(' ') === puzzleTarget;

  const addStars = useCallback((eventId: string, activityLabel: string) => {
    if (typeof window === 'undefined') return;

    const existing = readStoredList<StarEventEntry>(STAR_EVENTS_STORAGE_KEY);
    if (existing.some((entry) => entry.id === eventId)) {
      setTotalStars(existing.reduce((sum, event) => sum + event.stars, 0));
      return;
    }

    const next = [
      ...existing,
      {
        id: eventId,
        earnedAt: new Date().toISOString(),
        missionLabel: MISSION_LABEL,
        activityLabel,
        stars: STAR_INCREMENT,
      },
    ];

    writeStoredList(STAR_EVENTS_STORAGE_KEY, next);
    setTotalStars(next.reduce((sum, event) => sum + event.stars, 0));
  }, []);

  const awardBadge = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const existing = readStoredList<BadgeEntry>(BADGE_STORAGE_KEY);
    if (existing.some((entry) => entry.id === BADGE_ID)) return false;

    const next: BadgeEntry[] = [
      ...existing,
      {
        id: BADGE_ID,
        earnedAt: new Date().toISOString(),
        missionLabel: MISSION_LABEL,
        badgeName: BADGE_NAME,
      },
    ];

    writeStoredList(BADGE_STORAGE_KEY, next);
    return true;
  }, []);

  const awardActivityOneStars = useCallback(() => {
    addStars('mission-2-memory', 'Activity 1: Memory Match');
  }, [addStars]);

  const awardActivityTwoStars = useCallback(() => {
    addStars('mission-2-poses', 'Activity 2: Superwoman Pose');
  }, [addStars]);

  const awardActivityThreeStars = useCallback(() => {
    addStars('mission-2-word-match', 'Activity 3: Word Match');
  }, [addStars]);

  const awardActivityFourStars = useCallback(() => {
    addStars('mission-2-mindset-puzzle', 'Activity 4: Mindset Puzzle');
  }, [addStars]);

  function speak(text: string, rate: number) {
    setVoiceError(null);
    try {
      const didSpeak = speakIsabella(text, rate);
      if (!didSpeak) {
        setVoiceError('Web Speech API is not available in this browser.');
      }
    } catch {
      setVoiceError('Could not play browser speech audio.');
    }
  }

  function startMission() {
    speak(
      "I sat in the colloquium today and didn't understand a single question. I look around and everyone has this gravitas—this natural belonging. I’m just faking the jargon.",
      1.2
    );
    setStage('memory');
  }

  function resetMemoryGame() {
    if (clearFlipTimeoutRef.current) {
      window.clearTimeout(clearFlipTimeoutRef.current);
      clearFlipTimeoutRef.current = null;
    }

    setMemoryDeck(shuffleCards(memoryPairs));
    setFaceUpIds([]);
    setMatchedPairIds([]);
    setMoves(0);
    setIsChecking(false);
    completionAnnouncedRef.current = false;
  }

  function resetWordMatch() {
    if (wordMatchTimeoutRef.current) {
      window.clearTimeout(wordMatchTimeoutRef.current);
      wordMatchTimeoutRef.current = null;
    }

    setWordMatchCards(shuffleWordMatchCards(wordMatchPairs));
    setWordMatchSelectedIds([]);
    setWordMatchMatchedPairIds([]);
    setWordMatchAttempts(0);
    wordMatchCompletionAnnouncedRef.current = false;
  }

  function resetPuzzle() {
    setPuzzlePool(shuffleArray(puzzleWords));
    setPuzzleSequence([]);
    setPuzzleMoves(0);
    puzzleCompletionAnnouncedRef.current = false;
  }

  function handleCardSelect(card: MemoryCard) {
    if (isChecking) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (faceUpIds.includes(card.id)) return;

    const nextFaceUpIds = [...faceUpIds, card.id];

    if (nextFaceUpIds.length === 1) {
      setFaceUpIds(nextFaceUpIds);
      return;
    }

    setMoves((current) => current + 1);
    setFaceUpIds(nextFaceUpIds);
    setIsChecking(true);

    if (clearFlipTimeoutRef.current) {
      window.clearTimeout(clearFlipTimeoutRef.current);
    }

    clearFlipTimeoutRef.current = window.setTimeout(() => {
      const firstCard = memoryDeck.find((entry) => entry.id === nextFaceUpIds[0]);
      const secondCard = memoryDeck.find((entry) => entry.id === nextFaceUpIds[1]);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        setMatchedPairIds((current) => (current.includes(firstCard.pairId) ? current : [...current, firstCard.pairId]));
      }

      setFaceUpIds([]);
      setIsChecking(false);
      clearFlipTimeoutRef.current = null;
    }, 700);
  }

  function handleWordMatchSelect(card: WordMatchCard) {
    if (wordMatchMatchedPairIds.includes(card.pairId)) return;
    if (wordMatchSelectedIds.includes(card.id)) return;

    const nextSelectedIds = [...wordMatchSelectedIds, card.id];

    if (nextSelectedIds.length === 1) {
      setWordMatchSelectedIds(nextSelectedIds);
      return;
    }

    setWordMatchAttempts((current) => current + 1);
    setWordMatchSelectedIds(nextSelectedIds);

    if (wordMatchTimeoutRef.current) {
      window.clearTimeout(wordMatchTimeoutRef.current);
    }

    wordMatchTimeoutRef.current = window.setTimeout(() => {
      const firstCard = wordMatchCards.find((entry) => entry.id === nextSelectedIds[0]);
      const secondCard = wordMatchCards.find((entry) => entry.id === nextSelectedIds[1]);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId && firstCard.side !== secondCard.side) {
        setWordMatchMatchedPairIds((current) =>
          current.includes(firstCard.pairId) ? current : [...current, firstCard.pairId]
        );
      }

      setWordMatchSelectedIds([]);
      wordMatchTimeoutRef.current = null;
    }, 650);
  }

  function handlePuzzleWordClick(word: string) {
    if (puzzleSequence.includes(word)) return;
    setPuzzleSequence((current) => [...current, word]);
    setPuzzleMoves((current) => current + 1);
  }

  function saveJournalEntry() {
    const trimmed = journalResponse.trim();
    if (!trimmed) {
      setJournalSaveStatus('Response is optional. Add text if you want to save an entry.');
      return;
    }

    if (typeof window === 'undefined') {
      setJournalSaveStatus('Journal is unavailable in this environment.');
      return;
    }

    const entry: JournalEntry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      missionLabel: MISSION_LABEL,
      prompt: JOURNAL_PROMPT,
      response: trimmed,
    };

    const existing = readStoredList<JournalEntry>(JOURNAL_STORAGE_KEY);
    writeStoredList(JOURNAL_STORAGE_KEY, [...existing, entry]);
    setJournalSaveStatus('Saved to your journal. Open Home to view it.');
  }

  function finishMission() {
    const earned = awardBadge();
    if (earned) {
      setShowBadgePopup(true);
    } else {
      setShowBadgePopup(true);
    }
    setStage('done');
  }

  useEffect(() => {
    return () => {
      if (clearFlipTimeoutRef.current) {
        window.clearTimeout(clearFlipTimeoutRef.current);
      }
      if (wordMatchTimeoutRef.current) {
        window.clearTimeout(wordMatchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activityOneDone || completionAnnouncedRef.current) return;
    completionAnnouncedRef.current = true;
    awardActivityOneStars();
    speak('That means it was never just luck. I stayed in the room long enough to make it count.', 1.0);
    setStage('wordmatch');
  }, [activityOneDone, awardActivityOneStars]);

  useEffect(() => {
    if (!activityTwoDone || wordMatchCompletionAnnouncedRef.current || stage === 'done') return;
    wordMatchCompletionAnnouncedRef.current = true;
    awardActivityTwoStars();
    speak('Maybe belonging is something I build by showing up. Not something I had to fake.', 0.95);
    setStage('puzzle');
  }, [activityTwoDone, stage, awardActivityTwoStars]);

  useEffect(() => {
    if (!activityThreeDone || puzzleCompletionAnnouncedRef.current || stage !== 'puzzle') return;
    puzzleCompletionAnnouncedRef.current = true;
    awardActivityThreeStars();
    speak('That message is finally hers: believe in your journey.', 0.95);
    finishMission();
  }, [activityThreeDone, stage, awardActivityThreeStars]);

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

      <div style={contentWrapStyle}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ ...pillStyle, background: 'linear-gradient(135deg, #4f46e5, #ec4899)', color: '#ffffff' }}>Mission #2</span>
              <h1 style={{ margin: '0.65rem 0 0.35rem', fontSize: '1.9rem', color: '#312e81' }}>{MISSION_LABEL}</h1>
              <p style={{ margin: 0, maxWidth: '760px', lineHeight: 1.6, color: '#374151' }}>
                Isabella is in a late-night library, surrounded by heavy physics textbooks and the feeling that everyone else belongs in the room.
              </p>
            </div>
            <div style={{ minWidth: '240px', alignSelf: 'flex-start' }}>
              <button type="button" style={{ ...primaryButtonStyle, width: '100%' }} onClick={() => speak("I sat in the colloquium today and didn't understand a single question. I look around and everyone has this gravitas—this natural belonging. I’m just faking the jargon.", 1.35)}>
                Hear Isabella
              </button>
              {voiceError && <p style={{ color: '#b91c1c', marginBottom: 0, fontSize: '0.88rem' }}>{voiceError}</p>}
            </div>
          </div>

          {stage === 'intro' && (
            <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button type="button" style={primaryButtonStyle} onClick={startMission}>
                Start Activity 1: Memory Match
              </button>
              <button type="button" style={secondaryButtonStyle} onClick={() => setStage('memory')}>
                Jump to Challenge
              </button>
            </div>
          )}
        </motion.div>

        {stage === 'memory' && (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, marginTop: '1.2rem' }}>
            <h2 style={{ margin: '0 0 0.35rem', color: '#312e81' }}>Memory Match</h2>
            <p style={{ marginTop: 0, color: '#4b5563', lineHeight: 1.6 }}>
              Match positive affirmations to build confidence. Flip two cards at a time and find all six pairs to help Isabella stop doubting her place in the room.
            </p>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ ...pillStyle, background: '#ede9fe', color: '#5b21b6' }}>Moves: {moves}</div>
              <div style={{ ...pillStyle, background: '#dcfce7', color: '#166534' }}>Matches: {matchedPairIds.length}/6</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.9rem' }}>
              {memoryDeck.map((card) => {
                const isMatched = matchedPairIds.includes(card.pairId);
                const isFaceUp = faceUpIds.includes(card.id) || isMatched;

                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    whileHover={{ scale: isMatched ? 1 : 1.03 }}
                    whileTap={{ scale: isMatched ? 1 : 0.98 }}
                    onClick={() => handleCardSelect(card)}
                    disabled={isMatched || isChecking}
                    style={{
                      minHeight: '160px',
                      borderRadius: '18px',
                      border: isMatched ? '1px solid #16a34a' : '1px solid #d1d5db',
                      background: isMatched
                        ? 'linear-gradient(135deg, #16d66e 0%, #00cc6a 100%)'
                        : isFaceUp
                          ? 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)'
                          : 'linear-gradient(180deg, #eef2f7 0%, #d9dee8 100%)',
                      color: isMatched || isFaceUp ? '#ffffff' : '#64748b',
                      fontWeight: 800,
                      fontSize: '1rem',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                      cursor: isMatched ? 'default' : 'pointer',
                      padding: '1rem',
                    }}
                  >
                    {isFaceUp ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{card.emoji}</div>
                        <div style={{ lineHeight: 1.25 }}>{card.label}</div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem', color: '#6b7280' }}>✦</div>
                        <div style={{ fontSize: '0.95rem', color: '#6b7280' }}>Memory card</div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <button type="button" style={{ ...secondaryButtonStyle, marginTop: '1rem' }} onClick={resetMemoryGame}>
              Reset Game
            </button>
          </motion.section>
        )}

        {stage === 'wordmatch' && (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, marginTop: '1.2rem' }}>
            <h2 style={{ margin: '0 0 0.35rem', color: '#312e81' }}>Activity 2: Word Match</h2>
            <p style={{ marginTop: 0, color: '#4b5563', lineHeight: 1.6 }}>
              Match the negative thoughts with their positive reframes. Isabella learns that the words she uses can either weigh her down or help her rise.
            </p>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ ...pillStyle, background: '#dbeafe', color: '#1d4ed8' }}>Attempts: {wordMatchAttempts}</div>
              <div style={{ ...pillStyle, background: '#dcfce7', color: '#166534' }}>Matched: {wordMatchMatchedPairIds.length}/5</div>
            </div>

            <div style={{ borderRadius: '18px', background: '#dbeafe', color: '#1e3a8a', padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 800, marginBottom: '1rem' }}>
              Match negative thoughts with their positive reframes
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.7rem', color: '#334155' }}>Negative Thoughts</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {wordMatchCards
                    .filter((card) => card.side === 'negative')
                    .map((card) => {
                      const isMatched = wordMatchMatchedPairIds.includes(card.pairId);
                      const isSelected = wordMatchSelectedIds.includes(card.id);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleWordMatchSelect(card)}
                          disabled={isMatched}
                          style={{
                            border: isMatched ? '1px solid #f9a8d4' : isSelected ? '2px solid #be185d' : '1px solid #f9a8d4',
                            borderRadius: '16px',
                            background: isMatched ? 'linear-gradient(90deg, #fbcfe8 0%, #f9a8d4 100%)' : 'linear-gradient(90deg, #f8c7d0 0%, #f59bc8 100%)',
                            color: '#881337',
                            padding: '1rem 0.9rem',
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            cursor: isMatched ? 'default' : 'pointer',
                            boxShadow: '0 10px 18px rgba(15, 23, 42, 0.1)',
                          }}
                        >
                          {card.label}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.7rem', color: '#334155' }}>Positive Reframes</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {wordMatchCards
                    .filter((card) => card.side === 'positive')
                    .map((card) => {
                      const isMatched = wordMatchMatchedPairIds.includes(card.pairId);
                      const isSelected = wordMatchSelectedIds.includes(card.id);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleWordMatchSelect(card)}
                          disabled={isMatched}
                          style={{
                            border: isMatched ? '1px solid #86efac' : isSelected ? '2px solid #15803d' : '1px solid #86efac',
                            borderRadius: '16px',
                            background: isMatched ? 'linear-gradient(90deg, #bbf7d0 0%, #86efac 100%)' : 'linear-gradient(90deg, #baf7d0 0%, #5ce0a0 100%)',
                            color: '#14532d',
                            padding: '1rem 0.9rem',
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            cursor: isMatched ? 'default' : 'pointer',
                            boxShadow: '0 10px 18px rgba(15, 23, 42, 0.1)',
                          }}
                        >
                          {card.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <button type="button" style={{ ...secondaryButtonStyle, marginTop: '1rem' }} onClick={resetWordMatch}>
              Reset Word Match
            </button>
          </motion.section>
        )}

        {stage === 'puzzle' && (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, marginTop: '1.2rem' }}>
            <h2 style={{ margin: '0 0 0.35rem', color: '#312e81' }}>Activity 3: Mindset Puzzle</h2>
            <p style={{ marginTop: 0, color: '#4b5563', lineHeight: 1.6 }}>
              Arrange the words to form an empowering message. Build the phrase one word at a time, then clear or restart if you want to try a different order.
            </p>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ ...pillStyle, background: '#ede9fe', color: '#5b21b6' }}>Moves: {puzzleMoves}</div>
            </div>

            <div style={{ borderRadius: '18px', border: '2px solid #d8b4fe', background: 'linear-gradient(135deg, #f5f3ff 0%, #fae8ff 100%)', padding: '1rem', minHeight: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ color: puzzleSequence.length ? '#4c1d95' : '#c084fc', fontSize: '1.35rem', fontStyle: puzzleSequence.length ? 'normal' : 'italic', fontWeight: 800 }}>
                {puzzleSequence.length ? puzzleSequence.join(' ') : 'Click words below to build your phrase...'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.9rem' }}>
              {puzzlePool.map((word) => {
                const used = puzzleSequence.includes(word);

                return (
                  <button
                    key={word}
                    type="button"
                    disabled={used}
                    onClick={() => handlePuzzleWordClick(word)}
                    style={{
                      border: used ? '1px solid #c4b5fd' : 'none',
                      borderRadius: '14px',
                      background: used ? 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)' : 'linear-gradient(135deg, #4f86ff 0%, #6366f1 100%)',
                      color: '#ffffff',
                      padding: '1rem 0.85rem',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: used ? 'default' : 'pointer',
                      boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)',
                    }}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button type="button" style={{ ...primaryButtonStyle, background: 'linear-gradient(135deg, #f97316, #fb7185)' }} onClick={() => setPuzzleSequence([])}>
                Clear
              </button>
              <button type="button" style={{ ...secondaryButtonStyle, minWidth: '180px' }} onClick={resetPuzzle}>
                Restart
              </button>
            </div>

            <div style={{ marginTop: '1rem', borderRadius: '14px', border: '1px solid #facc15', background: '#fef9c3', padding: '0.9rem 1rem', color: '#92400e', textAlign: 'center' }}>
              <span role="img" aria-hidden="true">💡</span> Hint: Think about what message would inspire someone on their personal growth journey
            </div>
          </motion.section>
        )}

        {stage === 'done' && (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, marginTop: '1.2rem' }}>
            <h2 style={{ margin: '0 0 0.35rem', color: '#312e81' }}>Wellness Center Resonance</h2>
            <p style={{ marginTop: 0, color: '#4b5563', lineHeight: 1.6 }}>
              Read the story of a famous female physicist who kept showing up even when she was overlooked!
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" style={primaryButtonStyle} onClick={() => setShowResource((current) => !current)}>
                Reveal story
              </button>
              <Link to="/home" style={{ ...secondaryButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                View Home
              </Link>
            </div>

            {showResource && (
              <div style={{ marginTop: '1rem', borderRadius: '16px', padding: '1rem', background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                <h3 style={{ margin: '0 0 0.35rem', color: '#312e81' }}>Spotlight: Chien-Shiung Wu</h3>
                <p style={{ margin: 0, color: '#374151', lineHeight: 1.65 }}>
                  Chien-Shiung Wu helped reshape physics and still navigated being underestimated. Her story is a reminder that expertise can be real even when the room feels unsteady.
                </p>
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#312e81' }}>Reflection (Optional) </h3>
              <p style={{ marginTop: 0, color: '#4b5563' }}>{JOURNAL_PROMPT}</p>
              <textarea
                value={journalResponse}
                onChange={(event) => {
                  setJournalResponse(event.target.value);
                  setJournalSaveStatus(null);
                }}
                rows={4}
                placeholder="Write a reflection, if you want."
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: '12px', border: '1.5px solid #d1d5db', padding: '0.8rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                <button type="button" style={primaryButtonStyle} onClick={saveJournalEntry}>
                  Save To Journal
                </button>
              </div>
              {journalSaveStatus && <p style={{ marginBottom: 0, marginTop: '0.65rem', color: '#1f2937' }}>{journalSaveStatus}</p>}
            </div>
          </motion.section>
        )}
      </div>

      {showBadgePopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 40,
            padding: '1rem',
          }}
          onClick={() => setShowBadgePopup(false)}
        >
          <div
            style={{
              width: 'min(420px, 92vw)',
              borderRadius: '22px',
              padding: '1.4rem 1.2rem',
              background: 'linear-gradient(180deg, rgba(255, 244, 183, 0.98) 0%, rgba(248, 210, 106, 0.96) 100%)',
              color: '#1f2937',
              border: '1px solid rgba(255,255,255,0.45)',
              boxShadow: '0 28px 70px rgba(0, 0, 0, 0.45)',
              textAlign: 'center',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>🏅</div>
            <h2 style={{ margin: '0.45rem 0 0.25rem' }}>Gravity Defier</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>Badge earned for Mission 2</p>
            <p style={{ margin: '0.65rem 0 0', opacity: 0.9 }}>
              The badge has been added to your collection and can be viewed in Home.
            </p>
            <button
              type="button"
              onClick={() => setShowBadgePopup(false)}
              style={{
                marginTop: '1rem',
                border: 'none',
                borderRadius: '999px',
                padding: '0.7rem 1rem',
                cursor: 'pointer',
                background: '#111827',
                color: '#f8fafc',
                fontWeight: 700,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PoseOutline({ id, matched }: { id: PoseId; matched: boolean }) {
  const tone = matched ? '#166534' : '#a5b4fc';

  return (
    <svg width="100%" height="88" viewBox="0 0 120 88" fill="none" style={{ marginTop: '0.45rem' }}>
      <path d={outlinePaths[id]} stroke={tone} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={matched ? 1 : 0.9} />
    </svg>
  );
}

const outlinePaths: Record<PoseId, string> = {
  reach: 'M60 16 L60 48 M60 28 L34 14 M60 28 L84 16 M60 48 L48 76 M60 48 L72 76',
  lift: 'M60 16 L60 48 M60 24 L88 30 M60 28 L32 34 M60 48 L50 76 M60 48 L78 74',
  lean: 'M60 16 L60 48 M60 28 L42 40 M60 28 L86 24 M60 48 L44 74 M60 48 L76 72',
  focus: 'M60 16 L60 48 M60 24 L60 22 M60 28 L76 28 M60 48 L52 74 M60 48 L68 74',
  turn: 'M60 16 L60 48 M60 24 L82 20 M60 28 L36 20 M60 48 L44 76 M60 48 L76 76',
  ground: 'M60 16 L60 48 M60 28 L44 50 M60 28 L76 50 M60 48 L60 76 M48 76 L72 76',
};