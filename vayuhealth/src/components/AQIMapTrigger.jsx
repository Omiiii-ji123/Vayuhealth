import { MapPin } from 'lucide-react';

export default function AQIMapTrigger({ onClick, label = "Open All-India AQI Map", className = "" }) {
  return (
    <button 
      className={`aqi-map-trigger ${className}`}
      onClick={onClick}
      aria-label="Open All-India AQI Map"
    >
      <MapPin size={18} />
      <span>{label}</span>
    </button>
  );
}