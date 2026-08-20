import React from 'react';
import { User, DollarSign, ShieldCheck, LayoutDashboard, Check, QrCode } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { UserRole } from '../../types';
import { MobileBottomDrawer } from './MobileBottomDrawer';

interface RoleSwitcherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQR: () => void;
}

export const RoleSwitcherDrawer: React.FC<RoleSwitcherDrawerProps> = ({ isOpen, onClose, onOpenQR }) => {
  const { activeRole, setActiveRole, players, selectedPlayerId, setSelectedPlayerId, todayCheckIns } = useClub();

  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;

  const roles: { role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string; badge?: number }[] = [
    {
      role: 'player',
      title: 'Player portal',
      desc: 'Member check-in, profile and digital pass',
      icon: <User size={20} color="#ffffff" />,
      color: '#e11d48',
    },
    {
      role: 'cashier',
      title: 'Cashier desk',
      desc: 'Entries, billing, vouchers and cash',
      icon: <DollarSign size={20} color="#ffffff" />,
      color: '#e11d48',
    },
    {
      role: 'security',
      title: 'Security desk',
      desc: 'Door queue, scanner and player clearance',
      icon: <ShieldCheck size={20} color="#ffffff" />,
      color: '#e11d48',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      role: 'admin',
      title: 'Admin portal',
      desc: 'Players, staff, finance and audit',
      icon: <LayoutDashboard size={20} color="#ffffff" />,
      color: '#e11d48',
    },
  ];

  const handleSelectRole = (r: UserRole) => {
    setActiveRole(r);
    onClose();
  };

  return (
    <MobileBottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Switch portal"
      subtitle="Choose the desk you want to operate"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {roles.map(item => {
          const isCurrent = activeRole === item.role;
          return (
            <button
              key={item.role}
              type="button"
              onClick={() => handleSelectRole(item.role)}
              aria-current={isCurrent ? 'page' : undefined}
              style={{
                background: isCurrent ? 'var(--bg-card-elevated)' : 'var(--bg-card-subtle)',
                border: `1.5px solid ${isCurrent ? item.color : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.title}
                    {item.badge && (
                      <span
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '999px',
                        }}
                      >
                        {item.badge} pending
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>

              {isCurrent && <Check size={18} color={item.color} />}
            </button>
          );
        })}

        {/* If in Player Portal, allow picking demo player */}
        {activeRole === 'player' && (
          <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Switch Demo Player Account:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {players.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`m-btn m-btn-sm ${selectedPlayerId === p.id ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => {
                    setSelectedPlayerId(p.id);
                    onClose();
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}><User size={15} /> {p.fullName} ({p.membershipTier})</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{p.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Entrance QR Standee Quick Action */}
        <button
          type="button"
          className="m-btn m-btn-secondary"
          style={{ marginTop: '8px' }}
          onClick={() => {
            onClose();
            onOpenQR();
          }}
        >
          <QrCode size={16} color="#ffffff" /> Show Club Registration QR Standee
        </button>
      </div>
    </MobileBottomDrawer>
  );
};
