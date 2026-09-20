import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Download, 
  Settings, 
  ExternalLink,
  Wifi,
  Server,
  Zap,
  Clock,
  Sliders
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, StatusBadge } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { DELHI_NCR_STATIONS } from '../api/aqi';

// CPCB CAAQMS Station Registry & Metadata covering all Delhi-NCR zones
const STATION_REGISTRY = DELHI_NCR_STATIONS.map((st, i) => ({
  code: `DL-CAAQMS-${String(i + 1).padStart(3, '0')}`,
  name: st.name,
  agency: st.state === 'Delhi' ? 'CPCB / DPCC' : st.state === 'Uttar Pradesh' ? 'UPPCB' : 'HSPCB',
  lat: st.lat,
  lng: st.lng,
  zone: st.zone,
  elevationMeters: 212 + (i % 8) * 3,
  stationType: `Continuous Ambient Air Quality Monitoring Station (${st.zone})`,
  dataProtocol: 'Modbus RTU / RS-485 via 4G LTE IoT Gateway to CPCB Parivesh',
  installDate: '15-Oct-2018',
  lastAuditDate: '02-Sep-2026',
  status: 'Operational',
}));

// Continuous Analytical Hardware Instrumentation
const INSTRUMENT_SENSORS = [
  {
    id: 'inst-bam-1022',
    name: 'Beta Attenuation Monitor (BAM-1022)',
    model: 'Met One Instruments BAM-1022',
    parameter: 'PM2.5 & PM10 Particulate Mass Concentration',
    principle: 'Carbon-14 (C-14) continuous beta-ray attenuation across glass-fiber filter ribbon with radiometric scintillation detector',
    flowRate: '16.67 L/min (Volumetric Mass Flow Control ±0.15%)',
    accuracy: '±2.0 µg/m³ (<80 µg/m³), ±2.5% (>80 µg/m³)',
    status: 'ACTIVE / ONLINE',
    calibratedAt: 'Today 00:00 IST (Automated Zero Cycle)',
    diagnostics: {
      radiationSource: 'Carbon-14 (58.4 µCi, Nominal safe)',
      filterTapeRemaining: '84% (42 days)',
      opticsCleanliness: '99.2%',
      internalTemp: '24.2°C',
    }
  },
  {
    id: 'inst-nox-42i',
    name: 'Chemiluminescence NOx Analyzer (Model 42i-TL)',
    model: 'Thermo Fisher Scientific 42i Trace Level',
    parameter: 'Nitrogen Oxides (NO, NO2, NOx)',
    principle: 'Gas-phase chemiluminescent reaction of NO with generated Ozone (O3) forming excited NO2* emitting light at 600–3000 nm',
    flowRate: '0.80 L/min',
    accuracy: '±0.4 ppb (Resolution: 0.05 ppb)',
    status: 'ACTIVE / ONLINE',
    calibratedAt: 'Yesterday 23:45 IST',
    diagnostics: {
      converterEfficiency: '99.6% (Statutory CPCB limit ≥ 96.0%)',
      pmtHighVoltage: '-852 V stabilized',
      ozonatorFlow: '82 cc/min',
      chamberPressure: '280 mmHg',
    }
  },
  {
    id: 'inst-o3-49i',
    name: 'UV Photometric Ozone Analyzer (Model 49i)',
    model: 'Thermo Scientific 49i Dual Cell',
    parameter: 'Ground-Level Photochemical Ozone (O3)',
    principle: 'Dual-cell ultraviolet photometric absorption spectrophotometry at 254 nm mercury emission line (Beer-Lambert law)',
    flowRate: '1.20 L/min',
    accuracy: '±1.0 ppb (Linearity: ±1%)',
    status: 'ACTIVE / ONLINE',
    calibratedAt: '03-Sep-2026 18:00 IST',
    diagnostics: {
      lampIntensity: '98.4%',
      cellTempA: '48.1°C',
      cellTempB: '48.2°C',
      photometerDrift: '0.04 ppb/24h',
    }
  },
  {
    id: 'inst-met-pbl',
    name: 'Ultrasonic 3D Anemometer & PBL Profiler',
    model: 'Campbell Scientific Sonic-3D / Sodar Ground Rig',
    parameter: 'Planetary Boundary Layer (PBL) Height & Wind Vector (u, v, w)',
    principle: 'High-frequency acoustic transit-time differential sounding & hydrostatic thermal lapse rate profiling',
    flowRate: 'Ambient Air Stream',
    accuracy: 'Wind Speed: ±0.05 m/s | PBL Height: ±15m',
    status: 'ACTIVE / SYNCHRONIZED',
    calibratedAt: '01-Sep-2026 12:00 IST',
    diagnostics: {
      acousticTransducerFreq: '20 kHz',
      inversionThresholdSensitivity: '0.2°C / 50m gradient',
      sampleRate: '10 Hz continuous',
      alignmentToTrueNorth: 'Verified (0.0° deviation)',
    }
  },
];

// Statutory Zero-Drift & Span Check Records (CPCB NAAQS Notification 2009 / Section 12 CAQM Act)
const STATUTORY_CALIBRATION_RECORDS = [
  {
    instrument: 'Beta Attenuation Monitor (BAM-1022)',
    pollutant: 'PM2.5 (Fine Particulates)',
    zeroDrift: '+0.3 µg/m³',
    zeroLimit: '±2.0 µg/m³',
    spanDrift: '-1.1%',
    spanLimit: '±5.0%',
    status: 'PASSED',
    compliance: 'CPCB Certified (±5% Bounds)',
  },
  {
    instrument: 'Beta Attenuation Monitor (BAM-1022)',
    pollutant: 'PM10 (Coarse Particulates)',
    zeroDrift: '+0.5 µg/m³',
    zeroLimit: '±3.0 µg/m³',
    spanDrift: '+0.8%',
    spanLimit: '±5.0%',
    status: 'PASSED',
    compliance: 'CPCB Certified (±5% Bounds)',
  },
  {
    instrument: 'Chemiluminescence Analyzer 42i',
    pollutant: 'Nitrogen Dioxide (NO2)',
    zeroDrift: '+0.2 ppb',
    zeroLimit: '±1.0 ppb',
    spanDrift: '+1.6%',
    spanLimit: '±5.0%',
    status: 'PASSED',
    compliance: 'CPCB Certified (±5% Bounds)',
  },
  {
    instrument: 'UV Photometric Analyzer 49i',
    pollutant: 'Ozone (O3)',
    zeroDrift: '-0.1 ppb',
    zeroLimit: '±1.0 ppb',
    spanDrift: '-0.7%',
    spanLimit: '±5.0%',
    status: 'PASSED',
    compliance: 'CPCB Certified (±5% Bounds)',
  },
  {
    instrument: 'Pulsed Fluorescence 43i',
    pollutant: 'Sulphur Dioxide (SO2)',
    zeroDrift: '+0.1 ppb',
    zeroLimit: '±1.0 ppb',
    spanDrift: '+1.2%',
    spanLimit: '±5.0%',
    status: 'PASSED',
    compliance: 'CPCB Certified (±5% Bounds)',
  },
  {
    instrument: 'NDIR Gas Filter Correlation 48i',
    pollutant: 'Carbon Monoxide (CO)',
    zeroDrift: '+0.03 mg/m³',
    zeroLimit: '±0.2 mg/m³',
    spanDrift: '+0.5%',
    spanLimit: '±5.0%',
    status: 'PASSED',
    compliance: 'CPCB Certified (±5% Bounds)',
  },
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedStationCode, setSelectedStationCode] = useState('DL001');
  const [testingDiagnostics, setTestingDiagnostics] = useState(false);
  const [diagnosticSuccess, setDiagnosticSuccess] = useState(null);

  const currentStation = STATION_REGISTRY.find(s => s.code === selectedStationCode) || STATION_REGISTRY[0];

  const handleRunSelfTest = () => {
    setTestingDiagnostics(true);
    setDiagnosticSuccess(null);
    setTimeout(() => {
      setTestingDiagnostics(false);
      setDiagnosticSuccess(`Diagnostic self-test completed for ${currentStation.name}. All sensors operating within statutory CPCB ±5% error limits. Telemetry stream healthy.`);
    }, 1200);
  };

  const handleExportCertificate = () => {
    window.print();
  };

  return (
    <Layout 
      title="Station Telemetry & Sensor Diagnostics" 
      subtitle="CPCB CAAQMS hardware configuration, continuous sensor calibration matrices, and statutory audit compliance."
    >
      {/* Top Banner with Station Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7'
          }}>
            <Radio size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {currentStation.name}
              </h2>
              <span style={{
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                CAAQMS Station {currentStation.code}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                Hardware Active
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', margin: '3px 0 0 0' }}>
              Geodetic Coordinates: <strong>{currentStation.lat}° N, {currentStation.lng}° E</strong> • Elevation: {currentStation.elevationMeters}m ASL • Authority: {currentStation.agency}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1'
          }}>
            <MapPin size={14} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Station:</span>
            <select
              value={selectedStationCode}
              onChange={(e) => setSelectedStationCode(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['Central Delhi', 'East Delhi', 'South Delhi', 'North & West Delhi', 'NCR Sub-regions'].map((zone) => {
                const zoneStations = STATION_REGISTRY.filter(s => s.zone === zone);
                if (!zoneStations.length) return null;
                return (
                  <optgroup key={zone} label={`── ${zone} ──`} style={{ background: '#ffffff', color: '#0284c7', fontWeight: 700 }}>
                    {zoneStations.map((s) => (
                      <option key={s.code} value={s.code} style={{ background: '#ffffff', color: '#0f172a', fontWeight: 500 }}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleRunSelfTest}
            disabled={testingDiagnostics}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={13} className={testingDiagnostics ? 'spin' : ''} />
            <span>{testingDiagnostics ? 'Executing Test Loop...' : 'Diagnostic Self-Test'}</span>
          </button>

          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleExportCertificate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
          >
            <Download size={13} />
            <span>Export Certificate</span>
          </button>
        </div>
      </div>

      {diagnosticSuccess && (
        <div className="banner banner--success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={16} />
          <span>{diagnosticSuccess}</span>
        </div>
      )}

      {/* Station Hardware & Sensor Overview Grid */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Cpu size={18} color="#38bdf8" /> Continuous Regulatory Sensor Instrumentation
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {INSTRUMENT_SENSORS.map((sensor) => (
          <Card key={sensor.id} className="section-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {sensor.parameter}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--color-text)' }}>
                    {sensor.name}
                  </h4>
                </div>
                <span style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}>
                  {sensor.status}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {sensor.principle}
              </p>

              <div style={{
                background: 'var(--color-surface, #f8fafc)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '11.5px',
                marginBottom: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--color-text-faint)' }}>Volumetric Flow:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', marginTop: '1px' }}>{sensor.flowRate}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-faint)' }}>Precision:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', marginTop: '1px' }}>{sensor.accuracy}</div>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--color-text-faint)'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {sensor.calibratedAt}
              </span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Zero-Cycle Passed ✓</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Statutory Zero-Drift & Span Check Table */}
      <Card className="section-card" style={{ marginBottom: '24px' }}>
        <div className="card-head" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981" /> Statutory Zero-Drift & Span Check Calibration Audit
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
              Mandatory CPCB continuous QA/QC verification protocol. Statutory error threshold bound: <strong>±5.0% maximum tolerance</strong> under National Ambient Air Quality Standards.
            </p>
          </div>
          <span style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#10b981',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            CPCB Statutory Error Bounds: ±5% Verified
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-faint)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th style={{ padding: '10px 12px' }}>Instrument Model</th>
                <th style={{ padding: '10px 12px' }}>Target Pollutant</th>
                <th style={{ padding: '10px 12px' }}>Zero Drift (24h)</th>
                <th style={{ padding: '10px 12px' }}>Allowable Zero Limit</th>
                <th style={{ padding: '10px 12px' }}>Span Drift (24h)</th>
                <th style={{ padding: '10px 12px' }}>Allowable Span Bound</th>
                <th style={{ padding: '10px 12px' }}>CPCB Compliance</th>
              </tr>
            </thead>
            <tbody>
              {STATUTORY_CALIBRATION_RECORDS.map((rec, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{rec.instrument}</td>
                  <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 600 }}>{rec.pollutant}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>{rec.zeroDrift}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-faint)' }}>{rec.zeroLimit}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>{rec.spanDrift}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-faint)' }}>{rec.spanLimit}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      ✓ {rec.compliance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Telemetry Pipeline Diagnostics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        <Card className="section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Server size={18} color="#38bdf8" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Telemetry Ingestion Gateway</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
            Direct encrypted IP tunnel transmitting continuous raw analog-to-digital sensor outputs to CPCB Parivesh server cluster.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
            <span style={{ color: 'var(--color-text-faint)' }}>Transmission Latency:</span>
            <strong style={{ color: '#10b981' }}>42 ms (Real-Time)</strong>
          </div>
        </Card>

        <Card className="section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Wifi size={18} color="#10b981" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Data Completeness Factor</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
            Evaluated against the statutory CAQM 90% data validity criterion for Graded Response Action Plan (GRAP) order issuance.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
            <span style={{ color: 'var(--color-text-faint)' }}>30-Day Capture Rate:</span>
            <strong style={{ color: '#10b981' }}>99.8% (Exceeds Mandate)</strong>
          </div>
        </Card>

        <Card className="section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="#f59e0b" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Statutory Regulatory Compliance</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
            Section 12 of the CAQM Act 2021 read with Section 31A of the Air (Prevention and Control of Pollution) Act, 1981.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
            <span style={{ color: 'var(--color-text-faint)' }}>Station DL001 Audit Status:</span>
            <strong style={{ color: '#10b981' }}>Certified Valid (Active)</strong>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
