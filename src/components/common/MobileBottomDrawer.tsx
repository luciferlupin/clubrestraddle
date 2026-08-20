import React, { useEffect, useId } from 'react';
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
  const titleId = useId();

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
      <div className="m-drawer-content" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={e => e.stopPropagation()}>
        <div className="m-drawer-handle" aria-hidden="true" />
        <div className="m-drawer-header">
          <div>
            <h3 id={titleId} style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
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
