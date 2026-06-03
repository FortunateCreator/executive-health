import React from 'react';
import type { RiskCategory } from '@executive-health/core';

interface RiskBadgeProps {
  category: RiskCategory;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<string, { padding: string; fontSize: number }> = {
  sm: { padding: '2px 8px', fontSize: 11 },
  md: { padding: '4px 12px', fontSize: 13 },
  lg: { padding: '6px 16px', fontSize: 15 },
};

const colorMap: Record<RiskCategory, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const labelMap: Record<RiskCategory, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

const RiskBadge: React.FC<RiskBadgeProps> = ({ category, size = 'md' }) => {
  const { padding, fontSize } = sizeMap[size];
  const bgColor = colorMap[category];
  const label = labelMap[category];

  const style: React.CSSProperties = {
    display: 'inline-block',
    padding,
    borderRadius: 9999,
    backgroundColor: bgColor,
    color: '#ffffff',
    fontSize,
    fontWeight: 600,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  };

  return <span style={style}>{label}</span>;
};

export default RiskBadge;
