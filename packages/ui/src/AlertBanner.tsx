import React, { useState } from 'react';

export interface AlertData {
  id: string;
  type: 'predictive' | 'proactive' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  body: string;
  module: string;
  actionUrl?: string;
  generatedAt: string;
}

interface AlertBannerProps {
  alert: AlertData;
  onDismiss?: (id: string) => void;
  onAction?: (url: string) => void;
}

const PRIORITY_COLORS: Record<AlertData['priority'], { border: string; background: string; badge: string }> = {
  urgent: { border: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', badge: '#ef4444' },
  high: { border: '#f97316', background: 'rgba(249, 115, 22, 0.08)', badge: '#f97316' },
  medium: { border: '#3b82f6', background: 'rgba(59, 130, 246, 0.08)', badge: '#3b82f6' },
  low: { border: '#6b7280', background: 'rgba(107, 114, 128, 0.08)', badge: '#6b7280' },
};

const TYPE_LABELS: Record<AlertData['type'], string> = {
  predictive: 'Predicted',
  proactive: 'Action',
  insight: 'Insight',
};

const MODULE_ICONS: Record<string, string> = {
  sleep: '🌙',
  nutrition: '🥗',
  stress: '🧘',
  healthScore: '🫀',
  cross_module: '🔗',
};

export default function AlertBanner({ alert, onDismiss, onAction }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (dismissed) return null;

  const colors = PRIORITY_COLORS[alert.priority];
  const moduleIcon = MODULE_ICONS[alert.module] ?? '📊';

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(() => {
      setDismissed(true);
      onDismiss?.(alert.id);
    }, 250);
  };

  return (
    <>
      <style>{`
        .eh-alert-banner {
          display: flex;
          align-items: flex-start;
          gap: clamp(10px, 2vw, 14px);
          padding: clamp(12px, 2.5vw, 14px) clamp(14px, 3vw, 18px);
          border-radius: clamp(10px, 2vw, 12px);
          border: 1px solid var(--border-light);
          margin-bottom: clamp(10px, 2vw, 14px);
          position: relative;
          transition: opacity 0.25s ease, transform 0.25s ease, max-height 0.25s ease;
          overflow: hidden;
          animation: eh-slide-in-right 0.3s ease forwards;
        }
        .eh-alert-banner.eh-alert-dismissing {
          opacity: 0;
          transform: translateX(20px);
          max-height: 0;
          margin-bottom: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
        .eh-alert-banner-icon {
          font-size: clamp(18px, 2.5vw, 20px);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .eh-alert-banner-body {
          flex: 1;
          min-width: 0;
        }
        .eh-alert-banner-module {
          font-size: clamp(10px, 1.4vw, 11px);
          color: var(--text-muted);
          text-transform: capitalize;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .eh-alert-banner-type-badge {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #fff;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .eh-alert-banner-title {
          font-size: clamp(13px, 2vw, 14px);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .eh-alert-banner-body-text {
          font-size: clamp(12px, 1.7vw, 13px);
          color: var(--text-secondary);
          line-height: 1.55;
        }
        .eh-alert-banner-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: clamp(6px, 1.5vw, 10px);
          flex-wrap: wrap;
        }
        .eh-alert-action-btn {
          padding: 5px 14px;
          border-radius: 6px;
          border: none;
          background: transparent;
          font-size: clamp(11px, 1.5vw, 12px);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
        }
        .eh-alert-dismiss-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          padding: 2px 6px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: -1px;
          border-radius: 4px;
          transition: color 0.15s, background-color 0.15s;
          min-width: 28px;
          min-height: 28px;
        }
        .eh-alert-dismiss-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 480px) {
          .eh-alert-banner {
            padding: 12px;
            gap: 10px;
          }
          .eh-alert-action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div
        className={`eh-alert-banner${dismissing ? ' eh-alert-dismissing' : ''}`}
        style={{ background: colors.background, borderLeft: `4px solid ${colors.border}` }}
      >
        <span className="eh-alert-banner-icon">{moduleIcon}</span>
        <div className="eh-alert-banner-body">
          <div className="eh-alert-banner-module">
            <span className="eh-alert-banner-type-badge" style={{ background: colors.badge }}>
              {TYPE_LABELS[alert.type]}
            </span>
            {alert.module.replace('_', ' ')}
          </div>
          <div className="eh-alert-banner-title">{alert.title}</div>
          <div className="eh-alert-banner-body-text">{alert.body}</div>
          {alert.actionUrl && (
            <div className="eh-alert-banner-actions">
              <button
                className="eh-alert-action-btn"
                style={{ border: `1px solid ${colors.border}`, color: colors.border }}
                onClick={() => onAction?.(alert.actionUrl!)}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = colors.border;
                  el.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.color = colors.border;
                }}
              >
                View details →
              </button>
            </div>
          )}
        </div>
        <button
          className="eh-alert-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      </div>
    </>
  );
}
