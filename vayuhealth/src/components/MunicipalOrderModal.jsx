import React, { useState } from 'react';
import { FileCheck, Printer, Copy } from 'lucide-react';

export default function MunicipalOrderModal({
  isOpen,
  onClose,
  stationName = 'Anand Vihar, Delhi',
  baselineAqi = 418,
  simulatedAqi = 295,
  stageName = 'GRAP Stage IV (Severe+)',
  stageNum = 4,
  bans = { truckBan: true, constructionBan: true, oddEven: true }
}) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const orderRef = `F.No. DPCC/CAQM/GRAP-ORD/2026/DEL-${today.getMonth() + 1}/${String(today.getDate()).padStart(2, '0')}`;

  const orderText = `
COMMISSION FOR AIR QUALITY MANAGEMENT IN NCR AND ADJOINING AREAS (CAQM)
DELHI POLLUTION CONTROL COMMITTEE (DPCC) / CENTRAL POLLUTION CONTROL BOARD (CPCB)
DEPARTMENT OF ENVIRONMENT, GOVERNMENT OF NATIONAL CAPITAL TERRITORY OF DELHI

STATUTORY NOTIFICATION UNDER SECTION 12 OF THE CAQM ACT, 2021
READ WITH SECTION 31A OF THE AIR (PREVENTION AND CONTROL OF POLLUTION) ACT, 1981

ORDER REFERENCE: ${orderRef}
DATE OF PROMULGATION: ${dateFormatted}
JURISDICTION: Entire National Capital Territory of Delhi and Adjoining NCR Districts (Gurugram, Faridabad, Noida, Greater Noida, Ghaziabad, Sonipat)

SUBJECT: IMMEDIATE STATUTORY INVOCATION OF ${stageName.toUpperCase()} MEASURES UNDER THE GRADED RESPONSE ACTION PLAN (GRAP) ACROSS DELHI-NCR AIRSHED.

1. WHEREAS, continuous atmospheric surveillance data and the 72-hour coupled meteorological-chemical transport forecasts modeled by CPCB/IMD have confirmed acute atmospheric entrapment, with ambient PM2.5 levels surging past statutory thresholds and peak AQI forecasted at ${baselineAqi} at ${stationName};

2. AND WHEREAS, physical boundary layer analysis confirms severe nocturnal inversion layer compression (<260m) combined with north-westerly biomass plume advection, severely suppressing vertical turbulent dispersion and creating critical particulate concentration;

3. AND WHEREAS, simulated regulatory scenario modeling demonstrates that strict multi-sectoral enforcement lowers projected ambient AQI to ${simulatedAqi}, preventing critical hospital emergency loads and acute respiratory distress among citizens;

4. NOW, THEREFORE, the Commission for Air Quality Management, in exercise of powers conferred under Section 12 of the CAQM Act, 2021 and Section 31A of the Air Act, 1981, hereby directs all concerned statutory and municipal authorities to enforce the following mandatory directions with immediate effect:

A. COMMERCIAL FREIGHT: ${bans.truckBan ? 'Strict prohibition on the entry of all non-essential medium and heavy diesel commercial goods vehicles into NCT Delhi, except essential supplies and zero-emission vehicles (CNG/LNG/EV).' : 'Intensive border checkpoint scrutiny and mandatory PUC enforcement.'}
B. CIVIL CONSTRUCTION: ${bans.constructionBan ? 'Total cessation of all excavation, civil construction, demolition, structural fabrication, stone crushing, and ready-mix concrete batching operations across NCR.' : 'Compulsory deployment of anti-smog guns and mechanized dust suppression on active sites.'}
C. VEHICULAR TRAFFIC: ${bans.oddEven ? 'Immediate enforcement of the Odd-Even private four-wheeler rationing scheme across NCT Delhi.' : 'Strict prohibition on the plying of BS-III Petrol and BS-IV Diesel passenger motor vehicles.'}
D. POWER GENERATION: Complete ban on the operation of Diesel Generator (DG) sets across all residential, commercial, and industrial facilities (except emergency healthcare, water supply, and metro rail).
E. INSTITUTIONS & OFFICES: Discontinuation of physical classes up to Class IX and Class XI (shift to online schooling); 50% capacity Work-From-Home (WFH) for all public and private offices.

ENFORCEMENT AGENCIES ENJOINED:
- Special Commissioner of Police (Traffic), Delhi Police
- Commissioners of Municipal Corporation of Delhi (MCD) & NDMC
- Commissioner, Transport Department, GNCTD
- Engineer-in-Chief, Public Works Department (PWD)
- Managing Director, Delhi Metro Rail Corporation (DMRC)

PENAL PROVISIONS:
Non-compliance with this Order shall attract immediate prosecution under Section 14 of the Commission for Air Quality Management Act, 2021, punishable with imprisonment for a term up to five (5) years, or with fine up to ₹1,00,00,000 (Rupees One Crore), or both.

BY ORDER AND IN THE NAME OF THE COMMISSION,

(Dr. K. S. Meena, IAS)
Member Secretary, Delhi Pollution Control Committee
Director (Air Quality Enforcement), Central Pollution Control Board
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="order-modal-toolbar">
          <div className="order-modal-title">
            <FileCheck size={18} color="#10b981" />
            <span>Statutory Municipal GRAP Notification</span>
          </div>
          <div className="order-modal-actions">
            <button type="button" className="order-action-btn order-action-btn--print" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print Order (PDF)</span>
            </button>
            <button type="button" className="order-action-btn order-action-btn--copy" onClick={handleCopy}>
              <Copy size={15} />
              <span>{copied ? '✓ Copied' : 'Copy Order Text'}</span>
            </button>
            <button type="button" className="order-action-btn order-action-btn--close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="order-document-sheet" id="printable-grap-order">
          <div className="order-doc-header">
            <div className="govt-emblem">🏛️</div>
            <div className="govt-title">COMMISSION FOR AIR QUALITY MANAGEMENT IN NCR & ADJOINING AREAS</div>
            <div className="govt-sub">CENTRAL POLLUTION CONTROL BOARD / DELHI POLLUTION CONTROL COMMITTEE</div>
            <div className="govt-address">Parivesh Bhawan, East Arjun Nagar, Delhi-110032 | 4th Floor, ISBT Kashmere Gate, Delhi-110006</div>
            <div className="govt-divider"></div>
          </div>

          <div className="order-meta-row">
            <div><strong>ORDER NO:</strong> {orderRef}</div>
            <div><strong>DATE:</strong> {dateFormatted}</div>
          </div>

          <div className="order-subject-block">
            <strong>SUBJECT: STATUTORY DIRECTION UNDER SECTION 12 OF THE CAQM ACT, 2021 READ WITH SECTION 31A OF THE AIR (PREVENTION & CONTROL OF POLLUTION) ACT, 1981 — MANDATORY ENFORCEMENT OF {stageName.toUpperCase()} UNDER THE GRADED RESPONSE ACTION PLAN (GRAP).</strong>
          </div>

          <div className="order-body-text">
            <p>
              <strong>WHEREAS</strong>, real-time telemetry and 72-hour coupled atmospheric forecast models operated by CPCB/IMD project critical air quality degradation with forecasted peak AQI reaching <strong>{baselineAqi}</strong> at <strong>{stationName}</strong>, compounded by nocturnal temperature inversion (&lt;260m) and agricultural smoke influx;
            </p>
            <p>
              <strong>AND WHEREAS</strong>, predictive policy simulation indicates that targeted emission mitigations lower projected average AQI to <strong>{simulatedAqi}</strong>, averting severe hospital emergency loads and acute respiratory crises;
            </p>
            <p>
              <strong>NOW, THEREFORE</strong>, the Commission hereby directs that the following statutory emergency curbs be implemented with immediate effect across the entire National Capital Territory of Delhi and adjoining NCR districts:
            </p>

            <ol className="order-directives-list">
              <li>
                <strong>Heavy Goods Transport:</strong> {bans.truckBan ? 'Complete entry ban on non-essential medium and heavy diesel commercial vehicles into NCT Delhi (except essential goods/services and CNG/EV).' : 'Intensive border checkpoint inspection and zero-emission prioritization.'}
              </li>
              <li>
                <strong>Construction & Demolition (C&D):</strong> {bans.constructionBan ? 'Total cessation of all civil construction, demolition, stone crushers, earthwork, and ready-mix concrete batching plants.' : 'Mandatory deployment of anti-smog guns and continuous dust suppression misting.'}
              </li>
              <li>
                <strong>Private Motor Vehicles:</strong> {bans.oddEven ? 'Immediate enforcement of the Odd-Even vehicular rationing rule for private four-wheelers across NCT Delhi.' : 'Strict prohibition on BS-III Petrol and BS-IV Diesel private motor vehicles.'}
              </li>
              <li>
                <strong>Diesel Generator Sets:</strong> Complete prohibition on the operation of DG sets across residential, commercial, and industrial facilities, except emergency healthcare, water supply, and metro rail.
              </li>
              <li>
                <strong>Educational & Corporate Directives:</strong> Discontinuation of physical classes up to Class IX & XI (switch to online mode); 50% capacity Work-From-Home for public and private establishments.
              </li>
            </ol>

            <p className="order-penalty-notice">
              <strong>PENAL PROVISIONS:</strong> Non-compliance with this Order shall attract immediate penal action under Section 14 of the CAQM Act, 2021, punishable with imprisonment up to <strong>5 years</strong>, or fine up to <strong>₹1,00,00,000 (Rupees One Crore)</strong>, or both.
            </p>
          </div>

          <div className="order-signature-block">
            <div className="sig-space">
              <div className="sig-seal">OFFICIAL SEAL<br/>DPCC / CAQM</div>
              <div className="sig-name"><strong>(Dr. K. S. Meena, IAS)</strong></div>
              <div className="sig-role">Member Secretary, Delhi Pollution Control Committee</div>
              <div className="sig-role">Director (Air Quality Enforcement), Central Pollution Control Board</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
