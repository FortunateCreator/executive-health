import React, { useEffect, useState } from 'react';
import type { RiskCategory } from '@executive-health/core';

interface ExecutiveScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getRiskCategory(score: number): RiskCategory {
  if (score >= 80) return 'low';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'high';
  return 'critical';
}

function getRiskLabel(category: RiskCategory): string {
  switch (category) {
    case 'low': return 'Low Risk';
    case 'moderate': return 'Moderate Risk';
    case 'high': return 'High Risk';
    case 'critical': return 'Critical Risk';
  }
}

function getRiskColor(category: RiskCategory): string {
  switch (category) {
    case 'low': return '#22c55e';
    case 'moderate': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
  }
}

const ExecutiveScoreRing: React.FC<ExecutiveScoreRingProps> = ({
  score,
  size = 200,
  strokeWidth = 12,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const scoreColor = getScoreColor(score);
  const riskCategory = getRiskCategory(score);
  const riskLabel = getRiskLabel(riskCategory);
  const riskColor = getRiskColor(riskCategory);
  const dashOffset = circumference - (animatedScore / 100) * circumference;
  const fontSize = Math.round(size * 0.2);
  const labelFontSize = Math.round(size * 0.06);
  const badgeFontSize = Math.round(size * 0.055);

  return (
    <>
      <style>{`
        .eh-score-ring-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .eh-score-ring-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .eh-score-ring-svg {
          transform: rotate(-90deg);
          display: block;
        }
        .eh-score-ring-center {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .eh-score-ring-value {
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          transition: none;
        }
        .eh-score-ring-label {
          color: #94a3b8;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 1px;
          line-height: 1;
        }
        .eh-score-ring-badge {
          margin-top: clamp(4px, 1vw, 8px);
          padding: 2px 12px;
          border-radius: 9999px;
          color: #ffffff;
          font-weight: 600;
          line-height: 1.4;
          white-space: nowrap;
        }

        /* Pulse animation on the outer ring */
        .eh-score-ring-glow {
          animation: eh-pulse-ring 3s ease-in-out infinite;
        }
      `}</style>

      <div className="eh-score-ring-container">
        <div className="eh-score-ring-wrapper">
          <svg
            className="eh-score-ring-svg eh-score-ring-glow"
            viewBox={`0 0 ${size} ${size}`}
            style={{ width: size, height: size }}
          >
            {/* Subtle background glow */}
            <circle
              cx={center}
              cy={center}
              r={radius + 3}
              fill="none"
              stroke={scoreColor}
              strokeWidth={1}
              opacity={0.15}
            />
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#1a1a2e"
              strokeWidth={strokeWidth}
            />
            {/* Animated score arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </svg>
          <div className="eh-score-ring-center">
            <span className="eh-score-ring-value" style={{ fontSize }}>
              {animatedScore}
            </span>
            <span className="eh-score-ring-label" style={{ fontSize: labelFontSize }}>
              HEALTH SCORE
            </span>
          </div>
        </div>
        <div
          className="eh-score-ring-badge"
          style={{
            backgroundColor: riskColor,
            fontSize: badgeFontSize,
          }}
        >
          {riskLabel}
        </div>
      </div>
    </>
  );
};

export default ExecutiveScoreRing;
