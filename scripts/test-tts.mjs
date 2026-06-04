import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const key = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
console.log('API Key exists:', !!key, '(length:', key?.length, ')');
console.log('Voice ID:', voiceId);

const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': key,
  },
  body: JSON.stringify({
    text: 'hello',
    model_id: 'eleven_multilingual_v2',
    output_format: 'mp3_44100_128',
  }),
});

console.log('Status:', res.status);
if (!res.ok) {
  const text = await res.text();
  console.log('Error:', text.slice(0, 500));
} else {
  const data = await res.json();
  console.log('Success! Audio base64 length:', data.audio_base64?.length);
}
