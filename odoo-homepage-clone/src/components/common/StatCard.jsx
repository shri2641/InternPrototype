import React from 'react';
import Icon from './Icons';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'primary',
  trend,
  trendUp = true,
  alert = false,
  onClick
}) => {
  return (
    <div 
      className={`stat-card ${alert ? 'stat-card-alert' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-top">
        <div className="stat-info">
          <span className="stat-title">{title}</span>
          <h3 className="stat-value">{value}</h3>
        </div>
        <div className={`stat-icon-wrapper icon-bg-${iconBg}`}>
          <Icon name={icon} size={22} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="stat-card-bottom">
          {trend && (
            <span className={`stat-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
              <Icon name={trendUp ? 'trendingUp' : 'trendingDown'} size={14} />
              {trend}
            </span>
          )}
          {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
