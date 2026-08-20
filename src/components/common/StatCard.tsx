import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  helper?: string;
  glowColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  helper,
  glowColor = 'rgba(245, 158, 11, 0.1)',
  iconColor = '#fbbf24',
}) => {
  return (
    <div
      className="stat-card"
      style={{ '--stat-glow': glowColor, '--stat-color': iconColor } as React.CSSProperties}
    >
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {helper && <span className="stat-helper">{helper}</span>}
      </div>
      <div className="stat-icon-wrapper">{icon}</div>
    </div>
  );
};
