import React, { useState } from 'react';
import { QrCode, Check, Copy, UserPlus, UserCheck, Sparkles, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

  const clubUrl = typeof window !== 'undefined' ? `${window.location.origin}/?action=kyc` : 'https://clubrestraddle.vercel.app/?action=kyc';

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
            border: '3px solid #e11d48',
          }}
        >
          {/* Real Dynamic Scannable QR Code */}
          <div style={{ padding: '6px', background: '#ffffff', borderRadius: '8px' }}>
            <QRCodeSVG
              value={clubUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={true}
            />
          </div>
          <span style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 800, marginTop: '10px', letterSpacing: '0.05em' }}>
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
              {copied ? <Check size={15} color="#ffffff" /> : <Copy size={15} />}
              <span>{copied ? 'Link Copied' : 'Copy Registration Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
