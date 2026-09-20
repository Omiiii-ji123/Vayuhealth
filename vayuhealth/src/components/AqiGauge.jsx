import { getAqiBand } from '../utils/aqi';

export default function AqiGauge({ value = 0, size = 180 }) {
  const band = getAqiBand(value);
  const pct = Math.min(Math.max(value, 0), 500) / 500;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="aqi-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="14"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={band.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="aqi-gauge__label">
        <div className="aqi-gauge__value">{Number.isFinite(value) ? Math.round(value) : '--'}</div>
        <div className="aqi-gauge__unit">AQI</div>
      </div>
    </div>
  );
}
