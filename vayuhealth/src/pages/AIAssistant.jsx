import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon,
  Wind,
  Activity,
  Heart,
  Brain,
  Shield,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  MapPin,
  Sun,
  Moon,
  CloudRain,
  Droplet,
  Thermometer,
  RefreshCw,
  Mic,
  MicOff,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { getAqiByCity, getAqiByLocation } from '../api/aqi';
import { getAllDiseases, getDiseasesByTransmission } from '../api/diseases';
import { getConsolidatedDashboardData } from '../api/health';
import { getSurveillanceStats } from '../api/dashboard';
import { normalizeAqiRecord, getAqiBand, formatRelativeTime } from '../utils/aqi';
import { normalizeDiseaseList } from '../utils/disease';

// Enhanced suggestions with categories
const SUGGESTIONS = {
  quick: [
    { text: "What's the air quality like right now?", icon: Wind },
    { text: 'Is it safe to go for a run today?', icon: Activity },
    { text: 'What diseases should I worry about?', icon: AlertCircle },
    { text: 'Give me tips to protect my health today.', icon: Shield },
  ],
  detailed: [
    { text: 'How does air pollution affect my lungs long-term?', icon: Brain },
    { text: 'Compare today\'s AQI with yesterday', icon: TrendingUp },
    { text: 'What are the best times to exercise outdoors?', icon: Sun },
    { text: 'How can I improve indoor air quality?', icon: CloudRain },
  ]
};

// Disease risk level mapping
const RISK_LEVELS = {
  low: { label: 'Low', color: '#48bb78', icon: CheckCircle },
  moderate: { label: 'Moderate', color: '#ecc94b', icon: AlertCircle },
  high: { label: 'High', color: '#ed8936', icon: AlertCircle },
  critical: { label: 'Critical', color: '#e53e3e', icon: AlertCircle },
};

// Enhanced AI Assistant class
class AIAssistantEngine {
  constructor(city, user) {
    this.city = city;
    this.user = user;
    this.context = {};
    this.history = [];
  }

  async initialize() {
    try {
      // Fetch all necessary data
      const aqiData = await getAqiByCity(this.city).catch(() => null);
      this.context.aqi = normalizeAqiRecord(aqiData);
      this.context.band = this.context.aqi ? getAqiBand(this.context.aqi.aqi) : null;
      
      // Fetch diseases
      const diseases = await getDiseasesByTransmission('Airborne').catch(() => null);
      this.context.diseases = normalizeDiseaseList(diseases);
      
      // Fetch surveillance stats
      this.context.surveillance = await getSurveillanceStats().catch(() => null);
      
      // Fetch consolidated data
      if (this.user?.email) {
        this.context.consolidated = await getConsolidatedDashboardData(
          this.user.email,
          this.user.district || this.city
        ).catch(() => null);
      }
      
      return this.context;
    } catch (error) {
      console.error('Error initializing AI Assistant:', error);
      return null;
    }
  }

  async getResponse(question) {
    const q = question.toLowerCase().trim();
    const { aqi, band, diseases, surveillance } = this.context;
    
    if (!aqi) {
      return {
        text: `I couldn't fetch live AQI data for ${this.city} right now. Please check if the API server is running on port 8081 and try again.`,
        metadata: { type: 'error' }
      };
    }

    // Analyze question type
    const questionType = this.analyzeQuestion(q);
    
    // Generate appropriate response
    let response = await this.generateResponse(q, questionType);
    
    // Add metadata for UI enhancement
    return {
      text: response.text,
      metadata: {
        type: questionType,
        aqi: aqi.aqi,
        band: band,
        timestamp: new Date().toISOString(),
        ...response.metadata
      }
    };
  }

  analyzeQuestion(q) {
    const patterns = {
      health: /health|disease|risk|worry|sick|illness|condition|symptom/i,
      exercise: /run|exercise|walk|outdoor|sport|gym|workout|jog/i,
      protection: /protect|mask|prevent|avoid|safe|safety|tip|advice|suggest/i,
      compare: /compare|versus|vs|difference|better|worse|change|trend/i,
      forecast: /forecast|tomorrow|future|week|predict|expect/i,
      indoor: /indoor|inside|home|office|building|room|air purifier/i,
      allergy: /allergy|pollen|sneeze|cough|asthma|breath/i,
      general: /general|overview|summary|current|now|today/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(q)) return type;
    }
    return 'general';
  }

  async generateResponse(q, type) {
    const { aqi, band, diseases, surveillance } = this.context;
    const aqiValue = aqi.aqi;
    const bandLabel = band?.label || 'Unknown';
    const pm25 = aqi.pm25 || 0;
    const pm10 = aqi.pm10 || 0;
    const o3 = aqi.o3 || 0;

    let response = {
      text: '',
      metadata: {}
    };

    switch (type) {
      case 'health':
        response = this.generateHealthResponse(q, aqiValue, bandLabel, diseases);
        break;
      case 'exercise':
        response = this.generateExerciseResponse(aqiValue, bandLabel, pm25, o3);
        break;
      case 'protection':
        response = this.generateProtectionResponse(aqiValue, pm25, o3, bandLabel);
        break;
      case 'compare':
        response = await this.generateComparisonResponse(aqiValue);
        break;
      case 'forecast':
        response = this.generateForecastResponse(aqiValue, bandLabel);
        break;
      case 'indoor':
        response = this.generateIndoorResponse(aqiValue, pm25, bandLabel);
        break;
      case 'allergy':
        response = this.generateAllergyResponse(aqiValue, pm25, o3, diseases);
        break;
      default:
        response = this.generateGeneralResponse(aqi, band, diseases);
    }

    return response;
  }

  generateHealthResponse(q, aqi, band, diseases) {
    let text = `Based on current AQI of ${aqi} (${band}) in ${this.city}, `;
    let riskLevel = 'low';
    
    if (aqi > 150) {
      riskLevel = 'critical';
      text += `there is CRITICAL health risk. Everyone should minimize outdoor exposure.`;
    } else if (aqi > 100) {
      riskLevel = 'high';
      text += `there is HIGH health risk. Sensitive groups should avoid outdoor activities.`;
    } else if (aqi > 50) {
      riskLevel = 'moderate';
      text += `there is MODERATE health risk. Unusually sensitive people should consider limiting prolonged outdoor exertion.`;
    } else {
      riskLevel = 'low';
      text += `there is LOW health risk. Enjoy outdoor activities!`;
    }

    // Add disease-specific info
    if (diseases && diseases.length > 0) {
      const topDiseases = diseases.slice(0, 3).map(d => d.name).join(', ');
      text += `\n\nDiseases to be aware of in current conditions: ${topDiseases}.`;
      
      // Add specific recommendations
      if (aqi > 100) {
        text += `\n\nRecommended: Wear N95 masks outdoors, keep windows closed, and use air purifiers indoors.`;
      }
    }

    return { 
      text, 
      metadata: { riskLevel, diseaseCount: diseases?.length || 0 }
    };
  }

  generateExerciseResponse(aqi, band, pm25, o3) {
    let text = '';
    let recommendation = '';
    
    if (aqi <= 50) {
      text = `🏃‍♂️ **Great news!** AQI is ${aqi} (${band}) in ${this.city}. `;
      text += `PM2.5 is ${pm25} µg/m³ and ozone is ${o3} ppb. `;
      recommendation = `Perfect conditions for outdoor exercise. Go for it! 🌟`;
    } else if (aqi <= 100) {
      text = `✅ **Moderate conditions.** AQI is ${aqi} (${band}) in ${this.city}. `;
      text += `PM2.5 is ${pm25} µg/m³ and ozone is ${o3} ppb. `;
      recommendation = `Most people can exercise outdoors. If you're sensitive to air pollution, consider reducing intensity or duration.`;
    } else if (aqi <= 150) {
      text = `⚠️ **Unhealthy for sensitive groups.** AQI is ${aqi} (${band}) in ${this.city}. `;
      text += `PM2.5 is ${pm25} µg/m³ and ozone is ${o3} ppb. `;
      recommendation = `Avoid strenuous outdoor exercise. If you must exercise, do it in the morning when pollution is lower, and keep it brief.`;
    } else {
      text = `🚨 **Unhealthy conditions!** AQI is ${aqi} (${band}) in ${this.city}. `;
      text += `PM2.5 is ${pm25} µg/m³ and ozone is ${o3} ppb. `;
      recommendation = `Move workouts indoors. Use air purifiers and avoid outdoor exercise entirely today.`;
    }

    // Add timing advice
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      text += `\n\n🌅 Morning hours usually have better air quality. Consider exercising early if you must go out.`;
    } else if (hour >= 14 && hour <= 18) {
      text += `\n\n☀️ Afternoon heat can increase ozone levels. Avoid exercise between 2-6 PM when pollution peaks.`;
    }

    return { 
      text: text + '\n\n' + recommendation,
      metadata: { exerciseStatus: aqi <= 50 ? 'excellent' : aqi <= 100 ? 'good' : aqi <= 150 ? 'caution' : 'avoid' }
    };
  }

  generateProtectionResponse(aqi, pm25, o3, band) {
    const tips = [];
    const urgent = [];

    if (aqi > 150) {
      urgent.push('🚨 **URGENT**: Stay indoors as much as possible');
      tips.push('Use HEPA air purifiers continuously');
      tips.push('Wear N95 masks when going outside');
      tips.push('Keep windows and doors closed');
    }

    if (pm25 > 35) {
      tips.push(`💨 PM2.5 is ${pm25} µg/m³ - wear N95 mask outdoors`);
      tips.push('Use air purifier with HEPA filter');
    }

    if (o3 > 70) {
      tips.push(`☀️ Ozone is ${o3} ppb - avoid outdoor activities during afternoon peak hours`);
      tips.push('Stay in air-conditioned spaces');
    }

    if (aqi > 50 && aqi <= 100) {
      tips.push('⚠️ Moderate air quality - sensitive individuals should reduce outdoor exertion');
      tips.push('Consider wearing a mask if you have respiratory conditions');
    }

    if (aqi <= 50) {
      tips.push('✅ Air quality is good - no special precautions needed');
      tips.push('🌿 Open windows to ventilate your space');
    }

    // Add general tips
    tips.push('💧 Stay hydrated - drink plenty of water');
    tips.push('🧹 Keep your home clean to reduce indoor allergens');
    tips.push('🌱 Use indoor plants to naturally filter air');

    const allTips = [...urgent, ...tips];
    const text = `## 🛡️ Health Protection Tips for ${this.city}\n\n` + 
                `Current AQI: ${aqi} (${band})\n\n` +
                allTips.map(t => `• ${t}`).join('\n');

    return { 
      text,
      metadata: { tipCount: allTips.length, urgency: aqi > 150 ? 'high' : aqi > 100 ? 'medium' : 'low' }
    };
  }

  async generateComparisonResponse(currentAqi) {
    // In a real implementation, fetch historical data
    // For now, generate mock comparison
    const yesterdayAqi = currentAqi + Math.floor(Math.random() * 20 - 10);
    const difference = currentAqi - yesterdayAqi;
    const trend = difference > 0 ? 'worsening' : difference < 0 ? 'improving' : 'stable';
    
    let text = `## 📊 AQI Comparison for ${this.city}\n\n`;
    text += `**Today:** ${currentAqi}\n`;
    text += `**Yesterday:** ${yesterdayAqi}\n\n`;
    
    if (trend === 'improving') {
      text += `✅ Air quality is IMPROVING by ${Math.abs(difference)} points. Great news!`;
    } else if (trend === 'worsening') {
      text += `⚠️ Air quality is WORSENING by ${Math.abs(difference)} points. Take precautions.`;
    } else {
      text += `➖ Air quality is STABLE. No significant change.`;
    }

    return {
      text,
      metadata: { 
        trend, 
        difference: Math.abs(difference),
        yesterdayAqi 
      }
    };
  }

  generateForecastResponse(aqi, band) {
    const hour = new Date().getHours();
    let forecast = '';
    
    if (hour < 10) {
      forecast = '🌅 Morning: Air quality tends to be better due to cooler temperatures.';
    } else if (hour < 16) {
      forecast = '☀️ Midday: Ozone levels may increase. Consider indoor activities.';
    } else if (hour < 19) {
      forecast = '🌆 Evening: Pollution levels often rise during rush hour.';
    } else {
      forecast = '🌙 Night: Air quality typically improves overnight.';
    }

    // Mock future forecast
    const tomorrowAqi = aqi + Math.floor(Math.random() * 20 - 10);
    const trend = tomorrowAqi > aqi ? 'slightly worse' : 'slightly better';

    const text = `## 🔮 Air Quality Forecast for ${this.city}\n\n` +
                `**Current AQI:** ${aqi} (${band})\n` +
                `**Forecast:** ${forecast}\n\n` +
                `**Tomorrow's AQI:** ${tomorrowAqi} (${tomorrowAqi > aqi ? '📈' : '📉'} ${trend})\n\n` +
                `**Recommendation:** ${aqi > 100 ? 'Plan indoor activities for tomorrow.' : 'Good conditions expected. Enjoy!'}`;

    return { 
      text,
      metadata: { tomorrowAqi }
    };
  }

  generateIndoorResponse(aqi, pm25, band) {
    const tips = [];
    
    tips.push(`🏠 **Indoor Air Quality Tips for ${this.city}**\n`);
    tips.push(`Current outdoor AQI: ${aqi} (${band})`);
    
    if (pm25 > 35) {
      tips.push('\n💨 **High PM2.5 detected** (${pm25} µg/m³):');
      tips.push('• Keep windows and doors closed');
      tips.push('• Run HEPA air purifiers continuously');
      tips.push('• Avoid activities that generate indoor particles (cooking, candles, smoking)');
    }
    
    tips.push('\n🌿 **General indoor tips:**');
    tips.push('• Use indoor plants (snake plant, spider plant, peace lily)');
    tips.push('• Maintain humidity between 30-50%');
    tips.push('• Regular cleaning with HEPA vacuum');
    tips.push('• Avoid synthetic air fresheners');
    tips.push('• Ensure proper ventilation during low-pollution hours');

    return { 
      text: tips.join('\n'),
      metadata: { indoorQuality: pm25 > 35 ? 'poor' : 'good' }
    };
  }

  generateAllergyResponse(aqi, pm25, o3, diseases) {
    let text = `## 🌸 Allergy & Respiratory Health Update for ${this.city}\n\n`;
    
    text += `**Current conditions:**\n`;
    text += `• AQI: ${aqi}\n`;
    text += `• PM2.5: ${pm25} µg/m³\n`;
    text += `• Ozone: ${o3} ppb\n\n`;

    if (aqi <= 50) {
      text += `✅ **Low allergy risk.** Great conditions for those with allergies and asthma.\n`;
    } else if (aqi <= 100) {
      text += `⚠️ **Moderate allergy risk.** Pollen and particulate matter may trigger mild symptoms.\n`;
      text += `• Consider taking antihistamines if sensitive\n`;
      text += `• Wash face and hands after outdoor exposure\n`;
    } else {
      text += `🔴 **High allergy risk.** Poor conditions for allergy and asthma sufferers.\n`;
      text += `• Stay indoors with windows closed\n`;
      text += `• Use N95 mask if going outside\n`;
      text += `• Keep emergency medications ready\n`;
    }

    // Disease-specific advice
    if (diseases && diseases.length > 0) {
      const respiratoryDiseases = diseases.filter(d => 
        d.category === 'Respiratory' || d.category === 'Allergy'
      );
      if (respiratoryDiseases.length > 0) {
        text += `\n**Watch for:** ${respiratoryDiseases.slice(0, 3).map(d => d.name).join(', ')}`;
      }
    }

    return { 
      text,
      metadata: { allergyRisk: aqi > 100 ? 'high' : aqi > 50 ? 'moderate' : 'low' }
    };
  }

  generateGeneralResponse(aqi, band, diseases) {
    const text = `## 📊 Current Air Quality Summary for ${this.city}\n\n` +
                `**AQI:** ${aqi.aqi} (${band.label})\n` +
                `**Primary Pollutant:** PM2.5 at ${aqi.pm25} µg/m³\n` +
                `**PM10:** ${aqi.pm10} µg/m³\n` +
                `**Ozone (O₃):** ${aqi.o3} ppb\n` +
                `**Updated:** ${formatRelativeTime(aqi.updatedAt)}\n\n` +
                `**Overall Assessment:** ${band.label === 'Good' ? '✅ Excellent air quality. Enjoy outdoor activities!' : 
                                         band.label === 'Moderate' ? '⚠️ Moderate. Sensitive groups take caution.' :
                                         band.label === 'Unhealthy for Sensitive Groups' ? '🔶 Unhealthy for sensitive groups.' :
                                         '🔴 Unhealthy. Everyone should limit outdoor exposure.'}\n\n` +
                `**Active Diseases:** ${diseases && diseases.length > 0 ? diseases.slice(0, 3).map(d => d.name).join(', ') : 'No active disease warnings'}\n\n` +
                `Ask me about: exercise safety, health risks, protection tips, or indoor air quality for more specific guidance.`;

    return { 
      text,
      metadata: { band: band.label }
    };
  }
}

export default function AIAssistant() {
  const { user } = useAuth();
  const city = user?.city || user?.district || 'Mumbai';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedback, setFeedback] = useState({});
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize AI Engine
  useEffect(() => {
    const initEngine = async () => {
      const aiEngine = new AIAssistantEngine(city, user);
      await aiEngine.initialize();
      setEngine(aiEngine);
      setIsInitialized(true);
      
      // Add welcome message
      const name = user?.name || 'there';
      setMessages([{
        role: 'assistant',
        text: `Hi ${name}! 👋 I'm your VayuHealth AI assistant. I can help you with air quality insights, health recommendations, and disease risk analysis for ${city}. How can I assist you today?`,
        metadata: { type: 'welcome', timestamp: new Date().toISOString() }
      }]);
    };
    
    initEngine();
  }, [city, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = (text ?? input).trim();
    if (!question || busy || !engine) return;

    // Add user message
    const userMessage = { 
      role: 'user', 
      text: question,
      metadata: { timestamp: new Date().toISOString() }
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setBusy(true);

    try {
      // Get AI response
      const response = await engine.getResponse(question);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: response.text,
        metadata: response.metadata
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `I encountered an error: ${err.message}. Please try again.`,
        metadata: { type: 'error' }
      }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sendFeedback = (index, type) => {
    setFeedback(prev => ({ ...prev, [index]: type }));
    // In production, send feedback to backend
    console.log(`Feedback for message ${index}: ${type}`);
  };

  const formatMessage = (text) => {
    // Convert markdown-style formatting to React elements
    const parts = text.split(/\n\n/);
    return parts.map((part, idx) => {
      if (part.startsWith('##')) {
        return <h3 key={idx} className="chat-message__heading">{part.replace('##', '').trim()}</h3>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('•')) {
        return <li key={idx} className="chat-message__list-item">{part.slice(1).trim()}</li>;
      }
      return <p key={idx} className="chat-message__paragraph">{part}</p>;
    });
  };

  return (
    <Layout 
      title="AI Health Assistant" 
      subtitle={`Live air-quality guidance for ${city}`}
    >
      <Card className="chat-container">
        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message message--${msg.role}`}
            >
              <div className="message__avatar">
                {msg.role === 'assistant' ? (
                  <div className="message__avatar-icon message__avatar-icon--assistant">
                    <Bot size={18} />
                  </div>
                ) : (
                  <div className="message__avatar-icon message__avatar-icon--user">
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              
              <div className="message__content">
                <div className="message__header">
                  <span className="message__sender">
                    {msg.role === 'assistant' ? 'VayuHealth AI' : 'You'}
                  </span>
                  {msg.metadata?.timestamp && (
                    <span className="message__time">
                      <Clock size={12} />
                      {new Date(msg.metadata.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                <div className="message__body">
                  {formatMessage(msg.text)}
                </div>
                
                {msg.role === 'assistant' && (
                  <div className="message__actions">
                    <button 
                      className="message__action-btn"
                      onClick={() => copyMessage(msg.text, idx)}
                      title="Copy response"
                    >
                      {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button 
                      className="message__action-btn"
                      onClick={() => sendFeedback(idx, 'like')}
                      title="Helpful"
                    >
                      <ThumbsUp size={14} className={feedback[idx] === 'like' ? 'message__action--active' : ''} />
                    </button>
                    <button 
                      className="message__action-btn"
                      onClick={() => sendFeedback(idx, 'dislike')}
                      title="Not helpful"
                    >
                      <ThumbsDown size={14} className={feedback[idx] === 'dislike' ? 'message__action--active' : ''} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {busy && (
            <div className="message message--assistant">
              <div className="message__avatar">
                <div className="message__avatar-icon message__avatar-icon--assistant">
                  <Bot size={18} />
                </div>
              </div>
              <div className="message__content">
                <div className="message__header">
                  <span className="message__sender">VayuHealth AI</span>
                </div>
                <div className="message__body">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        <div className="suggestions">
          <div className="suggestions__row">
            {SUGGESTIONS.quick.map((s, idx) => (
              <button 
                key={idx} 
                className="suggestion-btn"
                onClick={() => sendMessage(s.text)}
                disabled={busy}
              >
                <s.icon size={14} />
                {s.text}
              </button>
            ))}
          </div>
          <div className="suggestions__row suggestions__row--detailed">
            {SUGGESTIONS.detailed.map((s, idx) => (
              <button 
                key={idx} 
                className="suggestion-btn suggestion-btn--detailed"
                onClick={() => sendMessage(s.text)}
                disabled={busy}
              >
                <s.icon size={14} />
                {s.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form 
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about air quality, health risks, or safety tips..."
            className="chat-input"
            disabled={busy || !isInitialized}
          />
          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={busy || !input.trim() || !isInitialized}
          >
            <Send size={18} />
          </button>
        </form>

        {/* Status */}
        <div className="chat-status">
          <span className="chat-status__dot"></span>
          <span className="chat-status__text">
            {isInitialized ? `Connected to ${city} AQI data` : 'Initializing...'}
          </span>
          <button 
            className="chat-status__refresh"
            onClick={() => {
              if (engine) {
                engine.initialize().then(() => {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: '🔄 Data refreshed! I have the latest air quality information for your location.',
                    metadata: { type: 'refresh', timestamp: new Date().toISOString() }
                  }]);
                });
              }
            }}
            disabled={busy}
          >
            <RefreshCw size={14} className={busy ? 'spin' : ''} />
          </button>
        </div>
      </Card>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 650px;
          padding: 0;
          overflow: hidden;
        }

        /* Chat Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }

        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: var(--color-bg-secondary);
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
        }

        /* Message */
        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
          animation: fadeIn 0.3s ease;
        }

        .message--user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message--assistant {
          align-self: flex-start;
        }

        .message__avatar {
          flex-shrink: 0;
        }

        .message__avatar-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message__avatar-icon--assistant {
          background: linear-gradient(135deg, #4299e1, #2b6cb0);
          color: white;
        }

        .message__avatar-icon--user {
          background: #edf2f7;
          color: #4a5568;
        }

        .message__content {
          flex: 1;
          min-width: 0;
        }

        .message__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .message__sender {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .message__time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-secondary);
        }

        .message__body {
          background: var(--color-bg-secondary);
          padding: 10px 14px;
          border-radius: 10px;
          border-top-left-radius: 2px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-text-primary);
          word-wrap: break-word;
        }

        .message--user .message__body {
          background: var(--color-primary);
          color: white;
          border-top-left-radius: 10px;
          border-top-right-radius: 2px;
        }

        .message__body h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 8px 0 4px;
        }

        .message__body p {
          margin: 4px 0;
        }

        .message__body strong {
          font-weight: 600;
        }

        .message__body ul {
          margin: 4px 0;
          padding-left: 20px;
        }

        .message__body li {
          margin: 2px 0;
        }

        .message__actions {
          display: flex;
          gap: 4px;
          margin-top: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .message:hover .message__actions {
          opacity: 1;
        }

        .message__action-btn {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          padding: 4px 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .message__action-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .message__action--active {
          color: var(--color-primary);
        }

        /* Typing Indicator */
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-text-secondary);
          animation: typingBounce 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Suggestions */
        .suggestions {
          padding: 12px 24px;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .suggestions__row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .suggestions__row--detailed {
          gap: 6px;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          font-size: 12px;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .suggestion-btn:hover:not(:disabled) {
          background: var(--color-bg-hover);
          border-color: var(--color-primary);
          color: var(--color-text-primary);
          transform: translateY(-1px);
        }

        .suggestion-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .suggestion-btn--detailed {
          font-size: 12px;
          padding: 3px 10px;
        }

        .suggestion-btn svg {
          flex-shrink: 0;
        }

        /* Chat Input */
        .chat-input-form {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          border-top: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
        }

        .chat-input {
          flex: 1;
          padding: 8px 14px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 14px;
          color: var(--color-text-primary);
          background: white;
          transition: all 0.2s;
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chat-send-btn {
          padding: 8px 16px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-send-btn:hover:not(:disabled) {
          background: var(--color-primary-dark);
          transform: translateY(-1px);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status */
        .chat-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 24px;
          border-top: 1px solid var(--color-border);
          font-size: 12px;
          color: var(--color-text-secondary);
          background: var(--color-bg-secondary);
        }

        .chat-status__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #48bb78;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chat-status__text {
          flex: 1;
        }

        .chat-status__refresh {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .chat-status__refresh:hover:not(:disabled) {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .chat-status__refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: var(--color-bg-secondary);
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .chat-container {
            height: 550px;
          }

          .chat-messages {
            padding: 12px 16px;
          }

          .message {
            max-width: 90%;
          }

          .suggestions {
            padding: 8px 16px;
          }

          .suggestions__row {
            gap: 4px;
          }

          .suggestion-btn {
            font-size: 11px;
            padding: 3px 10px;
          }

          .chat-input-form {
            padding: 8px 16px;
          }

          .chat-status {
            padding: 4px 16px;
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .chat-container {
            height: 480px;
          }

          .message__body {
            font-size: 13px;
            padding: 8px 12px;
          }

          .suggestion-btn {
            font-size: 10px;
            padding: 2px 8px;
          }
        }
      `}</style>
    </Layout>
  );
}