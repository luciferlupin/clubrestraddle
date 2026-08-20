import React, { useState } from 'react';
import { UserPlus, UserCheck, QrCode, Shield, CheckCircle, User, History } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { KYCRegistrationForm } from './KYCRegistrationForm';
import { DailyCheckInCard } from './DailyCheckInCard';
import { PlayerPass } from './PlayerPass';
import { CheckInHistory } from './CheckInHistory';
import { PlayerProfile } from './PlayerProfile';

interface PlayerPortalProps {
  onOpenQR: () => void;
  showNewPlayerFormInitially?: boolean;
}

export const PlayerPortal: React.FC<PlayerPortalProps> = ({ onOpenQR, showNewPlayerFormInitially = false }) => {
  const { currentPlayer, checkIns, hasPlayerCheckedInToday } = useClub();
  const [showKYCForm, setShowKYCForm] = useState(showNewPlayerFormInitially);
  const [activeTab, setActiveTab] = useState<'pass' | 'history' | 'profile'>('pass');

  const playerCheckIns = currentPlayer
    ? checkIns.filter(c => c.playerId === currentPlayer.id)
    : [];

  const todayCheckIn = currentPlayer ? hasPlayerCheckedInToday(currentPlayer.id) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Quick Actions & Daily Rules */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-light)',
            }}
          >
            <QrCode size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
              Player Portal • Daily Club Entry Station
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong>Daily Rule:</strong> New player → Complete KYC + check-in. Existing player → Only daily check-in required.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${showKYCForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setShowKYCForm(!showKYCForm)}
          >
            {showKYCForm ? (
              <>
                <UserCheck size={16} /> View Current Player
              </>
            ) : (
              <>
                <UserPlus size={16} /> Register as New Player (KYC)
              </>
            )}
          </button>

          <button className="btn btn-secondary" onClick={onOpenQR} title="View Physical Registration QR Standee">
            <QrCode size={16} color="#f59e0b" /> Entrance QR
          </button>
        </div>
      </div>

      {showKYCForm ? (
        <KYCRegistrationForm
          onSuccess={() => setShowKYCForm(false)}
          onCancel={() => setShowKYCForm(false)}
        />
      ) : currentPlayer ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '20px' }}>
          {/* Left Column: Digital Pass & Daily Check-in */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <PlayerPass player={currentPlayer} todayCheckIn={todayCheckIn} />
            <DailyCheckInCard player={currentPlayer} />
          </div>

          {/* Right Column: Tabbed View for History, KYC Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sub-nav-tabs">
              <button
                className={`sub-tab-btn ${activeTab === 'pass' ? 'active' : ''}`}
                onClick={() => setActiveTab('pass')}
              >
                <CheckCircle size={15} /> Check-In & Status
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={15} /> Profile & KYC Details
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={15} /> Check-In History ({playerCheckIns.length})
              </button>
            </div>

            {activeTab === 'pass' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <PlayerProfile player={currentPlayer} />
                <CheckInHistory checkIns={playerCheckIns} />
              </div>
            )}

            {activeTab === 'profile' && <PlayerProfile player={currentPlayer} />}

            {activeTab === 'history' && <CheckInHistory checkIns={playerCheckIns} />}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No player selected.</p>
          <button className="btn btn-primary" onClick={() => setShowKYCForm(true)}>
            <UserPlus size={16} /> Start New Player KYC Registration
          </button>
        </div>
      )}
    </div>
  );
};
