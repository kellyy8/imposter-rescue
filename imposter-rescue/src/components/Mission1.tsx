import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { speakDexter } from '../services/speak';

type MissionStage = 'intro' | 'storm' | 'lyric' | 'done';
type SlotKey = 'verb' | 'noun';

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
const JOURNAL_PROMPT = "When was the last time your 'noise' was louder than your 'music'?";
const MISSION_ONE_BADGE = 'Stage Confidence';

const distortedThoughts = [
	'One-hit wonder',
	"They'll see through you",
	'Just lucky',
	"You don't belong here",
	'Tonight is the collapse',
	'You are faking it',
	'They came for someone else',
	'You will freeze out there',
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
	minHeight: '100vh',
	background: '#f0f0f8',
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
	fontSize: '0.9rem',
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

const pageTitleStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
	fontWeight: 700,
	fontSize: '1rem',
	color: '#1a1a2e',
	margin: 0,
};

const contentWrapStyle: CSSProperties = {
	maxWidth: '860px',
	margin: '2rem auto',
	padding: '0 1.25rem',
};

const cardStyle: CSSProperties = {
	background: '#ffffff',
	borderRadius: '20px',
	border: '1px solid rgba(0,0,0,0.07)',
	boxShadow: '0 4px 24px rgba(124, 58, 237, 0.07)',
	padding: '1.5rem',
};

const primaryButtonStyle: CSSProperties = {
	border: 'none',
	borderRadius: '999px',
	padding: '0.7rem 1.4rem',
	fontWeight: 700,
	cursor: 'pointer',
	color: '#ffffff',
	background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
	fontSize: '0.95rem',
	boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
};

const secondaryButtonStyle: CSSProperties = {
	border: '1.5px solid #d1d5db',
	borderRadius: '999px',
	padding: '0.7rem 1.4rem',
	fontWeight: 600,
	cursor: 'pointer',
	color: '#374151',
	background: '#ffffff',
	fontSize: '0.95rem',
};

const themePillStyle: CSSProperties = {
	display: 'inline-block',
	background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
	color: '#ffffff',
	borderRadius: '999px',
	padding: '0.3rem 0.85rem',
	fontSize: '0.8rem',
	fontWeight: 700,
	letterSpacing: '0.02em',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createBubblePosition(index: number): { x: number; y: number } {
	const x = 14 + ((index * 11) % 68);
	const y = 18 + ((index * 17) % 58);
	return { x, y };
}

function getStormGain(progress: number): number {
	return 0.01 + (1 - progress) * 0.1;
}

function deterministicNoiseSample(index: number): number {
	const seed = Math.sin(index * 12.9898) * 43758.5453;
	const normalized = seed - Math.floor(seed);
	return normalized * 2 - 1;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Mission1() {
	const audioContextRef = useRef<AudioContext | null>(null);
	const noiseGainRef = useRef<GainNode | null>(null);
	const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
	const halfwayLineSpokenRef = useRef(false);
	const activityOneDoneLineSpokenRef = useRef(false);
	const completionLineSpokenRef = useRef(false);

	const [stage, setStage] = useState<MissionStage>('intro');
	const [popped, setPopped] = useState<string[]>([]);
	const [stormStarted, setStormStarted] = useState(false);
	const [voiceError, setVoiceError] = useState<string | null>(null);
	const [slots, setSlots] = useState<Record<SlotKey, string>>({
		verb: 'hiding',
		noun: 'mask',
	});
	const [journalResponse, setJournalResponse] = useState('');
	const [journalSaveStatus, setJournalSaveStatus] = useState<string | null>(null);

	const remainingThoughts = useMemo(
		() => distortedThoughts.filter((thought) => !popped.includes(thought)),
		[popped]
	);

	const stormProgress = popped.length / distortedThoughts.length;
	const staticVolume = Math.round((1 - stormProgress * 0.85) * 100);
	const voiceClarity = Math.round((0.25 + stormProgress * 0.75) * 100);

	const ensureAudioContext = useCallback((): AudioContext | null => {
		if (typeof window === 'undefined') return null;
		if (!audioContextRef.current) {
			audioContextRef.current = new AudioContext();
		}
		return audioContextRef.current;
	}, []);

	const startStormStaticNoise = useCallback(() => {
		const context = ensureAudioContext();
		if (!context) return;
		if (context.state === 'suspended') void context.resume();
		if (!noiseGainRef.current) {
			const gainNode = context.createGain();
			gainNode.gain.value = getStormGain(stormProgress);
			gainNode.connect(context.destination);
			noiseGainRef.current = gainNode;
		}
		if (noiseSourceRef.current) return;
		const bufferSize = context.sampleRate * 2;
		const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
		const output = noiseBuffer.getChannelData(0);
		for (let index = 0; index < bufferSize; index += 1) {
			output[index] = deterministicNoiseSample(index);
		}
		const source = context.createBufferSource();
		source.buffer = noiseBuffer;
		source.loop = true;
		source.connect(noiseGainRef.current);
		source.start(0);
		noiseSourceRef.current = source;
	}, [ensureAudioContext, stormProgress]);

	const stopStormStaticNoise = useCallback(() => {
		if (noiseSourceRef.current) {
			noiseSourceRef.current.stop();
			noiseSourceRef.current.disconnect();
			noiseSourceRef.current = null;
		}
	}, []);

	function playPopSound() {
		const context = ensureAudioContext();
		if (!context) return;
		if (context.state === 'suspended') void context.resume();
		const oscillator = context.createOscillator();
		const gainNode = context.createGain();
		oscillator.type = 'triangle';
		oscillator.frequency.setValueAtTime(540, context.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(280, context.currentTime + 0.08);
		gainNode.gain.setValueAtTime(0.0001, context.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.01);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
		oscillator.connect(gainNode);
		gainNode.connect(context.destination);
		oscillator.start();
		oscillator.stop(context.currentTime + 0.12);
	}

	function playDexterOpening() {
		setVoiceError(null);
		try {
			const didSpeak = speakDexter(
				"Can you hear them? They're chanting for someone else. I'm just a guy with a guitar who got lucky. I can't go out there.",
				1.3
			);
			if (!didSpeak) setVoiceError('Web Speech API is not available in this browser.');
		} catch {
			setVoiceError('Could not play browser speech audio.');
		}
	}

	function playDexterConfidentLine() {
		setVoiceError(null);
		try {
			const didSpeak = speakDexter(
				'That... actually sounds like me. Thank you for staying here with me.',
				0.9
			);
			if (!didSpeak) setVoiceError('Web Speech API is not available in this browser.');
		} catch {
			setVoiceError('Could not play browser speech audio.');
		}
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
			missionLabel: 'Mission 1: The Silent Headliner',
			prompt: JOURNAL_PROMPT,
			response: trimmed,
		};
		try {
			const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
			const existing = raw ? (JSON.parse(raw) as JournalEntry[]) : [];
			const next = Array.isArray(existing) ? [...existing, entry] : [entry];
			window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
			setJournalSaveStatus('Saved to your journal. Open Home to view it.');
		} catch {
			setJournalSaveStatus('Could not save to journal. Please try again.');
		}
	}

	function awardMissionOneBadge() {
		if (typeof window === 'undefined') return;
		try {
			const raw = window.localStorage.getItem(BADGE_STORAGE_KEY);
			const existing = raw ? (JSON.parse(raw) as BadgeEntry[]) : [];
			const alreadyEarned = Array.isArray(existing)
				? existing.some((entry) => entry.id === 'mission-1-stage-confidence')
				: false;
			if (alreadyEarned) return;
			const next: BadgeEntry[] = [
				...(Array.isArray(existing) ? existing : []),
				{
					id: 'mission-1-stage-confidence',
					earnedAt: new Date().toISOString(),
					missionLabel: 'Mission 1: The Silent Headliner',
					badgeName: MISSION_ONE_BADGE,
				},
			];
			window.localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(next));
		} catch {
			// Badge collection is a bonus layer; the mission can still complete without persistence.
		}
	}

	function popThought(thought: string) {
		if (popped.includes(thought)) return;
		playPopSound();
		setPopped((current) => {
			const next = [...current, thought];
			if (!activityOneDoneLineSpokenRef.current && next.length === distortedThoughts.length) {
				activityOneDoneLineSpokenRef.current = true;
				speakDexter("It's hard to hear the music over the noise, isn't it?", 1.0);
			}
			if (!halfwayLineSpokenRef.current && next.length >= Math.ceil(distortedThoughts.length / 2)) {
				halfwayLineSpokenRef.current = true;
				speakDexter('Okay... it is getting quieter. I can breathe a little now.', 1.1);
			}
			return next;
		});
	}

	function onDropWord(slot: SlotKey, event: React.DragEvent<HTMLElement>) {
		event.preventDefault();
		const word = event.dataTransfer.getData('text/plain');
		if (!word) return;
		setSlots((current) => ({ ...current, [slot]: word }));
	}

	const lyricSolved = slots.verb === 'leading' && slots.noun === 'truth';

	useEffect(() => {
		if (stage !== 'lyric') {
			completionLineSpokenRef.current = false;
			return;
		}
		if (lyricSolved && !completionLineSpokenRef.current) {
			completionLineSpokenRef.current = true;
			playDexterConfidentLine();
		}
	}, [lyricSolved, stage]);

	useEffect(() => {
		if (stage === 'storm' && stormStarted && remainingThoughts.length > 0) {
			startStormStaticNoise();
		} else {
			stopStormStaticNoise();
		}
	}, [remainingThoughts.length, stage, startStormStaticNoise, stopStormStaticNoise, stormStarted]);

	useEffect(() => {
		if (noiseGainRef.current) {
			noiseGainRef.current.gain.value = getStormGain(stormProgress);
		}
	}, [stormProgress]);

	useEffect(() => {
		return () => {
			stopStormStaticNoise();
			if (audioContextRef.current) {
				void audioContextRef.current.close();
				audioContextRef.current = null;
			}
		};
	}, [stopStormStaticNoise]);

	return (
		<div style={pageStyle}>
			{/* Top navigation bar */}
			<div style={topBarStyle}>
				<Link to="/" style={mapButtonStyle}>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
						<line x1="9" y1="3" x2="9" y2="18" />
						<line x1="15" y1="6" x2="15" y2="21" />
					</svg>
					Map
				</Link>
                <p style={pageTitleStyle}>
					<span>🎵</span> Mission #1: Coachella Stage
				</p>
				<div style={starBadgeStyle}>
					<span style={{ fontSize: '1.1rem' }}>⭐</span>
					<span>0</span>
				</div>
			</div>

			{/* Main content */}
			<div style={contentWrapStyle}>
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
					{/* Intro character card */}
					<div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
						{/* Avatar circle */}
						<div style={{
							width: '72px',
							height: '72px',
							borderRadius: '9999px',
							background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
							flexShrink: 0,
							overflow: 'hidden',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '2rem',
						}}>
							🎤
						</div>

						<div style={{ flex: 1 }}>
							<h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e' }}>Dexter</h2>

							<div style={{
								background: '#f8f9ff',
								border: '1px solid #e5e7eb',
								borderRadius: '14px',
								padding: '0.85rem 1rem',
								lineHeight: 1.65,
								color: '#374151',
								fontSize: '0.95rem',
								marginBottom: '0.85rem',
							}}>
								Dexter is headlining Coachella, but backstage he is frozen by the Imposter&apos;s Echo.
							    He believes the crowd is cheering for a version of him that is fake.
							</div>

							<span style={themePillStyle}>Theme: Overcome imposter syndrome</span>

							{voiceError && (
								<p style={{ color: '#dc2626', marginTop: '0.6rem', marginBottom: 0, fontSize: '0.875rem' }}>{voiceError}</p>
							)}
						</div>
					</div>

					{/* Intro actions */}
					{stage === 'intro' && (
						<div style={{ marginTop: '1.25rem' }}>
							<button
								type="button"
								style={{ ...primaryButtonStyle, width: '100%', fontSize: '1rem', padding: '0.9rem' }}
								onClick={() => {
									playDexterOpening();
									setStormStarted(false);
								}}
							>
								Hear Dexter (shaky voice)
							</button>
							<button
								type="button"
								style={{ ...secondaryButtonStyle, width: '100%', fontSize: '0.95rem', padding: '0.75rem', marginTop: '0.65rem' }}
								onClick={() => {
									setStage('storm');
									setStormStarted(true);
								}}
							>
								Start Activity 1: Word Storm
							</button>
						</div>
					)}
				</motion.div>

				{/* Activity 1: Storm */}
				{stage === 'storm' && (
					<motion.section
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						style={{ ...cardStyle, marginTop: '1.25rem' }}
					>
						<h2 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: '#4c1d95' }}>
							Activity 1: The Word Storm
						</h2>
						<p style={{ marginTop: 0, opacity: 0.75, fontSize: '0.92rem', marginBottom: '0.9rem' }}>
							Pop all distorted thoughts. As you clear them, static noise drops and Dexter's voice becomes steady.
						</p>

						<div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
							<div style={{
								padding: '0.45rem 1rem',
								borderRadius: '999px',
								background: '#fef9c3',
								color: '#92400e',
								fontWeight: 600,
								fontSize: '0.85rem',
								border: '1px solid #fde68a',
							}}>
								🔊 Static: {staticVolume}%
							</div>
							<div style={{
								padding: '0.45rem 1rem',
								borderRadius: '999px',
								background: '#d1fae5',
								color: '#065f46',
								fontWeight: 600,
								fontSize: '0.85rem',
								border: '1px solid #a7f3d0',
							}}>
								🎤 Clarity: {voiceClarity}%
							</div>
						</div>

						<div style={{
							position: 'relative',
							height: '300px',
							borderRadius: '16px',
							border: '1.5px solid #e9d5ff',
							background: 'linear-gradient(145deg, #faf5ff 0%, #f0f0f8 100%)',
							overflow: 'hidden',
						}}>
							{remainingThoughts.map((thought, index) => {
								const pos = createBubblePosition(index + thought.length);
								return (
									<motion.button
										key={thought}
										type="button"
										whileHover={{ scale: 1.07 }}
										animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
										transition={{ repeat: Infinity, duration: 3 + index * 0.25 }}
										onClick={() => popThought(thought)}
										style={{
											position: 'absolute',
											top: `${pos.y}%`,
											left: `${pos.x}%`,
											transform: 'translate(-50%, -50%)',
											borderRadius: '999px',
											border: '1.5px solid #c4b5fd',
											background: 'rgba(124, 58, 237, 0.1)',
											color: '#4c1d95',
											padding: '0.45rem 0.85rem',
											cursor: 'pointer',
											fontWeight: 600,
											fontSize: '0.85rem',
										}}
									>
										{thought}
									</motion.button>
								);
							})}

							{remainingThoughts.length === 0 && (
								<div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
									<div style={{ textAlign: 'center', padding: '1rem' }}>
										<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
										<h3 style={{ marginBottom: '0.4rem', color: '#4c1d95' }}>Storm Cleared</h3>
										<p style={{ marginTop: 0, opacity: 0.75, marginBottom: '1rem' }}>
											Noise is down. Dexter can hear himself again.
										</p>
										<button
											type="button"
											style={primaryButtonStyle}
											onClick={() => setStage('lyric')}
										>
											Continue to Activity 2
										</button>
									</div>
								</div>
							)}
						</div>

						{!stormStarted && (
							<button
								type="button"
								style={{ ...secondaryButtonStyle, marginTop: '0.8rem' }}
								onClick={() => setStormStarted(true)}
							>
								Begin Storm
							</button>
						)}
					</motion.section>
				)}

				{/* Activity 2: Lyric */}
				{stage === 'lyric' && (
					<motion.section
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						style={{ ...cardStyle, marginTop: '1.25rem' }}
					>
						<h2 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: '#4c1d95' }}>
							Activity 2: The Resonant Lyric
						</h2>
						<p style={{ marginTop: 0, opacity: 0.75, fontSize: '0.92rem', marginBottom: '1rem' }}>
							Drag words into the brackets to reframe Dexter's opening lyric.
						</p>

						<div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
							{['hiding', 'mask', 'leading', 'truth'].map((word) => (
								<span
									key={word}
									draggable
									onDragStart={(event) => event.dataTransfer.setData('text/plain', word)}
									style={{
										border: '1.5px solid #c4b5fd',
										borderRadius: '999px',
										padding: '0.4rem 0.9rem',
										cursor: 'grab',
										background: '#f5f3ff',
										color: '#4c1d95',
										fontWeight: 600,
										fontSize: '0.9rem',
									}}
								>
									{word}
								</span>
							))}
						</div>

						<div style={{
							background: '#f8f9ff',
							borderRadius: '12px',
							padding: '1rem 1.2rem',
							fontSize: '1.2rem',
							color: '#1a1a2e',
							border: '1.5px solid #e5e7eb',
						}}>
							I am{' '}
							<span
								onDrop={(event) => onDropWord('verb', event)}
								onDragOver={(event) => event.preventDefault()}
								style={{
									borderBottom: '2.5px dashed #7c3aed',
									padding: '0.1rem 0.3rem',
									color: '#7c3aed',
									fontWeight: 700,
									minWidth: '60px',
									display: 'inline-block',
								}}
							>
								{slots.verb}
							</span>{' '}
							with my{' '}
							<span
								onDrop={(event) => onDropWord('noun', event)}
								onDragOver={(event) => event.preventDefault()}
								style={{
									borderBottom: '2.5px dashed #7c3aed',
									padding: '0.1rem 0.3rem',
									color: '#7c3aed',
									fontWeight: 700,
									minWidth: '60px',
									display: 'inline-block',
								}}
							>
								{slots.noun}
							</span>
							.
						</div>

						{lyricSolved && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								style={{ marginTop: '1rem' }}
							>
								<div style={{
									background: '#d1fae5',
									border: '1px solid #a7f3d0',
									borderRadius: '12px',
									padding: '0.85rem 1rem',
									color: '#065f46',
									fontWeight: 600,
									marginBottom: '0.9rem',
									fontSize: '0.95rem',
								}}>
									"That... actually sounds like me. Thank you for staying here with me."
								</div>
								<button
									type="button"
									style={primaryButtonStyle}
									onClick={() => {
										awardMissionOneBadge();
										setStage('done');
									}}
								>
									Finish Mission #1
								</button>
							</motion.div>
						)}
					</motion.section>
				)}

				{/* Stage: done — reflection */}
				{stage === 'done' && (
					<motion.section
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						style={{ ...cardStyle, marginTop: '1.25rem' }}
					>
						<h3 style={{ margin: '0 0 0.5rem', color: '#4c1d95', fontWeight: 800 }}>Reflection (Optional)</h3>
						<p style={{ marginTop: 0, opacity: 0.75, marginBottom: '0.85rem', fontSize: '0.95rem' }}>{JOURNAL_PROMPT}</p>
						<textarea
							value={journalResponse}
							onChange={(event) => {
								setJournalResponse(event.target.value);
								setJournalSaveStatus(null);
							}}
							placeholder="Write your reflection here."
							rows={4}
							style={{
								width: '100%',
								borderRadius: '12px',
								border: '1.5px solid #e5e7eb',
								background: '#f9fafb',
								color: '#1a1a2e',
								padding: '0.75rem',
								resize: 'vertical',
								fontSize: '0.95rem',
								fontFamily: 'inherit',
								boxSizing: 'border-box',
							}}
						/>
						<div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
							<button type="button" style={primaryButtonStyle} onClick={saveJournalEntry}>
								Save To Journal
							</button>
							<Link to="/" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>
								Back to Home
							</Link>
						</div>
						{journalSaveStatus && (
							<p style={{ marginBottom: 0, marginTop: '0.65rem', opacity: 0.85, fontSize: '0.88rem' }}>{journalSaveStatus}</p>
						)}
					</motion.section>
				)}
			</div>
		</div>
	);
}