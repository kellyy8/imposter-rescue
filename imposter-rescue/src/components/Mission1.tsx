import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cld } from '../cloudinary/config';
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

const backgroundImage = cld
	.image('glp_slpokv')
	.addTransformation('c_fill,w_1600,h_1000/e_blur:220/o_65/f_auto/q_auto')
	.toURL();

const avatarImage = cld
	.image('ai-generated-a-guy-standing-in-middle-of-the-stage-and-singing-with-a-microphone-behind-him-free-photo_zz9h4s')
	.addTransformation('c_fill,w_280,h_280,g_face/f_auto/q_auto')
	.toURL();

const pageStyle: CSSProperties = {
	minHeight: '100vh',
	padding: '2rem',
	position: 'relative',
	overflow: 'hidden',
	color: '#f4f6fb',
};

const panelStyle: CSSProperties = {
	position: 'relative',
	zIndex: 3,
	maxWidth: '980px',
	margin: '0 auto',
	background: 'rgba(15, 20, 36, 0.82)',
	border: '1px solid rgba(255,255,255,0.18)',
	borderRadius: '24px',
	padding: '1.5rem',
	backdropFilter: 'blur(8px)',
};

const primaryButtonStyle: CSSProperties = {
	border: 'none',
	borderRadius: '999px',
	padding: '0.75rem 1.2rem',
	fontWeight: 700,
	cursor: 'pointer',
	color: '#101b2d',
	background: 'linear-gradient(120deg, #f4d472 0%, #85f4cc 100%)',
};

const secondaryButtonStyle: CSSProperties = {
	border: '1px solid rgba(255,255,255,0.3)',
	borderRadius: '999px',
	padding: '0.75rem 1.2rem',
	fontWeight: 600,
	cursor: 'pointer',
	color: '#f8fafc',
	background: 'rgba(255,255,255,0.06)',
};

function createBubblePosition(index: number): { x: number; y: number } {
	const x = 14 + ((index * 11) % 68);
	const y = 18 + ((index * 17) % 58);
	return { x, y };
}

function getStormGain(progress: number): number {
	// Audible static at start, then drops toward near-silent as the storm clears.
	return 0.01 + (1 - progress) * 0.1;
}

function deterministicNoiseSample(index: number): number {
	const seed = Math.sin(index * 12.9898) * 43758.5453;
	const normalized = seed - Math.floor(seed);
	return normalized * 2 - 1;
}

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

		if (context.state === 'suspended') {
			void context.resume();
		}

		if (!noiseGainRef.current) {
			const gainNode = context.createGain();
			gainNode.gain.value = getStormGain(stormProgress);
			gainNode.connect(context.destination);
			noiseGainRef.current = gainNode;
		}

		if (noiseSourceRef.current) {
			return;
		}

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

		if (context.state === 'suspended') {
			void context.resume();
		}

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

			if (!didSpeak) {
				setVoiceError('Web Speech API is not available in this browser.');
			}
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

			if (!didSpeak) {
				setVoiceError('Web Speech API is not available in this browser.');
			}
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
		if (typeof window === 'undefined') {
			return;
		}

		try {
			const raw = window.localStorage.getItem(BADGE_STORAGE_KEY);
			const existing = raw ? (JSON.parse(raw) as BadgeEntry[]) : [];
			const alreadyEarned = Array.isArray(existing)
				? existing.some((entry) => entry.id === 'mission-1-stage-confidence')
				: false;

			if (alreadyEarned) {
				return;
			}

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
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: `url(${backgroundImage})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					opacity: 0.7,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(circle at 25% 20%, rgba(214, 95, 217, 0.28), transparent 42%), linear-gradient(180deg, rgba(4, 7, 17, 0.45) 0%, rgba(4, 7, 17, 0.9) 100%)',
				}}
			/>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={panelStyle}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
					<div>
						<h1 style={{ margin: '0.4rem 0 0', fontSize: '1.9rem' }}>Dexter Mission: The Silent Headliner</h1>
					</div>
					<Link to="/" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>
						Back to Map
					</Link>
				</div>

				<div style={{ marginTop: '1.3rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.2rem' }}>
					<img
						src={avatarImage}
						alt="Dexter avatar"
						style={{ width: '100%', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.2)' }}
					/>
					<div>
						<p style={{ marginTop: 0, lineHeight: 1.6 }}>
							Dexter is the headline act at a packed festival, but backstage he is frozen by the Imposter&apos;s Echo.
							He believes the crowd is cheering for a version of him that is fake.
						</p>

						{stage === 'intro' && (
							<div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
								<button
									type="button"
									style={primaryButtonStyle}
									onClick={() => {
										playDexterOpening();
										setStormStarted(false);
									}}
								>
									Hear Dexter (shaky voice)
								</button>
								<button
									type="button"
									style={secondaryButtonStyle}
									onClick={() => {
										setStage('storm');
										setStormStarted(true);
									}}
								>
									Start Activity 1: Word Storm
								</button>
							</div>
						)}

						{voiceError && <p style={{ color: '#fca5a5', marginBottom: 0 }}>{voiceError}</p>}
					</div>
				</div>

				{stage === 'storm' && (
					<section style={{ marginTop: '1.3rem' }}>
						<h2 style={{ margin: '0 0 0.6rem' }}>Activity 1: The Word Storm</h2>
						<p style={{ marginTop: 0, opacity: 0.9 }}>
							Pop all distorted thoughts. As you clear them, static noise drops and Dexter&apos;s voice becomes steady.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
							<div style={{ padding: '0.55rem 0.8rem', borderRadius: '999px', background: 'rgba(252, 211, 77, 0.14)' }}>
								Static noise volume: {staticVolume}%
							</div>
							<div style={{ padding: '0.55rem 0.8rem', borderRadius: '999px', background: 'rgba(52, 211, 153, 0.14)' }}>
								Voice clarity: {voiceClarity}%
							</div>
						</div>

						<div
							style={{
								position: 'relative',
								height: '320px',
								borderRadius: '16px',
								border: '1px solid rgba(255,255,255,0.16)',
								background:
									'linear-gradient(160deg, rgba(17, 25, 40, 0.78) 0%, rgba(31, 43, 64, 0.62) 100%)',
								overflow: 'hidden',
							}}
						>
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
											border: '1px solid rgba(255,255,255,0.34)',
											background: 'rgba(255,255,255,0.12)',
											color: '#fef2f2',
											padding: '0.55rem 0.9rem',
											cursor: 'pointer',
										}}
									>
										{thought}
									</motion.button>
								);
							})}

							{remainingThoughts.length === 0 && (
								<div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
									<div style={{ textAlign: 'center' }}>
										<h3 style={{ marginBottom: '0.4rem' }}>Storm Cleared</h3>
										<p style={{ marginTop: 0, opacity: 0.9 }}>
											Noise is down. Dexter can hear himself again.
										</p>
										<button
											type="button"
											style={primaryButtonStyle}
											onClick={() => {
												// playDexterConfidentLine();
												setStage('lyric');
											}}
										>
											Continue to Activity 2
										</button>
									</div>
								</div>
							)}
						</div>

						{!stormStarted && (
							<button type="button" style={{ ...secondaryButtonStyle, marginTop: '0.8rem' }} onClick={() => setStormStarted(true)}>
								Begin Storm
							</button>
						)}
					</section>
				)}

				{stage === 'lyric' && (
					<section style={{ marginTop: '1.3rem' }}>
						<h2 style={{ margin: '0 0 0.6rem' }}>Activity 2: The Resonant Lyric</h2>
						<p style={{ marginTop: 0, opacity: 0.9 }}>
							Drag words into the brackets to reframe Dexter&apos;s opening lyric.
						</p>

						<div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
							{['hiding', 'mask', 'leading', 'truth'].map((word) => (
								<span
									key={word}
									draggable
									onDragStart={(event) => event.dataTransfer.setData('text/plain', word)}
									style={{
										border: '1px solid rgba(255,255,255,0.3)',
										borderRadius: '999px',
										padding: '0.45rem 0.8rem',
										cursor: 'grab',
										background: 'rgba(255,255,255,0.08)',
									}}
								>
									{word}
								</span>
							))}
						</div>

						<p style={{ fontSize: '1.25rem' }}>
							I am{' '}
							<span
								onDrop={(event) => onDropWord('verb', event)}
								onDragOver={(event) => event.preventDefault()}
								style={{ borderBottom: '2px dashed #93c5fd', padding: '0.1rem 0.25rem' }}
							>
								{slots.verb}
							</span>{' '}
							with my{' '}
							<span
								onDrop={(event) => onDropWord('noun', event)}
								onDragOver={(event) => event.preventDefault()}
								style={{ borderBottom: '2px dashed #93c5fd', padding: '0.1rem 0.25rem' }}
							>
								{slots.noun}
							</span>
							.
						</p>

						{lyricSolved && (
							<div style={{ marginTop: '0.8rem' }}>
								<p style={{ color: '#86efac', marginBottom: '0.7rem' }}>
									"That... actually sounds like me. Thank you for staying here with me."
								</p>
										<button
											type="button"
											style={primaryButtonStyle}
											onClick={() => {
												awardMissionOneBadge();
												setStage('done');
											}}
										>
									Finish Mission
								</button>
							</div>
						)}
					</section>
				)}

				{stage === 'done' && (
					<section style={{ marginTop: '1.3rem' }}>
						<div
							style={{
								marginTop: '1rem',
								padding: '0.9rem',
								borderRadius: '14px',
								background: 'rgba(255, 255, 255, 0.05)',
								border: '1px solid rgba(255,255,255,0.13)',
							}}
						>
							<h3 style={{ margin: '0 0 0.5rem' }}>Reflection (Optional)</h3>
							<p style={{ marginTop: 0, opacity: 0.92 }}>{JOURNAL_PROMPT}</p>
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
									borderRadius: '10px',
									border: '1px solid rgba(255,255,255,0.2)',
									background: 'rgba(12, 19, 32, 0.85)',
									color: '#f8fafc',
									padding: '0.7rem',
									resize: 'vertical',
								}}
							/>
							<div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
								<button type="button" style={primaryButtonStyle} onClick={saveJournalEntry}>
									Save To Journal
								</button>
								<Link to="/" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>
									View Journal Via Home
								</Link>
							</div>
							{journalSaveStatus && <p style={{ marginBottom: 0, opacity: 0.9 }}>{journalSaveStatus}</p>}
						</div>
					</section>
				)}
			</motion.div>
		</div>
	);
}
