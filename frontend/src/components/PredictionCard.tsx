import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle, AlertTriangle, ShieldAlert, Cpu, Recycle,
  ArrowRight, Info, ChevronDown, Leaf
} from 'lucide-react';
import './PredictionCard.css';

interface PredictionData {
  device: string;
  confidence: number;
  prediction_type: string;
  hazard: { level: string; reason?: string };
  metals: { dominant: string; composition: { name: string; percentage: number }[] };
  recyclability: { status: string; method: string };
  environmental_impact: string;
  reuse: string;
  user_guidance: string;
  alternatives?: { device: string; confidence: number }[];
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title, icon, defaultOpen = false, children
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`collapsible-section ${open ? 'open' : ''}`}>
      <button className="collapsible-header" onClick={() => setOpen((p) => !p)}>
        <span className="collapsible-title">
          {icon}
          {title}
        </span>
        <ChevronDown size={16} className="chevron-icon" />
      </button>
      <div
        className="collapsible-body"
        ref={bodyRef}
        style={{ maxHeight: open ? `${bodyRef.current?.scrollHeight ?? 600}px` : '0px' }}
      >
        <div className="collapsible-inner">{children}</div>
      </div>
    </div>
  );
};

const PredictionCard: React.FC<{ data: PredictionData }> = ({ data }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [barAnimated, setBarAnimated] = useState(false);

  // Animate confidence bar from 0 → actual value on mount
  useEffect(() => {
    const timer = setTimeout(() => setBarAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const badgeColor = data.prediction_type === 'strong'
    ? 'success' : data.prediction_type === 'moderate' ? 'warning' : 'danger';

  const hazardColor = (() => {
    const l = data.hazard.level.toLowerCase();
    if (l.includes('high')) return 'danger';
    if (l.includes('medium') || l.includes('moderate')) return 'warning';
    return 'success';
  })();

  return (
    <div className="prediction-card glass-panel animate-card-in">

      {/* 9️⃣ Smart UX Banners */}
      {data.prediction_type === 'weak' && (
        <div className="smart-banner banner-danger">
          <AlertTriangle size={18} />
          <span>Model uncertain. Capture a clearer image for better results.</span>
        </div>
      )}
      {data.prediction_type === 'moderate' && (
        <div className="smart-banner banner-warning">
          <Info size={18} />
          <span>Moderate confidence — verify result before taking action.</span>
        </div>
      )}

      {/* 1️⃣ Header */}
      <div className="pc-header">
        <div className="pc-title-row">
          <h2 className="pc-device-name">{data.device}</h2>
          <span className={`badge ${badgeColor}`}>
            {data.prediction_type.charAt(0).toUpperCase() + data.prediction_type.slice(1)}
          </span>
        </div>

        {/* Animated Confidence Bar */}
        <div className="pc-confidence-wrap">
          <div className="pc-confidence-label">
            <span className="tooltip-wrapper">
              Confidence
              <span className="tooltip-text">
                How certain the model is. Strong ≥ 80%, Moderate 50–79%, Weak &lt; 50%
              </span>
            </span>
            <strong className={`confidence-value text-${badgeColor}`}>
              {data.confidence.toFixed(1)}%
            </strong>
          </div>
          <div className="confidence-bar-container">
            <div
              ref={barRef}
              className={`confidence-bar ${badgeColor}`}
              style={{ width: barAnimated ? `${data.confidence}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="pc-body">
        {/* 7️⃣ User Guidance — always visible, accent-highlighted */}
        <div className="user-guidance-box">
          <div className="box-header">
            <CheckCircle size={20} />
            <h3>Disposal Action Required</h3>
          </div>
          <p className="guidance-text">{data.user_guidance}</p>
        </div>

        {/* 2️⃣ Hazard */}
        <div className="hazard-row">
          <div className="hazard-label">
            <span className="tooltip-wrapper">
              <ShieldAlert size={16} />
              <span style={{ marginLeft: '0.4rem' }}>Hazard Level</span>
              <span className="tooltip-text">
                High = contains toxic substances (lead, mercury). Low = relatively safe.
              </span>
            </span>
          </div>
          <span className={`badge ${hazardColor}`}>{data.hazard.level}</span>
          {data.hazard.reason && (
            <p className="hazard-reason text-secondary text-sm">{data.hazard.reason}</p>
          )}
        </div>

        {/* 3️⃣ Collapsible — Environmental Impact */}
        <CollapsibleSection
          title="Environmental Impact"
          icon={<Leaf size={16} />}
          defaultOpen={true}
        >
          <p className="clean-paragraph text-secondary">{data.environmental_impact}</p>
        </CollapsibleSection>

        {/* 5️⃣ Collapsible — Recycling Route */}
        <CollapsibleSection
          title="Recycling Route"
          icon={<Recycle size={16} />}
          defaultOpen={false}
        >
          <div className="recycle-content">
            <span className="status-tag">{data.recyclability.status}</span>
            <p className="text-secondary text-sm mt-2">{data.recyclability.method}</p>
            {/* 6️⃣ Reuse */}
            <div className="reuse-inline">
              <span className="info-label">Reuse Potential</span>
              <p className="text-secondary text-sm mt-1">{data.reuse}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* 4️⃣ Collapsible — Metal Composition */}
        <CollapsibleSection
          title="Metal Composition"
          icon={<Cpu size={16} />}
          defaultOpen={false}
        >
          <div className="metal-header-row">
            <span className="dominant-chip">
              Dominant: <strong>{data.metals.dominant}</strong>
            </span>
          </div>
          <table className="composition-table modern-table mt-2">
            <tbody>
              {data.metals.composition.map((item, idx) => (
                <tr
                  key={idx}
                  className={item.name === data.metals.dominant ? 'highlighted-row' : ''}
                >
                  <td>{item.name}</td>
                  <td className="text-right font-medium">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* 8️⃣ Alternatives */}
        {data.prediction_type !== 'strong' && data.alternatives && data.alternatives.length > 0 && (
          <div className="alternatives-section">
            <h4><ArrowRight size={16} className="inline-icon" /> Alternatives Considered</h4>
            <div className="chips-row">
              {data.alternatives.slice(0, 3).map((alt, idx) => (
                <div key={idx} className="alt-chip">
                  {alt.device}
                  <span className="chip-confidence">{alt.confidence.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
