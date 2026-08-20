import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  User,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import confetti from 'canvas-confetti';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: Player, checkIn?: DailyCheckIn) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectPlayer,
}) => {
  const { players, todayCheckIns, approvePlayerEntry, rejectPlayerEntry } = useClub();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{ player: Player; checkIn?: DailyCheckIn } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const pendingCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'pending');

  // Start / Stop Camera when modal opens or toggles
  useEffect(() => {
    if (isOpen && cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError('Camera access not supported on this browser.');
      }
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission denied or camera not found.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const processScanCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Check if code contains player ID or check-in ID or URL
    let foundPlayer: Player | undefined;
    let foundCheckIn: DailyCheckIn | undefined;

    // Check by checkIn ID
    foundCheckIn = todayCheckIns.find(c => c.id.toLowerCase() === trimmed.toLowerCase() || trimmed.includes(c.id));

    if (foundCheckIn) {
      foundPlayer = players.find(p => p.id === foundCheckIn!.playerId);
    } else {
      // Check by Player ID
      foundPlayer = players.find(p => p.id.toLowerCase() === trimmed.toLowerCase() || trimmed.includes(p.id));
      if (foundPlayer) {
        foundCheckIn = todayCheckIns.find(c => c.playerId === foundPlayer!.id);
      }
    }

    // Check by Phone number
    if (!foundPlayer) {
      foundPlayer = players.find(p => p.phone.includes(trimmed) || trimmed.includes(p.phone));
      if (foundPlayer) {
        foundCheckIn = todayCheckIns.find(c => c.playerId === foundPlayer!.id);
      }
    }

    if (foundPlayer) {
      setScannedResult({ player: foundPlayer, checkIn: foundCheckIn });
      setManualCode('');
    } else {
      alert(`No player found matching code: "${trimmed}". Please try selecting from the active queue.`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScanCode(manualCode);
  };

  const handleApproveScanned = () => {
    if (!scannedResult) return;
    setIsVerifying(true);

    if (scannedResult.checkIn) {
      approvePlayerEntry(scannedResult.checkIn.id);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsVerifying(false);
      onSelectPlayer(scannedResult.player, scannedResult.checkIn);
      onClose();
    }, 400);
  };

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setScannedResult(null);
        onClose();
      }}
      title="Door Scanner & QR Verification"
      subtitle="Scan player digital pass QR or select from the door queue"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Scanned Verification Card Highlight */}
        {scannedResult ? (
          <div
            style={{
              background: 'linear-gradient(145deg, #18080d 0%, #0d0305 100%)',
              border: '2px solid #e11d48',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(225, 29, 72, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ QR Match Identified
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <TierBadge tier={scannedResult.player.membershipTier} />
                <KYCBadge status={scannedResult.player.kycStatus} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {scannedResult.player.kyc.photoUrl ? (
                <img
                  src={scannedResult.player.kyc.photoUrl}
                  alt={scannedResult.player.fullName}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffffff' }}
                />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e11d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem' }}>
                  {scannedResult.player.fullName.charAt(0)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {scannedResult.player.fullName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                  ID: {scannedResult.player.id} • {scannedResult.player.phone}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  Age: <strong style={{ color: calculateAge(scannedResult.player.kyc.dateOfBirth) >= 21 ? '#ffffff' : '#ef4444' }}>{calculateAge(scannedResult.player.kyc.dateOfBirth)} yrs</strong> • {scannedResult.player.kyc.govtIdType} ({maskGovtId(scannedResult.player.kyc.govtIdNumber)})
                </div>
              </div>
            </div>

            {scannedResult.checkIn && (
              <div style={{ background: '#120508', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                  <span>Table Preference:</span>
                  <strong style={{ color: '#ffffff' }}>{scannedResult.checkIn.tablePreference}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Check-In Time:</span>
                  <strong style={{ color: '#ffffff' }}>Today at {formatTimeOnly(scannedResult.checkIn.checkInTime)}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                className="btn btn-primary"
                onClick={handleApproveScanned}
                disabled={isVerifying}
                style={{ flex: 1 }}
              >
                <CheckCircle2 size={18} />
                <span>{isVerifying ? 'Approving Entry...' : 'Approve & Clear Entry'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setScannedResult(null)}
                style={{ width: 'auto' }}
              >
                Scan Another
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Live Camera Scanner Toggle */}
            <div
              style={{
                background: '#120508',
                border: '1.5px solid rgba(225, 29, 72, 0.45)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
              }}
            >
              {cameraActive ? (
                <div style={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px', background: '#000000', maxHeight: '220px' }}>
                  <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  {/* Viewfinder Target */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '20px',
                      border: '2px dashed #f43f5e',
                      borderRadius: '12px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', color: '#fff' }}>
                    Align QR code in center
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'rgba(225, 29, 72, 0.2)',
                    border: '1.5px solid #e11d48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Camera size={32} />
                </div>
              )}

              {cameraError && (
                <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>{cameraError}</span>
              )}

              <button
                className={`btn ${cameraActive ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setCameraActive(!cameraActive)}
                style={{ width: '100%' }}
              >
                <Camera size={16} />
                <span>{cameraActive ? 'Stop Live Camera' : 'Start Live Camera Scanner'}</span>
              </button>
            </div>

            {/* Quick Scanner Barcode / ID Input */}
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Paste scanned QR payload, Player ID, or Phone..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary" style={{ width: 'auto' }}>
                <Search size={16} />
                <span>Verify</span>
              </button>
            </form>

            {/* Quick 1-Tap Queue Selector */}
            {pendingCheckIns.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Awaiting Door Clearance Queue ({pendingCheckIns.length})
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {pendingCheckIns.map(c => {
                    const p = players.find(x => x.id === c.playerId);
                    if (!p) return null;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setScannedResult({ player: p, checkIn: c })}
                        style={{
                          background: '#16080d',
                          border: '1px solid rgba(225, 29, 72, 0.4)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {p.kyc.photoUrl ? (
                            <img src={p.kyc.photoUrl} alt={p.fullName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e11d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                              {p.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#ffffff' }}>{p.fullName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Checked in at {formatTimeOnly(c.checkInTime)}</div>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.74rem', color: '#fb7185', fontWeight: 700 }}>
                          Scan Pass →
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
