import React from 'react';

interface DataPoint {
  date: string;
  score: number;
}

interface TrendChartSimplifiedProps {
  dataPoints: DataPoint[];
  width?: number;
  height?: number;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

const TrendChartSimplified: React.FC<TrendChartSimplifiedProps> = ({
  dataPoints,
  width = 600,
  height = 300,
}) => {
  // Padding for axes and labels
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  if (dataPoints.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: '#1a1a2e',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 16,
        }}
      >
        No data yet
      </div>
    );
  }

  // Y-axis labels
  const yLabels = [0, 20, 40, 60, 80, 100];

  // Scale functions
  const xScale = (i: number) =>
    padLeft + (dataPoints.length > 1 ? (i / (dataPoints.length - 1)) * chartWidth : chartWidth / 2);
  const yScale = (score: number) =>
    padTop + chartHeight - (score / 100) * chartHeight;

  // Build polyline points string
  const pointsStr = dataPoints
    .map((d, i) => `${xScale(i)},${yScale(d.score)}`)
    .join(' ');

  const containerStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  };

  const dotColor = (i: number) =>
    i === dataPoints.length - 1 ? '#22c55e' : '#60a5fa';

  const dotRadius = (i: number) =>
    i === dataPoints.length - 1 ? 5 : 3.5;

  return (
    <div style={containerStyle}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {yLabels.map((val) => {
          const y = yScale(val);
          return (
            <g key={`grid-${val}`}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#2a2a4e"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                fill="#64748b"
                fontSize={11}
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {dataPoints.map((d, i) => {
          // Show first, last, and roughly every other label to avoid crowding
          const total = dataPoints.length;
          const showLabel =
            i === 0 ||
            i === total - 1 ||
            (total <= 7) ||
            (total > 7 && i % Math.ceil(total / 6) === 0);
          if (!showLabel) return null;
          return (
            <text
              key={`xlabel-${i}`}
              x={xScale(i)}
              y={height - 8}
              fill="#64748b"
              fontSize={10}
              textAnchor="middle"
            >
              {formatDate(d.date)}
            </text>
          );
        })}

        {/* Line */}
        <polyline
          points={pointsStr}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Area fill under the line */}
        {dataPoints.length > 0 && (
          <polygon
            points={`${xScale(0)},${yScale(0)} ${pointsStr} ${xScale(dataPoints.length - 1)},${yScale(0)}`}
            fill="url(#gradient)"
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Data point dots */}
        {dataPoints.map((d, i) => (
          <circle
            key={`dot-${i}`}
            cx={xScale(i)}
            cy={yScale(d.score)}
            r={dotRadius(i)}
            fill={dotColor(i)}
            stroke={i === dataPoints.length - 1 ? '#1a1a2e' : 'none'}
            strokeWidth={i === dataPoints.length - 1 ? 2 : 0}
          />
        ))}

        {/* Last point highlight ring */}
        {dataPoints.length > 0 && (
          <circle
            cx={xScale(dataPoints.length - 1)}
            cy={yScale(dataPoints[dataPoints.length - 1].score)}
            r={9}
            fill="none"
            stroke="#22c55e"
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
        )}
      </svg>
    </div>
  );
};

export default TrendChartSimplified;
