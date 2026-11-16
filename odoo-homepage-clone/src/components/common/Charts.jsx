import React, { useState } from 'react';

/**
 * Interactive Area / Line Trend Chart for Monthly Inbound vs Outbound Movements
 */
export const AreaTrendChart = ({ data = [], height = 240 }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">No trend data available</div>;
  }

  const width = 600;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...data.map(d => Math.max(Number(d.inbound) || 0, Number(d.outbound) || 0, 10))
  ) * 1.15;

  const getX = (idx) => padding.left + (idx / Math.max(1, data.length - 1)) * chartW;
  const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

  // Build SVG Paths
  const inboundPoints = data.map((d, i) => `${getX(i)},${getY(d.inbound)}`).join(' ');
  const outboundPoints = data.map((d, i) => `${getX(i)},${getY(d.outbound)}`).join(' ');

  const inboundArea = `${padding.left},${getY(0)} ${inboundPoints} ${getX(data.length - 1)},${getY(0)}`;
  const outboundArea = `${padding.left},${getY(0)} ${outboundPoints} ${getX(data.length - 1)},${getY(0)}`;

  // Y-axis ticks
  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), Math.round(maxVal)];

  return (
    <div className="chart-wrapper">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
          <span>Stock Inbound</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
          <span>Stock Outbound</span>
        </div>
      </div>

      <div className="chart-svg-container" style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="responsive-chart-svg">
          <defs>
            <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={width - padding.right}
                y2={getY(tick)}
                stroke="var(--border-color, #334155)"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={padding.left - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted, #94a3b8)"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Fill Areas */}
          <polygon points={inboundArea} fill="url(#inboundGrad)" />
          <polygon points={outboundArea} fill="url(#outboundGrad)" />

          {/* Stroke Lines */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={inboundPoints}
          />
          <polyline
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={outboundPoints}
          />

          {/* Data Points & X labels */}
          {data.map((d, i) => {
            const x = getX(i);
            const yIn = getY(d.inbound);
            const yOut = getY(d.outbound);
            const isHovered = hoverIndex === i;

            return (
              <g key={`pt-${i}`}>
                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartH}
                    stroke="var(--accent-primary, #6366f1)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Circles */}
                <circle
                  cx={x}
                  cy={yIn}
                  r={isHovered ? 6 : 4}
                  fill="#10b981"
                  stroke="var(--bg-card, #1e293b)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.2s ease' }}
                />
                <circle
                  cx={x}
                  cy={yOut}
                  r={isHovered ? 6 : 4}
                  fill="#8b5cf6"
                  stroke="var(--bg-card, #1e293b)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* X-axis labels */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={isHovered ? '600' : '400'}
                  fill={isHovered ? 'var(--text-primary, #fff)' : 'var(--text-muted, #94a3b8)'}
                >
                  {d.month}
                </text>

                {/* Transparent overlay column for easy hover trigger */}
                <rect
                  x={x - chartW / (data.length * 2)}
                  y={padding.top}
                  width={chartW / data.length}
                  height={chartH}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(getX(hoverIndex) / width) * 100}%`,
              transform: 'translate(-50%, -110%)',
              top: `${getY(Math.max(data[hoverIndex].inbound, data[hoverIndex].outbound))}px`
            }}
          >
            <div className="tooltip-title">{data[hoverIndex].month} Activity</div>
            <div className="tooltip-row">
              <span className="tooltip-key" style={{ color: '#10b981' }}>● Inbound:</span>
              <span className="tooltip-val">{data[hoverIndex].inbound} units</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-key" style={{ color: '#8b5cf6' }}>● Outbound:</span>
              <span className="tooltip-val">{data[hoverIndex].outbound} units</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Interactive Donut Chart for Stock Availability Overview
 */
export const DonutChart = ({ data = [], totalCount = 0 }) => {
  const [activeSegment, setActiveSegment] = useState(null);

  const total = totalCount || data.reduce((sum, d) => sum + (Number(d.count) || 0), 0);
  const size = 200;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-container">
      <div className="donut-svg-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--border-color, #334155)"
              strokeWidth={strokeWidth}
            />
          ) : (
            data.map((item, idx) => {
              const count = Number(item.count) || 0;
              const percent = count / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -(accumulatedPercent * circumference);
              accumulatedPercent += percent;

              const isHovered = activeSegment === idx;

              return (
                <circle
                  key={`donut-${idx}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color || '#3b82f6'}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    opacity: activeSegment !== null && !isHovered ? 0.6 : 1
                  }}
                  onMouseEnter={() => setActiveSegment(idx)}
                  onMouseLeave={() => setActiveSegment(null)}
                />
              );
            })
          )}
        </svg>

        {/* Center label */}
        <div className="donut-center-text">
          <div className="donut-center-value">
            {activeSegment !== null && data[activeSegment]
              ? data[activeSegment].count
              : total}
          </div>
          <div className="donut-center-label">
            {activeSegment !== null && data[activeSegment]
              ? data[activeSegment].label
              : 'Total Items'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="donut-legend-list">
        {data.map((item, idx) => {
          const count = Number(item.count) || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isHovered = activeSegment === idx;

          return (
            <div
              key={`leg-${idx}`}
              className={`donut-legend-row ${isHovered ? 'active' : ''}`}
              onMouseEnter={() => setActiveSegment(idx)}
              onMouseLeave={() => setActiveSegment(null)}
            >
              <div className="legend-indicator">
                <span className="legend-color-box" style={{ backgroundColor: item.color }}></span>
                <span className="legend-name">{item.label}</span>
              </div>
              <div className="legend-values">
                <span className="legend-count">{count}</span>
                <span className="legend-percent">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Category-wise Inventory Distribution Bar Chart
 */
export const BarDistributionChart = ({ categories = [], currency = '$' }) => {
  const [hoveredCat, setHoveredCat] = useState(null);

  if (!categories || categories.length === 0) {
    return <div className="chart-empty">No category data available</div>;
  }

  const maxVal = Math.max(...categories.map(c => Number(c.value) || 0), 1000);

  return (
    <div className="category-bars-wrapper">
      {categories.map((cat, idx) => {
        const val = Number(cat.value) || 0;
        const stock = Number(cat.stock) || 0;
        const count = Number(cat.count) || 0;
        const percent = Math.min(100, Math.max(8, (val / maxVal) * 100));
        const isHovered = hoveredCat === idx;

        return (
          <div
            key={cat.id || idx}
            className={`cat-bar-item ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredCat(idx)}
            onMouseLeave={() => setHoveredCat(null)}
          >
            <div className="cat-bar-header">
              <span className="cat-name">
                <span className="cat-color-dot" style={{ backgroundColor: cat.color || '#6366f1' }}></span>
                {cat.name}
              </span>
              <div className="cat-metrics">
                <span className="cat-stock-badge">{stock} in stock ({count} items)</span>
                <span className="cat-value-text">{currency}{val.toLocaleString()}</span>
              </div>
            </div>

            <div className="cat-progress-track">
              <div
                className="cat-progress-fill"
                style={{
                  width: `${percent}%`,
                  backgroundColor: cat.color || '#6366f1'
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
