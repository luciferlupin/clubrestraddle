import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileBottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const MobileBottomDrawer: React.FC<MobileBottomDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="m-drawer-overlay" onClick={onClose}>
      <div className="m-drawer-content" onClick={e => e.stopPropagation()}>
        <div className="m-drawer-handle" />
        <div className="m-drawer-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="m-drawer-body">{children}</div>
        {footer && <div className="m-drawer-footer">{footer}</div>}
      </div>
    </div>
  );
};
