import React from 'react';

export interface TrendData {
  module: string;
  icon: string;
  metrics: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
  summary: string;
  alertCount?: number;
  actionUrl?: string;
}

interface TrendCardProps {
  data: TrendData;
  onAction?: (url: string) => void;
}

const TREND_ARROWS: Record<TrendData['metrics'][number]['trend'], { symbol: string; color: string }> = {
  up:    { symbol: '↑', color: '#22c55e' },
  down:  { symbol: '↓', color: '#ef4444' },
  stable:{ symbol: '—', color: '#6b7280' },
};

const TREND_BG: Record<TrendData['metrics'][number]['trend'], string> = {
  up:    'rgba(34, 197, 94, 0.1)',
  down:  'rgba(239, 68, 68, 0.1)',
  stable:'rgba(107, 114, 128, 0.1)',
};

export default function TrendCard({ data, onAction }: TrendCardProps) {
  const isClickable = !!data.actionUrl;

  const handleClick = () => {
    if (data.actionUrl) onAction?.(data.actionUrl);
  };

  return (
    <>
      <style>{`
        .eh-tc-card {
          background: var(--bg-card);
          border-radius: clamp(12px, 2.5vw, 16px);
          border: 1px solid var(--border-light);
          padding: clamp(14px, 3vw, 20px);
          cursor: default;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 2vw, 14px);
          min-width: 0;
          overflow: hidden;
        }
        .eh-tc-card.eh-tc-clickable {
          cursor: pointer;
        }
        .eh-tc-card.eh-tc-clickable:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          border-color: rgba(99, 102, 241, 0.3);
          background: var(--bg-card-hover);
        }
        .eh-tc-card.eh-tc-clickable:active {
          transform: translateY(-1px) scale(0.99);
        }
        .eh-tc-card.eh-tc-clickable:hover .eh-tc-module-name {
          color: #60a5fa;
        }
        .eh-tc-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .eh-tc-icon {
          font-size: clamp(20px, 2.5vw, 24px);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .eh-tc-card.eh-tc-clickable:hover .eh-tc-icon {
          transform: scale(1.1);
        }
        .eh-tc-module-name {
          font-size: clamp(14px, 2vw, 15px);
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.2s ease;
        }
        .eh-tc-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          border-radius: 99px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 0 6px;
          margin-left: auto;
          flex-shrink: 0;
          animation: eh-pulse-gentle 2.5s ease-in-out infinite;
        }
        .eh-tc-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .eh-tc-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .eh-tc-metric-label {
          font-size: clamp(11px, 1.5vw, 12px);
          color: var(--text-secondary);
        }
        .eh-tc-metric-value {
          font-size: clamp(12px, 1.7vw, 13px);
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .eh-tc-arrow {
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        .eh-tc-summary {
          font-size: clamp(11px, 1.5vw, 12px);
          color: #7c8aa0;
          line-height: 1.5;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .eh-tc-card {
            border-radius: 16px;
            padding: clamp(12px, 3vw, 14px);
          }
        }
      `}</style>

      <div
        className={`eh-tc-card${isClickable ? ' eh-tc-clickable' : ''}`}
        onClick={handleClick}
      >
        <div className="eh-tc-header">
          <span className="eh-tc-icon">{data.icon}</span>
          <span className="eh-tc-module-name">{data.module}</span>
          {data.alertCount != null && data.alertCount > 0 && (
            <span className="eh-tc-badge">{data.alertCount}</span>
          )}
        </div>

        <div className="eh-tc-metrics">
          {data.metrics.map((m, i) => {
            const a = TREND_ARROWS[m.trend];
            const bg = TREND_BG[m.trend];
            return (
              <div key={i} className="eh-tc-metric-row">
                <span className="eh-tc-metric-label">{m.label}</span>
                <span className="eh-tc-metric-value">
                  {m.value}
                  <span
                    className="eh-tc-arrow"
                    style={{ color: a.color, background: bg }}
                  >
                    {a.symbol}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="eh-tc-summary">{data.summary}</div>
      </div>
    </>
  );
}
