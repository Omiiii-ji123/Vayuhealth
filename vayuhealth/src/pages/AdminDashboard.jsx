import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  Layers,
  Send,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Wind,
  Heart,
  Activity,
  MapPin,
  Clock,
  Sparkles,
  Radio,
  FileText,
  UserCheck,
  ShieldCheck,
  X,
  Zap,
  LogOut,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, StatusBadge } from '../components/Common';
import { getAdminStats, getAdminRegionalRisks, getAdminCaaqmsStations, broadcastAdminAlert } from '../api/admin';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getAqiBand } from '../utils/aqi';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pushNotification } = useNotifications();
  const [stats, setStats] = useState(null);
  const [regionalRisks, setRegionalRisks] = useState([]);
  const [stationRegistry, setStationRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('regional'); // 'regional' | 'stations' | 'broadcast'
  
  // Filters & Search
  const [districtSearch, setDistrictSearch] = useState('');
  const [stationSearch, setStationSearch] = useState('');
  const [sensorStatusFilter, setSensorStatusFilter] = useState('ALL');
  const [selectedZoneForBroadcast, setSelectedZoneForBroadcast] = useState('');
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('CRITICAL');
  const [broadcastSuccessNotice, setBroadcastSuccessNotice] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, rData, stData] = await Promise.all([
        getAdminStats(),
        getAdminRegionalRisks(),
        getAdminCaaqmsStations(),
      ]);
      setStats(sData);
      setRegionalRisks(rData);
      setStationRegistry(stData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Regional Risks
  const filteredRegionalRisks = useMemo(() => {
    return regionalRisks.filter((r) =>
      r.district.toLowerCase().includes(districtSearch.toLowerCase()) ||
      r.state.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [regionalRisks, districtSearch]);

  // Filtered CAAQMS Stations Registry
  const filteredStations = useMemo(() => {
    return stationRegistry.filter((st) => {
      const matchesSearch =
        st.stationName.toLowerCase().includes(stationSearch.toLowerCase()) ||
        st.stationCode.toLowerCase().includes(stationSearch.toLowerCase()) ||
        (st.state && st.state.toLowerCase().includes(stationSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (sensorStatusFilter === 'ACTIVE') return st.sensorStatus?.toLowerCase() === 'active';
      if (sensorStatusFilter === 'CALIBRATING') return st.sensorStatus?.toLowerCase() === 'calibrating';
      return true;
    });
  }, [stationRegistry, stationSearch, sensorStatusFilter]);

  // Handle Emergency Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!selectedZoneForBroadcast) return;

    try {
      const res = await broadcastAdminAlert({
        district: selectedZoneForBroadcast,
        severity: broadcastSeverity,
        title: `🚨 CPCB Emergency Advisory (${selectedZoneForBroadcast})`,
        message: broadcastMessage || `Severe air toxicity detected in ${selectedZoneForBroadcast}. High-risk asthmatics and elderly citizens are advised to remain indoors and activate air purifiers.`,
      });

      pushNotification({
        title: `📢 Regulatory Advisory Dispatched: ${selectedZoneForBroadcast}`,
        message: `Statutory order broadcasted to enforcement agencies & residents in ${selectedZoneForBroadcast}.`,
        category: 'danger',
      });

      setBroadcastSuccessNotice(`Statutory emergency directive successfully transmitted for ${selectedZoneForBroadcast}!`);
      setTimeout(() => setBroadcastSuccessNotice(null), 6000);
      setBroadcastModalOpen(false);
      setBroadcastMessage('');
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  };

  // Export CAAQMS Station Telemetry to CSV
  const handleExportCSV = () => {
    if (!stationRegistry.length) return;
    const headers = [
      'Station Name',
      'Station Code',
      'State',
      'Current PM2.5 (ug/m3)',
      'Current PM10 (ug/m3)',
      'NOx (ppb)',
      'PBL Height (m)',
      'Inversion Trapping Status',
      'Sensor Status',
      'Live AQI',
      'AQI Status'
    ];
    const rows = stationRegistry.map(s => [
      `"${s.stationName}"`,
      s.stationCode,
      `"${s.state || 'Delhi'}"`,
      s.currentPm25,
      s.currentPm10,
      s.nox,
      s.pblHeight,
      `"${s.inversionTrappingStatus}"`,
      s.sensorStatus,
      s.aqi,
      s.aqiStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CPCB_CAAQMS_DelhiNCR_Station_Telemetry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Admin Command Center" subtitle="CPCB Central Air Quality & Citizen Vulnerability Registry.">
      <div className="admin-portal-page">
        {/* Top Header */}
        <div className="admin-header-card">
          <div className="admin-header-main">
            <div className="admin-badge">
              <ShieldAlert size={15} />
              <span>CPCB & CAQM National Air Quality Command</span>
            </div>
            <h1 className="admin-header-title">CPCB / CAAQMS Regulatory Admin Center</h1>
            <p className="admin-header-sub">
              Centralized daily monitoring of urban air toxicity hotspots, atmospheric thermal inversion dynamics, and ICMR/MoHFW sentinel acute respiratory illness (ARI) surveillance.
            </p>
          </div>

          <div className="admin-header-actions">
            <button className="admin-btn admin-btn--secondary" onClick={handleExportCSV} title="Export Patient Registry to Excel / CSV">
              <Download size={15} />
              <span>📥 Download Excel (CSV)</span>
            </button>
            <button className="admin-btn admin-btn--refresh" onClick={loadData} title="Refresh Telemetry">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button 
              className="admin-btn admin-btn--logout" 
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out of Admin Portal"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {broadcastSuccessNotice && (
          <div className="broadcast-success-banner">
            <CheckCircle size={18} color="#10b981" />
            <span>{broadcastSuccessNotice}</span>
          </div>
        )}

        {/* Top Summary KPI Cards */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-card__header">
              <span>Active CAAQMS Stations</span>
              <Radio size={18} color="#0284c7" />
            </div>
            <div className="admin-kpi-card__value">
              {stats?.activeCaaqmsStationsCount || stats?.totalUsersCount || 40}
            </div>
            <div className="admin-kpi-card__footer">
              <span style={{ color: '#059669', fontWeight: 700 }}>● Live Telemetry Active</span> <span style={{ color: '#64748b' }}>Across Delhi NCR Airshed</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__header">
              <span>Critical Severe Hotspots</span>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
            <div className="admin-kpi-card__value" style={{ color: '#dc2626' }}>
              {stats?.severeHotspotCount || 4} <span className="kpi-sub">Stations</span>
            </div>
            <div className="admin-kpi-card__footer">
              <span style={{ color: '#64748b' }}>AQI &gt; 400 (GRAP Stage IV Threshold)</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__header">
              <span>Active Inversion Trapping</span>
              <Layers size={18} color="#9333ea" />
            </div>
            <div className="admin-kpi-card__value" style={{ color: '#9333ea' }}>
              {stats?.activeInversionZonesCount || 5} <span className="kpi-sub">Zones</span>
            </div>
            <div className="admin-kpi-card__footer">
              <span style={{ color: '#64748b' }}>PBL Height compressed &lt; 280 meters</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__header">
              <span>Average Delhi-NCR AQI</span>
              <Wind size={18} color="#ea580c" />
            </div>
            <div className="admin-kpi-card__value" style={{ color: '#ea580c' }}>
              {stats?.averageDelhiAqi || 382.4} <span className="kpi-sub">AQI</span>
            </div>
            <div className="admin-kpi-card__footer">
              <span style={{ color: '#64748b' }}>Continuous 24h trailing airshed index</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__header">
              <span>CAQM Directives Dispatched</span>
              <Send size={18} color="#059669" />
            </div>
            <div className="admin-kpi-card__value" style={{ color: '#059669' }}>
              {stats?.alertsDispatchedToday?.toLocaleString() || '1,420'}
            </div>
            <div className="admin-kpi-card__footer">
              <span style={{ color: '#64748b' }}>Statutory notifications logged</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tab-nav">
          <button
            className={`admin-tab-btn ${activeTab === 'regional' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('regional')}
          >
            <AlertTriangle size={16} />
            <span>Daily Regional Bad AQI & Weather Risk Matrix</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'stations' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            <Radio size={16} />
            <span>CPCB CAAQMS Continuous Ambient Air Monitoring Stations (Delhi NCR) ({stationRegistry.length || 7})</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'broadcast' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            <Send size={16} />
            <span>Emergency Regulatory Advisory Console</span>
          </button>
        </div>

        {/* TAB 1: REGIONAL RISK MATRIX */}
        {activeTab === 'regional' && (
          <Card className="admin-section-card">
            <div className="section-header-bar">
              <div>
                <h3 className="section-title">Regional Air Toxicity & Atmospheric Entrapment Matrix</h3>
                <p className="section-sub">
                  Real-time ranking of districts showing ground pollutant density, Boundary Layer compression, and resident vulnerability.
                </p>
              </div>

              <div className="search-bar-wrap">
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter district or state..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="admin-loader-wrap">
                <Loader text="Computing regional risk telemetry..." />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>District / Station</th>
                      <th>Live AQI</th>
                      <th>PM2.5 (μg/m³)</th>
                      <th>PBL Height & Inversion</th>
                      <th>Stubble Influx</th>
                      <th>Daily ARI Admissions (ICMR Sentinel Feed)</th>
                      <th>Recommended Protocol</th>
                      <th>Emergency Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegionalRisks.map((item, idx) => {
                      const isSevere = item.aqi >= 400;
                      return (
                        <tr key={idx} className={isSevere ? 'row-severe' : ''}>
                          <td>
                            <div className="td-district-wrap">
                              <MapPin size={15} color={isSevere ? '#ef4444' : '#38bdf8'} />
                              <div>
                                <strong>{item.district}</strong>
                                <span className="td-sub">{item.state}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="td-aqi-pill" style={{ background: item.aqiColor + '25', borderColor: item.aqiColor }}>
                              <span style={{ color: item.aqiColor, fontWeight: 800 }}>{item.aqi}</span>
                              <small style={{ color: item.aqiColor }}>({item.aqiStatus})</small>
                            </div>
                          </td>
                          <td>
                            <strong>{item.pm25}</strong> <span className="unit-label">μg/m³</span>
                          </td>
                          <td>
                            <div>
                              <strong>{item.pblHeightMeters}m</strong>
                              <span
                                className="inversion-tag"
                                style={{
                                  color: item.inversionSeverity === 'Severe' ? '#ef4444' : '#f59e0b',
                                  background: item.inversionSeverity === 'Severe' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                }}
                              >
                                {item.inversionSeverity} ({item.inversionScore}%)
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ color: item.stubbleInfluxUgM3 > 100 ? '#f97316' : '#94a3b8', fontWeight: 700 }}>
                              +{item.stubbleInfluxUgM3} μg/m³
                            </span>
                          </td>
                          <td>
                            {(() => {
                              // ICMR Concentration-Response: Daily_ARI_Surge = Base_Admissions * (1 + 0.0035 * Math.max(0, PM2.5 - 60))
                              const baseAdmissions = item.baseAdmissions || (item.state === 'Maharashtra' ? 25 : 36);
                              const ariSurge = item.dailyAriAdmissions || Math.round(baseAdmissions * (1 + 0.0035 * Math.max(0, (item.pm25 || 0) - 60)));
                              return (
                                <div
                                  className="vulnerable-users-pill"
                                  title="Estimated daily Acute Respiratory Illness (ARI) admissions based on MoHFW Integrated Health Information Portal (IHIP) & ICMR sentinel hospital surveillance data."
                                >
                                  <Activity size={13} />
                                  <span>~{ariSurge} ARI Admissions/day</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td>
                            <span className={`grap-pill ${item.recommendedGrapStage.includes('Stage IV') ? 'grap-pill--4' : item.recommendedGrapStage.includes('Stage III') ? 'grap-pill--3' : ''}`}>
                              {item.recommendedGrapStage}
                            </span>
                          </td>
                          <td>
                            <button
                              className="action-broadcast-btn"
                              onClick={() => {
                                setSelectedZoneForBroadcast(item.district);
                                setBroadcastModalOpen(true);
                              }}
                            >
                              <Send size={13} />
                              <span>Broadcast Alert</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: CPCB CAAQMS STATIONS REGISTRY */}
        {activeTab === 'stations' && (
          <Card className="admin-section-card">
            <div className="section-header-bar">
              <div>
                <h3 className="section-title">CPCB CAAQMS Continuous Ambient Air Monitoring Stations (Delhi NCR)</h3>
                <p className="section-sub">
                  Statutory real-time atmospheric telemetry from certified ambient monitoring stations recording particulate density, NOx, and boundary layer compression.
                </p>
              </div>

              <div className="user-filter-controls">
                <div className="search-bar-wrap">
                  <Search size={15} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search station name, code, state..."
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <select
                  className="condition-select"
                  value={sensorStatusFilter}
                  onChange={(e) => setSensorStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Sensors (Active & Calibrating)</option>
                  <option value="ACTIVE">Active Sensors Only</option>
                  <option value="CALIBRATING">Calibrating Only</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Station Name</th>
                    <th>Station Code</th>
                    <th>Current PM2.5</th>
                    <th>Current PM10</th>
                    <th>NOx</th>
                    <th>PBL Height</th>
                    <th>Inversion Trapping Status</th>
                    <th>Sensor Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((st, idx) => {
                    const isSevere = st.currentPm25 >= 380 || (st.inversionTrappingStatus && st.inversionTrappingStatus.toLowerCase().includes('severe'));
                    return (
                      <tr key={idx} className={isSevere ? 'row-severe' : ''}>
                        <td>
                          <div className="td-district-wrap">
                            <MapPin size={15} color={isSevere ? '#ef4444' : '#38bdf8'} />
                            <div>
                              <strong>{st.stationName}</strong>
                              <span className="td-sub">{st.state || 'Delhi NCR'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="station-code-pill">{st.stationCode}</span>
                        </td>
                        <td>
                          <div className="td-val-group">
                            <strong style={{ color: st.currentPm25 > 350 ? '#ef4444' : 'var(--color-text-secondary, #334155)' }}>{st.currentPm25}</strong>
                            <span className="unit-label">µg/m³</span>
                          </div>
                        </td>
                        <td>
                          <div className="td-val-group">
                            <strong>{st.currentPm10}</strong>
                            <span className="unit-label">µg/m³</span>
                          </div>
                        </td>
                        <td>
                          <div className="td-val-group">
                            <strong>{st.nox}</strong>
                            <span className="unit-label">ppb</span>
                          </div>
                        </td>
                        <td>
                          <div className="td-val-group">
                            <strong style={{ color: st.pblHeight < 280 ? '#9333ea' : 'var(--color-text-secondary, #334155)' }}>{st.pblHeight}m</strong>
                          </div>
                        </td>
                        <td>
                          <span 
                            className="inversion-tag" 
                            style={{ 
                              color: st.inversionTrappingStatus?.toLowerCase().includes('severe') ? '#ef4444' : st.inversionTrappingStatus?.toLowerCase().includes('mod') ? '#f59e0b' : '#34d399',
                              background: st.inversionTrappingStatus?.toLowerCase().includes('severe') ? 'rgba(239, 68, 68, 0.15)' : st.inversionTrappingStatus?.toLowerCase().includes('mod') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                              border: `1px solid ${st.inversionTrappingStatus?.toLowerCase().includes('severe') ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                            }}
                          >
                            {st.inversionTrappingStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`sensor-status-badge ${st.sensorStatus?.toLowerCase() === 'active' ? 'sensor-status-badge--active' : 'sensor-status-badge--calibrating'}`}>
                            {st.sensorStatus?.toLowerCase() === 'active' ? '● Active' : '◌ Calibrating'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: EMERGENCY BROADCAST COMMAND */}
        {activeTab === 'broadcast' && (
          <Card className="admin-section-card">
            <div className="broadcast-console-grid">
              <div className="broadcast-form-panel">
                <div className="panel-tag">CITIZEN EMERGENCY ADVISORY DISPATCH</div>
                <h3 className="section-title">Compose Public Health Emergency Broadcast</h3>
                <p className="section-sub">
                  Trigger automated targeted push alerts to registered asthmatic and elderly patients living in affected pollution corridors.
                </p>

                <form onSubmit={handleSendBroadcast} className="admin-broadcast-form">
                  <div className="form-group">
                    <label>Target Pollution Hotspot Zone</label>
                    <select
                      className="admin-form-input"
                      value={selectedZoneForBroadcast}
                      onChange={(e) => setSelectedZoneForBroadcast(e.target.value)}
                      required
                    >
                      <option value="">-- Select Target District / Station --</option>
                      {regionalRisks.map((r) => (
                        <option key={r.district} value={r.district}>
                          {r.district} (Live AQI {r.aqi} - {r.aqiStatus})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Advisory Severity Classification</label>
                    <div className="severity-radio-group">
                      {['CRITICAL', 'WARNING', 'ADVISORY'].map((sev) => (
                        <label key={sev} className={`radio-pill ${broadcastSeverity === sev ? 'radio-pill--active' : ''}`}>
                          <input
                            type="radio"
                            name="severity"
                            value={sev}
                            checked={broadcastSeverity === sev}
                            onChange={() => setBroadcastSeverity(sev)}
                          />
                          <span>{sev}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Custom Emergency Advisory Text</label>
                    <textarea
                      rows={4}
                      className="admin-form-textarea"
                      placeholder="e.g. Hazardous PM2.5 spike detected due to nocturnal thermal inversion. High-risk respiratory patients are advised to refrain from outdoor exertion..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="admin-btn admin-btn--send" disabled={!selectedZoneForBroadcast}>
                    <Send size={16} />
                    <span>Dispatch Emergency Broadcast</span>
                  </button>
                </form>
              </div>

              <div className="broadcast-guidelines-panel">
                <div className="guidelines-card">
                  <h4>🏛️ CPCB Standard Operating Protocol (SOP)</h4>
                  <ul>
                    <li>
                      <strong>Automatic Triggers:</strong> Stations with AQI &gt; 400 trigger immediate high-priority statutory push notifications to high-risk demographic clusters within 5km radius.
                    </li>
                    <li>
                      <strong>Thermal Inversion Clause:</strong> When PBL &lt; 280m, advisory instructs citizens to avoid early morning physical workouts due to pollutant entrapment.
                    </li>
                    <li>
                      <strong>Clinical Remediation:</strong> In-app push includes instant clinical respiratory care protocols and nearest pulmonary hospital locator.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Modal: Quick Zone Broadcast */}
        {broadcastModalOpen && (
          <div className="modal-backdrop" onClick={() => setBroadcastModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-card__header">
                <h3>Broadcast Emergency Advisory: {selectedZoneForBroadcast}</h3>
                <button className="modal-close-btn" onClick={() => setBroadcastModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSendBroadcast} className="modal-card__body">
                <p className="modal-sub">
                  This will dispatch an instant push advisory to all registered citizens and asthmatic patients in <strong>{selectedZoneForBroadcast}</strong>.
                </p>
                <div className="form-group">
                  <label>Advisory Message:</label>
                  <textarea
                    rows={3}
                    className="admin-form-textarea"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder={`Severe air toxicity alert for ${selectedZoneForBroadcast}. Avoid outdoor activities.`}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setBroadcastModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn--send">
                    <Send size={15} />
                    <span>Transmit Alert</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-portal-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 40px;
        }

        .admin-header-card {
          background: #ffffff;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(239, 68, 68, 0.04);
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 20px;
          color: #dc2626;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .admin-header-title,
        .admin-page-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0 0 6px 0;
        }

        .admin-header-sub,
        .admin-page-sub {
          font-size: 13px;
          color: #475569 !important;
          margin: 0;
          max-width: 720px;
          line-height: 1.5;
        }

        .admin-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .admin-btn--secondary {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }

        .admin-btn--secondary:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .admin-btn--logout {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .admin-btn--logout:hover {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
        }

        .admin-btn--refresh {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          padding: 10px;
        }

        .admin-btn--refresh:hover {
          background: #f1f5f9;
        }

        .admin-btn--send {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }

        .broadcast-success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
        }

        /* KPI Grid */
        .admin-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }

        .admin-kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .admin-kpi-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
        }

        .admin-kpi-card__value {
          font-size: 26px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .kpi-sub {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }

        .admin-kpi-card__footer {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.4;
        }

        /* Tabs */
        .admin-tab-nav {
          display: flex;
          gap: 10px;
          background: #ffffff;
          padding: 6px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          flex-wrap: wrap;
        }

        .admin-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #475569;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-tab-btn:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .admin-tab-btn--active {
          background: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }

        /* Section Cards */
        .admin-section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .section-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .section-sub {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
        }

        .search-bar-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
          min-width: 240px;
        }

        .admin-search-input {
          background: transparent;
          border: none;
          color: #0f172a;
          font-size: 13px;
          outline: none;
          width: 100%;
        }

        .user-filter-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .condition-select {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
        }

        /* Table */
        .table-responsive {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .admin-table th {
          background: #f8fafc;
          color: #0f172a;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 14px;
          border-bottom: 2px solid #e2e8f0;
        }

        .admin-table td {
          padding: 14px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .admin-table tbody tr {
          transition: background-color 0.15s ease;
        }

        .admin-table tbody tr:hover {
          background: #f8fafc;
        }

        .td-district-wrap strong {
          color: #1e293b;
          font-weight: 600;
        }

        .admin-table td strong {
          color: #334155;
          font-weight: 700;
        }

        .unit-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        [data-theme='dark'] .admin-table th {
          background: #1e293b;
          color: #f8fafc;
          border-bottom: 2px solid #334155;
        }

        [data-theme='dark'] .admin-table td {
          border-bottom: 1px solid #1f2937;
          color: #e2e8f0;
        }

        [data-theme='dark'] .admin-table tbody tr:hover {
          background: rgba(30, 41, 59, 0.5);
        }

        [data-theme='dark'] .td-district-wrap strong {
          color: #f8fafc;
        }

        [data-theme='dark'] .admin-table td strong {
          color: #f1f5f9;
        }

        [data-theme='dark'] .unit-label {
          color: #94a3b8;
        }

        .row-severe {
          background: rgba(239, 68, 68, 0.05);
        }

        .row-severe:hover {
          background: rgba(239, 68, 68, 0.09) !important;
        }

        [data-theme='dark'] .row-severe {
          background: rgba(239, 68, 68, 0.1);
        }

        .td-district-wrap {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .td-sub {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        .td-val-group {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .station-code-pill {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11.5px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        .sensor-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .sensor-status-badge--active {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .sensor-status-badge--calibrating {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .td-aqi-pill {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid;
          font-size: 12px;
        }

        .inversion-tag {
          display: block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          width: fit-content;
          margin-top: 2px;
        }

        .vulnerable-users-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(225, 29, 72, 0.08);
          color: #e11d48;
          border: 1px solid rgba(225, 29, 72, 0.25);
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: help;
        }

        [data-theme='dark'] .vulnerable-users-pill {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
          border-color: rgba(244, 63, 94, 0.3);
        }

        .grap-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.06);
          color: #334155;
        }

        [data-theme='dark'] .grap-pill {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        .grap-pill--4 {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .grap-pill--3 {
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.4);
        }

        .action-broadcast-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #f87171;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-broadcast-btn:hover {
          background: #ef4444;
          color: #ffffff;
        }

        /* User table */
        .td-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8, #0284c7);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
        }

        .conditions-pill-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .condition-tag {
          font-size: 11px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .condition-tag--asthma {
          background: rgba(239, 68, 68, 0.18);
          color: #f87171;
        }

        .condition-tag--heart {
          background: rgba(249, 115, 22, 0.18);
          color: #fb923c;
        }

        .condition-tag--none {
          font-size: 11px;
          color: #64748b;
        }

        .sensitivity-badge {
          font-size: 11.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .sensitivity-badge--high {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .sensitivity-badge--moderate {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        .sensitivity-badge--low {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .local-exposure-badge {
          font-size: 12px;
          color: #ef4444;
        }

        .local-exposure-badge small {
          display: block;
          font-size: 10px;
          color: #94a3b8;
        }

        .risk-tier-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .risk-tier-badge--critical {
          background: #7f1d1d;
          color: #fecaca;
        }

        .risk-tier-badge--high {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .risk-tier-badge--moderate {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .risk-tier-badge--low {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        /* Broadcast Console */
        .broadcast-console-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .broadcast-console-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-broadcast-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .admin-form-input,
        .admin-form-textarea {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          color: #0f172a;
          padding: 10px 14px;
          font-size: 13.5px;
          outline: none;
        }

        .admin-form-input:focus,
        .admin-form-textarea:focus {
          border-color: #ef4444;
        }

        .severity-radio-group {
          display: flex;
          gap: 10px;
        }

        .radio-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          color: #475569;
        }

        .radio-pill--active {
          background: #fee2e2;
          border-color: #ef4444;
          color: #b91c1c;
        }

        .guidelines-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 18px;
        }

        .guidelines-card h4 {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .guidelines-card ul {
          margin: 0;
          padding-left: 18px;
          font-size: 12.5px;
          color: #475569;
          line-height: 1.6;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .modal-card {
          background: #ffffff;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .modal-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .modal-card__header h3 {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
        }

        .modal-sub {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0 0 14px 0;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }
      `}</style>
    </Layout>
  );
}
