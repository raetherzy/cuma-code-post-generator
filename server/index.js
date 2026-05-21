require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const allowedOrigin = process.env.ALLOWED_ORIGIN;
if (allowedOrigin) {
  app.use(cors({ origin: allowedOrigin }));
} else {
  app.use(cors());
}
app.use(express.json());

app.post('/api/generate-captions', async (req, res) => {
  try {
    const { title, tech, client, desc, template, customPrompt } = req.body;

    if (!customPrompt && !title && !desc) {
      return res.status(400).json({ error: 'Isi prompt custom atau data konten dulu.' });
    }

    const prompt = customPrompt && customPrompt.trim()
      ? buildCustomPrompt(customPrompt)
      : buildPrompt({ title, tech, client, desc, template });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Kamu adalah social media copywriter profesional yang jago bikin caption Instagram/LinkedIn/Twitter untuk developer dan tech startup. Kamu menulis dalam bahasa Indonesia santai tapi smart, campur English dikit buat tech terms. Setiap caption harus engaging, ada emoji, dan siap copy-paste. Target audiens: developer, founder startup, tech enthusiast Indonesia.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 700,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const captions = parseCaptions(raw);

    res.json({ captions });
  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ error: 'Gagal generate caption. Coba lagi nanti.' });
  }
});

function buildPrompt({ title, tech, client, desc, template }) {
  const isProject = template === 'project';
  const context = [
    isProject && title && `Judul Project: ${title}`,
    isProject && tech && `Tech Stack: ${tech}`,
    isProject && client && `Klien: ${client}`,
    desc && `Deskripsi: ${desc}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `Buat 4 caption social media yang berbeda gaya untuk konten berikut. Format: tiap caption dipisahkan dengan "---" (tiga strip). JANGAN kasih nomor. JANGAN kasih label. Langsung caption-nya aja.

${context}

Buat caption dengan tone berbeda-beda:
1. Casual / santai kayak ngobrol
2. Professional / showcase portofolio
3. Short punchy (1-2 kalimat aja)
4. Storytelling (cerita singkat di balik project)

Rules:
- Pakai bahasa Indonesia, English cuma buat tech terms
- Kasih 1-2 emoji yang relevan di setiap caption  
- Sisipkan hashtag #CumaCode atau #BuildInPublic kalau cocok
- Jangan terlalu panjang, max 3-4 kalimat per caption
- JANGAN pakai tanda petik (") di dalam caption, ganti ke petik satu (')`;
}

function parseCaptions(raw) {
  return raw
    .split('---')
    .map((c) => c.trim())
    .filter((c) => c.length > 10)
    .slice(0, 5);
}

function buildCustomPrompt(userPrompt) {
  return `Buat 4 caption social media yang berbeda gaya sesuai permintaan user berikut. Format: tiap caption dipisahkan dengan "---" (tiga strip). JANGAN kasih nomor. JANGAN kasih label. Langsung caption-nya aja.

User minta: ${userPrompt}

Buat caption dengan tone berbeda-beda:
1. Casual / santai kayak ngobrol
2. Professional / formal
3. Short punchy (1-2 kalimat aja)
4. Storytelling / naratif

Rules:
- Pakai bahasa Indonesia, English cuma buat tech terms
- Kasih 1-2 emoji yang relevan di setiap caption
- Sisipkan hashtag yang sesuai dengan konteks (jangan dipaksa)
- Jangan terlalu panjang, max 3-4 kalimat per caption
- JANGAN pakai tanda petik (") di dalam caption, ganti ke petik satu (')`;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CumaCode Caption API running on port ${PORT}`);
});
