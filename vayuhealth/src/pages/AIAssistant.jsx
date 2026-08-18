import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { getAqiByCity } from '../api/aqi';
import { getAllDiseases, getDiseasesByTransmission } from '../api/diseases';
import { getConsolidatedDashboardData } from '../api/health';
import { normalizeAqiRecord, getAqiBand } from '../utils/aqi';
import { normalizeDiseaseList } from '../utils/disease';

const SUGGESTIONS = [
  "What's the air quality like right now?",
  'Is it safe to go for a run today?',
  'What diseases should I worry about with this air quality?',
  'Give me tips to protect my lungs today.',
];

function buildIntro(name) {
  return {
    role: 'assistant',
    text: `Hi ${name || 'there'}! I'm your VayuHealth assistant. Ask me about current air quality, safety recommendations, or air-quality-linked health risks, and I'll pull live data to answer.`,
  };
}

async function answer(question, city) {
  const q = question.toLowerCase();
  const aqiRaw = await getAqiByCity(city).catch(() => null);
  const record = normalizeAqiRecord(aqiRaw);
  const band = record ? getAqiBand(record.aqi) : null;

  if (!record) {
    return `I couldn't fetch live AQI data for ${city} right now — double check the API server on port 8081 is running and reachable.`;
  }

  if (q.includes('run') || q.includes('exercise') || q.includes('outdoor') || q.includes('safe')) {
    if (record.aqi <= 50) {
      return `Yes — with an AQI of ${record.aqi} (${band.label}) in ${city}, it's a great day for outdoor activity. PM2.5 is ${record.pm25} µg/m³, well within a safe range.`;
    }
    if (record.aqi <= 100) {
      return `It's mostly fine. AQI in ${city} is ${record.aqi} (${band.label}) — unusually sensitive people should consider shortening intense outdoor workouts, but most people are okay.`;
    }
    return `I'd hold off on strenuous outdoor exercise. AQI in ${city} is ${record.aqi} (${band.label}), with PM2.5 at ${record.pm25} µg/m³. Try an indoor workout today.`;
  }

  if (q.includes('disease') || q.includes('risk') || q.includes('health') || q.includes('worry')) {
    const airborne = await getDiseasesByTransmission('Airborne').catch(() => null);
    const list = normalizeDiseaseList(airborne).slice(0, 4);
    if (list.length) {
      const names = list.map((d) => d.name).join(', ');
      return `With current AQI at ${record.aqi} (${band.label}) in ${city}, airborne conditions worth being aware of include: ${names}. I'd focus on respiratory protection if your levels trend toward "Poor" or worse.`;
    }
    return `Current AQI in ${city} is ${record.aqi} (${band.label}). At this level, general respiratory precaution is ${record.aqi > 100 ? 'recommended' : 'optional for most people'}.`;
  }

  if (q.includes('tip') || q.includes('protect') || q.includes('mask')) {
    const tips = [];
    if (record.pm25 > 35) tips.push('wear an N95 mask outdoors');
    if (record.o3 > 70) tips.push('avoid outdoor activity during afternoon ozone peaks');
    if (record.aqi > 100) tips.push('keep windows closed and run an air purifier indoors');
    if (!tips.length) tips.push('air quality is good — no special precautions needed today');
    return `Here's what I'd suggest for ${city} right now: ${tips.join('; ')}.`;
  }

  return `Right now in ${city}: AQI is ${record.aqi} (${band.label}), PM2.5 is ${record.pm25} µg/m³, PM10 is ${record.pm10} µg/m³, and O₃ is ${record.o3} ppb. Ask me about safety for exercise, health risks, or protective tips for more specific guidance.`;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const city = user?.city || user?.district || 'San Francisco';
  const [messages, setMessages] = useState([buildIntro(user?.name)]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Warm the consolidated dashboard endpoint once, matching the Health Controller's
  // "dashboard-data" contract even though this screen mainly relies on AQI + diseases.
  useEffect(() => {
    if (user?.email) getConsolidatedDashboardData(user.email, user.district || city).catch(() => {});
  }, [user?.email, user?.district, city]);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await answer(question, city);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `I ran into an error: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="AI Assistant" subtitle={`Live air-quality guidance for ${city}, grounded in your API data.`}>
      <Card className="chat-card">
        <div className="chat-card__messages scrollbar-thin">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
              <div className="chat-bubble__icon">{m.role === 'assistant' ? <Bot size={15} /> : <UserIcon size={15} />}</div>
              <div className="chat-bubble__text">{m.text}</div>
            </div>
          ))}
          {busy && (
            <div className="chat-bubble chat-bubble--assistant">
              <div className="chat-bubble__icon"><Bot size={15} /></div>
              <div className="chat-bubble__text chat-bubble__text--typing">Analyzing live data...</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="chat-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chat-suggestion" onClick={() => send(s)} disabled={busy}>
              <Sparkles size={12} /> {s}
            </button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about air quality, health risk, or safety tips..."
          />
          <button type="submit" className="btn btn--primary" disabled={busy || !input.trim()}>
            <Send size={15} />
          </button>
        </form>
      </Card>
    </Layout>
  );
}
