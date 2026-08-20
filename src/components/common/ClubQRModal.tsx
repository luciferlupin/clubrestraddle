import React, { useState } from 'react';
import { QrCode, Check, Copy, UserPlus, UserCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { useClub } from '../../context/ClubContext';

interface ClubQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewPlayerForm: () => void;
}

export const ClubQRModal: React.FC<ClubQRModalProps> = ({
  isOpen,
  onClose,
  onOpenNewPlayerForm,
}) => {
  const { setActiveRole, setSelectedPlayerId, players } = useClub();
  const [copied, setCopied] = useState(false);

  const clubUrl = typeof window !== 'undefined' ? `${window.location.origin}/?portal=player&action=kyc` : 'https://clubshowdown.vercel.app/?portal=player&action=kyc';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(clubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateNewPlayer = () => {
    setActiveRole('player');
    onOpenNewPlayerForm();
    onClose();
  };

  const handleSimulateExistingPlayer = (playerId: string) => {
    setActiveRole('player');
    setSelectedPlayerId(playerId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Club Entrance Registration QR"
      subtitle="Physical QR standee placed at the club front desk"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '3px solid #f59e0b',
          }}
        >
          {/* Stylized QR Code SVG Representation */}
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="180" height="180" fill="white" />
            {/* Top-Left Finder */}
            <rect x="15" y="15" width="45" height="45" rx="6" fill="#0f172a" />
            <rect x="23" y="23" width="29" height="29" rx="3" fill="white" />
            <rect x="29" y="29" width="17" height="17" rx="2" fill="#0f172a" />

            {/* Top-Right Finder */}
            <rect x="120" y="15" width="45" height="45" rx="6" fill="#0f172a" />
            <rect x="128" y="23" width="29" height="29" rx="3" fill="white" />
            <rect x="134" y="29" width="17" height="17" rx="2" fill="#0f172a" />

            {/* Bottom-Left Finder */}
            <rect x="15" y="120" width="45" height="45" rx="6" fill="#0f172a" />
            <rect x="23" y="128" width="29" height="29" rx="3" fill="white" />
            <rect x="29" y="134" width="17" height="17" rx="2" fill="#0f172a" />

            {/* Simulated Data Matrix Dots with Poker Spade Center */}
            <rect x="68" y="20" width="12" height="12" fill="#0f172a" />
            <rect x="88" y="20" width="8" height="20" fill="#0f172a" />
            <rect x="72" y="38" width="10" height="10" fill="#0f172a" />
            <rect x="20" y="68" width="14" height="8" fill="#0f172a" />
            <rect x="40" y="76" width="12" height="14" fill="#0f172a" />
            <rect x="65" y="65" width="50" height="50" rx="8" fill="#f59e0b" />
            <circle cx="90" cy="90" r="18" fill="#0f172a" />
            <path d="M90 79 C87 83 83 87 83 91 C83 95 86 97 89 97 C89.5 97 90 96.8 90 96.8 C90 96.8 90.5 97 91 97 C94 97 97 95 97 91 C97 87 93 83 90 79 Z" fill="#fbbf24" />
            <path d="M89 96 L87 101 L93 101 L91 96 Z" fill="#fbbf24" />

            {/* Lower data blocks */}
            <rect x="68" y="122" width="14" height="12" fill="#0f172a" />
            <rect x="90" y="122" width="12" height="14" fill="#0f172a" />
            <rect x="110" y="122" width="20" height="8" fill="#0f172a" />
            <rect x="140" y="70" width="16" height="12" fill="#0f172a" />
            <rect x="125" y="90" width="12" height="16" fill="#0f172a" />
            <rect x="145" y="110" width="18" height="18" fill="#0f172a" />
            <rect x="70" y="145" width="25" height="10" fill="#0f172a" />
            <rect x="105" y="145" width="15" height="18" fill="#0f172a" />
            <rect x="130" y="140" width="25" height="15" fill="#0f172a" />
          </svg>
          <span style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 800, marginTop: '8px', letterSpacing: '0.05em' }}>
            SCAN FOR KYC REGISTRATION & CHECK-IN
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: '380px' }}>
          When players arrive at the club, scanning this QR code automatically opens the <strong>Player Portal</strong> to complete <strong>KYC registration</strong> or perform <strong>daily check-in</strong>.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleSimulateNewPlayer} style={{ width: '100%' }}>
            <UserPlus size={16} /> Open New Player KYC Form
          </button>

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {players.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => handleSimulateExistingPlayer(players[0].id)}
                style={{ flex: 1 }}
              >
                <UserCheck size={16} /> Check-in as {players[0].fullName.split(' ')[0]}
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleCopyUrl} style={{ flex: 1 }}>
              {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
              <span>{copied ? 'Link Copied' : 'Copy Registration Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
