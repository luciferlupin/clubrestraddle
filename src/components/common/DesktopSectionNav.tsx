import React from 'react';

export interface DesktopSectionNavItem<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DesktopSectionNavProps<T extends string> {
  ariaLabel: string;
  activeId: T;
  items: DesktopSectionNavItem<T>[];
  onChange: (id: T) => void;
  className?: string;
}

export const DesktopSectionNav = <T extends string>({
  ariaLabel,
  activeId,
  items,
  onChange,
  className = '',
}: DesktopSectionNavProps<T>) => (
  <nav className={`desktop-section-nav ${className}`.trim()} aria-label={ariaLabel}>
    {items.map(item => (
      <button
        key={item.id}
        type="button"
        className={`desktop-section-nav-item ${activeId === item.id ? 'active' : ''}`}
        aria-current={activeId === item.id ? 'page' : undefined}
        onClick={() => onChange(item.id)}
      >
        <span className="desktop-section-nav-icon" aria-hidden="true">{item.icon}</span>
        <span>{item.label}</span>
        {!!item.badge && <span className="desktop-section-nav-badge">{item.badge}</span>}
      </button>
    ))}
  </nav>
);
