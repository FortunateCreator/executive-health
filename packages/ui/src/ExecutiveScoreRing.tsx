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
    // Animate from 0 to score on mount
    const duration = 1000;
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

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const ringContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
  };

  const svgStyle: React.CSSProperties = {
    transform: 'rotate(-90deg)',
    width: size,
    height: size,
  };

  const centerContentStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: size,
    height: size,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const scoreTextStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1,
  };

  const labelTextStyle: React.CSSProperties = {
    fontSize: labelFontSize,
    color: '#94a3b8',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  };

  const badgeStyle: React.CSSProperties = {
    marginTop: 6,
    padding: '2px 12px',
    borderRadius: 9999,
    backgroundColor: riskColor,
    color: '#ffffff',
    fontSize: badgeFontSize,
    fontWeight: 600,
  };

  return (
    <div style={containerStyle}>
      <div style={ringContainerStyle}>
        <svg style={svgStyle} viewBox={`0 0 ${size} ${size}`}>
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
              transition: 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>
        <div style={centerContentStyle}>
          <span style={scoreTextStyle}>{animatedScore}</span>
          <span style={labelTextStyle}>HEALTH SCORE</span>
        </div>
      </div>
      <div style={badgeStyle}>{riskLabel}</div>
    </div>
  );
};

export default ExecutiveScoreRing;
