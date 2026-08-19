import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  Activity,
  AlertCircle,
  Shield,
  Heart,
  Brain,
  Eye,
  Wind,
  Droplet,
  Thermometer,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Disease progression data
const DISEASE_PROGRESSION_DATA = {
  'asthma': {
    id: 'asthma',
    name: 'Asthma & COPD Exacerbation',
    category: 'Airborne',
    severity: 'HIGH FUTURE RISK',
    targetOrgan: 'Pulmonary Bronchioles & Lung Parenchyma',
    color: '#00f2fe',
    stages: [
      {
        stage: 0,
        title: 'Stage 0 (Present Baseline): Bronchial Hyper-reactivity',
        description: 'Initial particulate accumulation causes mild smooth muscle contraction and transient nocturnal wheezing.',
        occlusionPct: 15,
        fibrosisPct: 8,
        strainPct: 12,
        narration: 'At present baseline, airborne pollutants irritate bronchial smooth muscle, triggering periodic airway hyper-reactivity.'
      },
      {
        stage: 1,
        title: 'Stage 1 (1-Year Horizon): Mucosal Remodeling & Goblet Cell Hyperplasia',
        description: 'Persistent inflammatory cell infiltration leads to mucus hypersecretion and chronic expiratory airflow limitation.',
        occlusionPct: 38,
        fibrosisPct: 24,
        strainPct: 28,
        narration: 'At one year, constant particulate deposition thickens bronchial walls, causing progressive expiratory wheezing.'
      },
      {
        stage: 2,
        title: 'Stage 2 (5-Year Horizon): Alveolar Wall Destruction & Emphysema',
        description: 'Permanent destruction of inter-alveolar septa reduces gas exchange surface area, causing dyspnea on mild exertion.',
        occlusionPct: 65,
        fibrosisPct: 58,
        strainPct: 54,
        narration: 'Five years post-exposure, emphysematous tissue breakdown permanently impairs blood oxygenation.'
      },
      {
        stage: 3,
        title: 'Stage 3 (10-Year Horizon): Chronic Cor Pulmonale & Fibrotic Occlusion',
        description: 'Severe pulmonary vascular resistance forces right ventricular hypertrophy, leading to chronic cardiopulmonary failure.',
        occlusionPct: 88,
        fibrosisPct: 84,
        strainPct: 82,
        narration: 'At ten years, extensive pulmonary fibrosis increases right heart strain, requiring long-term supplemental oxygen.'
      }
    ],
    prevention: 'Daily N95 protection during high AQI + Vasaka (Adhatoda) & Sitopaladi Churna halts bronchial fibrotic remodeling.'
  },
  'tuberculosis': {
    id: 'tuberculosis',
    name: 'Tuberculosis & Chronic Lung Lesions',
    category: 'Airborne',
    severity: 'CRITICAL TISSUE NECROSIS RISK',
    targetOrgan: 'Apical Lung Parenchyma & Pulmonary Lymph Nodes',
    color: '#ff3d00',
    stages: [
      {
        stage: 0,
        title: 'Stage 0 (Present Baseline): Primary Ghon Focus',
        description: 'Inhaled Mycobacterium tuberculosis droplets settle in subpleural alveoli, triggering localized alveolar macrophage engulfment.',
        occlusionPct: 20,
        fibrosisPct: 15,
        strainPct: 10,
        narration: 'Inhaled Mycobacteria settle in apical lung segments, triggering early immune granuloma formation.'
      },
      {
        stage: 1,
        title: 'Stage 1 (1-Year Horizon): Caseous Necrosis & Cavitation',
        description: 'Granulomas undergo central caseous necrosis. Erosion into bronchial trees causes hemoptysis and bacillary shedding.',
        occlusionPct: 45,
        fibrosisPct: 35,
        strainPct: 32,
        narration: 'At one year, caseous necrosis destroys localized lung parenchyma, forming necrotic cavities.'
      },
      {
        stage: 2,
        title: 'Stage 2 (5-Year Horizon): Fibrocalcific Volume Reduction',
        description: 'Multiple cavitating lesions merge. Scars contract lung volume by 40%, leaving chronic chest pain and restrictive pulmonary defect.',
        occlusionPct: 70,
        fibrosisPct: 68,
        strainPct: 62,
        narration: 'Five years post infection, widespread fibrocalcific scarring contracts entire lung lobes.'
      },
      {
        stage: 3,
        title: 'Stage 3 (10-Year Horizon): Disseminated Fibrothorax',
        description: 'Complete destruction of affected lung lobe (fibrothorax) with hematogenous spread to kidneys and spine.',
        occlusionPct: 92,
        fibrosisPct: 90,
        strainPct: 86,
        narration: 'At ten years, destroyed lung parenchyma undergoes dense fibrotic ossification.'
      }
    ],
    prevention: 'Standard DOTS anti-tubercular therapy combined with Sitopaladi Churna & Chyawanprash regenerates cellular defense.'
  }
};

// Get disease data with fallback
const getDiseaseData = (diseaseName) => {
  if (!diseaseName) return DISEASE_PROGRESSION_DATA['asthma'];
  
  const lowerName = diseaseName.toLowerCase();
  for (const [key, data] of Object.entries(DISEASE_PROGRESSION_DATA)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return data;
    }
  }
  
  // Fallback for unknown diseases
  return {
    id: 'unknown',
    name: diseaseName,
    category: 'Airborne',
    severity: 'ELEVATED FUTURE HAZARD',
    targetOrgan: 'Pulmonary Airways & Alveolar Membranes',
    color: '#b388ff',
    stages: [
      {
        stage: 0,
        title: `Stage 0 (Present Baseline): Early ${diseaseName} Inception`,
        description: `Initial exposure triggers localized cellular inflammation. Mild symptoms present.`,
        occlusionPct: 15,
        fibrosisPct: 8,
        strainPct: 12,
        narration: `Present baseline exposure to ${diseaseName} initiates mild inflammatory cascades.`
      },
      {
        stage: 1,
        title: `Stage 1 (1-Year Horizon): Sub-acute Mucosal Degradation`,
        description: 'Continuous unmitigated exposure accelerates tissue damage and functional impairment.',
        occlusionPct: 40,
        fibrosisPct: 25,
        strainPct: 30,
        narration: `At one year, unmanaged ${diseaseName} causes progressive structural tissue remodeling.`
      },
      {
        stage: 2,
        title: `Stage 2 (5-Year Horizon): Chronic Parenchymal Fibrosis`,
        description: 'Chronic inflammatory cell infiltration leads to irreversible tissue hardening and organ strain.',
        occlusionPct: 65,
        fibrosisPct: 52,
        strainPct: 58,
        narration: `At five years, chronic inflammatory scarring causes persistent organ dysfunction.`
      },
      {
        stage: 3,
        title: `Stage 3 (10-Year Horizon): Advanced Organ Impairment`,
        description: 'Severe end-stage fibrotic changes impair vital organ capacity by >80%.',
        occlusionPct: 88,
        fibrosisPct: 82,
        strainPct: 85,
        narration: `At ten years, advanced tissue fibrotic degradation restricts baseline functional capacity.`
      }
    ],
    prevention: 'Early N95 protection, purified hydration, and targeted herbal therapies halt up to 85% of long-term cellular damage.'
  };
};

// Anatomical Layer Icons
const LAYER_ICONS = {
  skin: '🩸',
  mucosa: '🫁',
  vascular: '🫀'
};

const LAYER_NAMES = {
  skin: 'Skin & Transdermal Layer',
  mucosa: 'Mucosal Epithelium',
  vascular: 'Bloodstream & Organs'
};

export default function DiseaseVideoModal({ 
  isOpen, 
  onClose, 
  diseaseName = 'Asthma & COPD Exacerbation' 
}) {
  const [currentStage, setCurrentStage] = useState(1);
  const [currentLayer, setCurrentLayer] = useState('mucosa');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNarration, setShowNarration] = useState(true);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const speechSynthRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const modalRef = useRef(null);

  const diseaseData = getDiseaseData(diseaseName);
  const stageData = diseaseData.stages[currentStage] || diseaseData.stages[0];

  // Initialize particles
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 640;
    canvas.height = rect.height * 0.6 || 360;

    // Initialize particles
    particlesRef.current = [];
    for (let i = 0; i < 45; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: Math.random() > 0.5 ? '#ff3d00' : '#00f2fe'
      });
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isOpen) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const severityFactor = stageData.occlusionPct / 100;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      if (!canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#060d1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.save();

      // Draw based on selected layer
      if (currentLayer === 'skin') {
        // Transdermal / Skin Layer
        ctx.fillStyle = severityFactor > 0.5 ? '#3a1a16' : '#2b3447';
        ctx.fillRect(40, 60, canvas.width - 80, 50);
        ctx.strokeStyle = '#ff9100';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 60, canvas.width - 80, 50);

        // Particles
        particlesRef.current.forEach((p, idx) => {
          p.y += (1.2 + severityFactor * 1.5);
          if (p.y > canvas.height - 50) p.y = 50;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 1, 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? '#ff3d00' : '#ff9100';
          ctx.fill();
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`TRANSDERMAL VIEW: ${stageData.occlusionPct}% TISSUE IMPAIRMENT`, 50, 45);

      } else if (currentLayer === 'vascular') {
        // Bloodstream
        ctx.fillStyle = '#2b090c';
        ctx.fillRect(40, 50, canvas.width - 80, canvas.height - 100);
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 50, canvas.width - 80, canvas.height - 100);

        particlesRef.current.forEach(p => {
          p.x += (2 + severityFactor * 2);
          if (p.x > canvas.width - 40) p.x = 40;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffea00';
          ctx.fill();
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`BLOODSTREAM & ORGAN TISSUE (${stageData.strainPct}% SYSTEMIC STRAIN)`, 50, 40);

      } else {
        // Respiratory Mucosa (Default)
        const outerRadius = Math.min(canvas.width, canvas.height) * 0.35;
        const innerRadius = Math.max(15, outerRadius * 0.7 * (1 - severityFactor * 0.6));

        // Outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = severityFactor > 0.6 ? '#3b1219' : '#142738';
        ctx.fill();

        // Inner lumen
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#050b14';
        ctx.fill();

        // Draw particles around the airway
        particlesRef.current.forEach(p => {
          const angle = Math.atan2(p.y - centerY, p.x - centerX);
          const radius = outerRadius - 10 + Math.sin(p.x * 0.1) * 20;
          p.x = centerX + Math.cos(angle + 0.01) * radius;
          p.y = centerY + Math.sin(angle + 0.01) * radius;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`AIRWAY LUMEN: ${Math.max(0, 100 - stageData.occlusionPct)}% OPEN`, centerX, centerY + 5);
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, currentLayer, currentStage, stageData]);

  // Progress timer
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 0.5;
          if (newProgress >= 100) {
            // Move to next stage
            setCurrentStage(prevStage => (prevStage + 1) % 4);
            return 0;
          }
          return newProgress;
        });
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Speech synthesis
  const speakNarration = useCallback((text) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Handle stage change
  const handleStageChange = (stageIndex) => {
    setCurrentStage(stageIndex);
    const stage = diseaseData.stages[stageIndex];
    if (isPlaying && stage) {
      speakNarration(stage.narration);
    }
  };

  // Play/Pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const stage = diseaseData.stages[currentStage];
      speakNarration(stage.narration);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div 
        className={`video-modal-content ${isFullscreen ? 'video-modal-content--fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        {/* Header */}
        <div className="video-modal-header">
          <div className="video-modal-header-left">
            <div className="video-modal-icon">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="video-modal-title">
                {diseaseData.name} — Future Deep Impact Video Analysis
              </h3>
              <div className="video-modal-badges">
                <span className="video-badge video-badge--route">
                  {diseaseData.category === 'Airborne' ? '🌬️ Airborne Route' : '💧 Waterborne Route'}
                </span>
                <span className="video-badge video-badge--severity">
                  {diseaseData.severity}
                </span>
                <span className="video-badge video-badge--target">
                  Target Organ: {diseaseData.targetOrgan}
                </span>
              </div>
            </div>
          </div>
          <button className="video-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="video-modal-grid">
          {/* Left Panel - Video */}
          <div className="video-panel">
            <div className="video-canvas-wrapper">
              <canvas ref={canvasRef} className="video-canvas" />
              <div className="video-watermark">VayuHealth AI — Clinical Simulation</div>
              <div className="video-overlay-badge">
                <span>🔴 LIVE SIMULATION</span>
                <span>•</span>
                <span>
                  {currentStage === 0 ? 'STAGE 0 (PRESENT)' : 
                   currentStage === 1 ? '1-YEAR HORIZON' :
                   currentStage === 2 ? '5-YEAR HORIZON' : 
                   '10-YEAR FIBROTIC HORIZON'}
                </span>
              </div>
            </div>

            {/* Layer Controls */}
            <div className="video-layer-controls">
              {Object.entries(LAYER_NAMES).map(([key, name]) => (
                <button
                  key={key}
                  className={`video-layer-btn ${currentLayer === key ? 'video-layer-btn--active' : ''}`}
                  onClick={() => setCurrentLayer(key)}
                >
                  {LAYER_ICONS[key]} {name}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="video-controls">
              <button 
                className="video-control-btn video-control-btn--primary"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                <span>{isPlaying ? 'Pause Video' : 'Play Video'}</span>
              </button>

              <button 
                className="video-control-btn video-control-btn--voice"
                onClick={() => {
                  const stage = diseaseData.stages[currentStage];
                  if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  } else {
                    speakNarration(stage.narration);
                  }
                }}
              >
                {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen Audio'}</span>
              </button>

              <div className="video-progress">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="video-progress-bar"
                />
                <span className="video-time">
                  {Math.floor(progress / 100 * 150)}s / 150s
                </span>
              </div>
            </div>

            {/* Narration */}
            {showNarration && (
              <div className="video-narration">
                <span className="video-narration-icon">🎙️</span>
                <strong>Clinical Audio Narration:</strong>
                <span>{stageData.narration}</span>
              </div>
            )}
          </div>

          {/* Right Panel - Impact */}
          <div className="video-impact-panel">
            <div className="video-impact-header">
              <span>⏳ Future Disease Progression Timeline</span>
              <span className="video-impact-sub">Select Stage to View Impact</span>
            </div>

            {/* Stage Buttons */}
            <div className="video-stage-buttons">
              {diseaseData.stages.map((stage, idx) => (
                <button
                  key={idx}
                  className={`video-stage-btn ${currentStage === idx ? 'video-stage-btn--active' : ''}`}
                  onClick={() => handleStageChange(idx)}
                >
                  Stage {idx} {idx === 0 ? '(Present)' : 
                              idx === 1 ? '(1Y)' : 
                              idx === 2 ? '(5Y)' : '(10Y)'}
                </button>
              ))}
            </div>

            {/* Stage Impact Card */}
            <div className="video-impact-card">
              <h4 className="video-impact-title">{stageData.title}</h4>
              <p className="video-impact-desc">{stageData.description}</p>
            </div>

            {/* Metrics */}
            <div className="video-metrics">
              <h4 className="video-metrics-title">🫁 Organ Impairment & Pathology Metrics</h4>
              
              <div className="video-metric">
                <div className="video-metric-label">
                  <span>Airway / Tissue Occlusion</span>
                  <span style={{ color: '#ff3d00', fontWeight: 700 }}>{stageData.occlusionPct}%</span>
                </div>
                <div className="video-metric-bar">
                  <div 
                    className="video-metric-fill" 
                    style={{ width: `${stageData.occlusionPct}%`, background: '#ff3d00' }}
                  />
                </div>
              </div>

              <div className="video-metric">
                <div className="video-metric-label">
                  <span>Parenchymal Fibrosis</span>
                  <span style={{ color: '#ff9100', fontWeight: 700 }}>{stageData.fibrosisPct}%</span>
                </div>
                <div className="video-metric-bar">
                  <div 
                    className="video-metric-fill" 
                    style={{ width: `${stageData.fibrosisPct}%`, background: '#ff9100' }}
                  />
                </div>
              </div>

              <div className="video-metric">
                <div className="video-metric-label">
                  <span>Organ Workload & Systemic Strain</span>
                  <span style={{ color: '#b388ff', fontWeight: 700 }}>{stageData.strainPct}%</span>
                </div>
                <div className="video-metric-bar">
                  <div 
                    className="video-metric-fill" 
                    style={{ width: `${stageData.strainPct}%`, background: '#b388ff' }}
                  />
                </div>
              </div>
            </div>

            {/* Prevention */}
            <div className="video-prevention">
              <h4 className="video-prevention-title">🌿 How to Halt & Reverse Future Progression:</h4>
              <p className="video-prevention-text">{diseaseData.prevention}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .video-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .video-modal-content {
          width: 95vw;
          max-width: 1080px;
          max-height: 92vh;
          overflow-y: auto;
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(0, 242, 254, 0.35);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.2);
          padding: 1.5rem;
          border-radius: 16px;
          color: #fff;
        }

        .video-modal-content--fullscreen {
          max-width: 100vw;
          max-height: 100vh;
          border-radius: 0;
          padding: 1rem;
        }

        /* Header */
        .video-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .video-modal-header-left {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .video-modal-icon {
          width: 44px;
          height: 44px;
          background: rgba(0, 242, 254, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .video-modal-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .video-modal-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .video-badge {
          font-size: 11px;
          padding: 2px 10px;
          border-radius: 6px;
          font-weight: 600;
        }

        .video-badge--route {
          background: rgba(0, 242, 254, 0.15);
          border: 1px solid #00f2fe;
          color: #00f2fe;
        }

        .video-badge--severity {
          background: rgba(255, 61, 0, 0.2);
          border: 1px solid #ff3d00;
          color: #ff3d00;
        }

        .video-badge--target {
          background: rgba(179, 136, 255, 0.15);
          border: 1px solid #b388ff;
          color: #b388ff;
        }

        .video-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .video-modal-close:hover {
          background: rgba(255, 61, 0, 0.4);
        }

        /* Grid */
        .video-modal-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 1.5rem;
        }

        /* Video Panel */
        .video-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .video-canvas-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          background: #050b14;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .video-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }

        .video-watermark {
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.5px;
          pointer-events: none;
        }

        .video-overlay-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(0, 242, 254, 0.4);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(8px);
          pointer-events: none;
        }

        .video-layer-controls {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          padding: 6px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow-x: auto;
        }

        .video-layer-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .video-layer-btn:hover {
          background: rgba(0, 242, 254, 0.1);
        }

        .video-layer-btn--active {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(79, 172, 254, 0.3));
          border-color: #00f2fe;
          color: #fff;
        }

        .video-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
        }

        .video-control-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .video-control-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .video-control-btn--primary {
          background: linear-gradient(135deg, #2563eb, #00f2fe);
          border: none;
          color: #000;
        }

        .video-control-btn--voice {
          background: linear-gradient(135deg, rgba(179, 136, 255, 0.25), rgba(79, 172, 254, 0.3));
          border-color: #b388ff;
        }

        .video-progress {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 100px;
        }

        .video-progress-bar {
          flex: 1;
          height: 4px;
          accent-color: #00f2fe;
          cursor: pointer;
        }

        .video-time {
          font-size: 12px;
          font-weight: 600;
          color: #00f2fe;
          white-space: nowrap;
        }

        .video-narration {
          background: rgba(0, 242, 254, 0.06);
          border: 1px solid rgba(0, 242, 254, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.5;
        }

        .video-narration-icon {
          margin-right: 6px;
        }

        /* Impact Panel */
        .video-impact-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .video-impact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 700;
        }

        .video-impact-sub {
          font-size: 12px;
          color: #00e676;
        }

        .video-stage-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .video-stage-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          padding: 6px 4px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .video-stage-btn:hover {
          background: rgba(0, 242, 254, 0.1);
          color: #fff;
        }

        .video-stage-btn--active {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(79, 172, 254, 0.3));
          border-color: #00f2fe;
          color: #fff;
          box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
        }

        .video-impact-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 145, 0, 0.3);
          border-radius: 8px;
          padding: 10px 12px;
        }

        .video-impact-title {
          font-size: 14px;
          font-weight: 700;
          color: #ff9100;
          margin: 0 0 4px 0;
        }

        .video-impact-desc {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.5;
        }

        .video-metrics-title {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .video-metric {
          margin-bottom: 8px;
        }

        .video-metric:last-child {
          margin-bottom: 0;
        }

        .video-metric-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 2px;
        }

        .video-metric-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .video-metric-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .video-prevention {
          background: rgba(0, 230, 118, 0.08);
          border: 1px solid rgba(0, 230, 118, 0.25);
          padding: 10px 12px;
          border-radius: 8px;
        }

        .video-prevention-title {
          font-size: 13px;
          font-weight: 700;
          color: #00e676;
          margin: 0 0 4px 0;
        }

        .video-prevention-text {
          font-size: 12px;
          color: #e2e8f0;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 868px) {
          .video-modal-grid {
            grid-template-columns: 1fr;
          }

          .video-modal-content {
            padding: 1rem;
          }

          .video-modal-title {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .video-modal-overlay {
            padding: 10px;
          }

          .video-modal-content {
            padding: 0.75rem;
          }

          .video-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .video-control-btn {
            justify-content: center;
          }

          .video-stage-buttons {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}