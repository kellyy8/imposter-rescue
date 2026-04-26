const DEFAULT_VOICE_ID = '21m00Tcm4llvDq8ikWAM';

export async function speakWithStability(text: string, stability: number): Promise<void> {
	const apiKey = import.meta.env.VITE_ELEVEN_LABS_KEY;
	const voiceId = import.meta.env.VITE_ELEVEN_LABS_VOICE_ID || DEFAULT_VOICE_ID;

	// Graceful fallback for local demos when key is not configured.
	if (!apiKey) {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = stability >= 0.5 ? 1 : 0.9;
			utterance.pitch = stability >= 0.5 ? 1.05 : 0.92;
			window.speechSynthesis.speak(utterance);
		}
		return;
	}

	const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'xi-api-key': apiKey,
		},
		body: JSON.stringify({
			text,
			model_id: 'eleven_multilingual_v2',
			voice_settings: {
				stability,
				similarity_boost: 0.8,
			},
		}),
	});

	if (!response.ok) {
		throw new Error('Failed to generate ElevenLabs audio.');
	}

	const audioBlob = await response.blob();
	const audioUrl = URL.createObjectURL(audioBlob);
	const audio = new Audio(audioUrl);

	audio.onended = () => {
		URL.revokeObjectURL(audioUrl);
	};

	await audio.play();
}