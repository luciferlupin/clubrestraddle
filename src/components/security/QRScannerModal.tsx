import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import confetti from 'canvas-confetti';

const SCANNER_AGE_REFERENCE = new Date();

const calculateAge = (dobString: string): number => {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  let age = SCANNER_AGE_REFERENCE.getFullYear() - dob.getFullYear();
  const birthdayPending =
    SCANNER_AGE_REFERENCE.getMonth() < dob.getMonth() ||
    (SCANNER_AGE_REFERENCE.getMonth() === dob.getMonth() && SCANNER_AGE_REFERENCE.getDate() < dob.getDate());
  if (birthdayPending) age -= 1;
  return Math.max(0, age);
};

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
  const { players, todayCheckIns, approvePlayerEntry, performDailyCheckIn } = useClub();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{ player: Player; checkIn?: DailyCheckIn } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const pendingCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'pending');

  // Start / stop the camera only while the scanner is visible.
  useEffect(() => {
    const stopCurrentStream = () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };

    if (!isOpen || !cameraActive) {
      stopCurrentStream();
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Camera permission was denied or no camera was found.';
        setCameraError(message);
        setCameraActive(false);
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopCurrentStream();
    };
  }, [isOpen, cameraActive]);

  const processScanCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanError(null);

    let extractedPlayerId: string | null = null;
    let extractedScanId: string | null = null;

    // 1. Try URL parsing if it looks like a URL or query string
    if (trimmed.includes('?') || trimmed.includes('/') || trimmed.startsWith('http')) {
      try {
        const urlStr = trimmed.startsWith('http') ? trimmed : `https://dummy.club/${trimmed.startsWith('?') ? trimmed : `?${trimmed}`}`;
        const urlObj = new URL(urlStr);
        extractedPlayerId = urlObj.searchParams.get('player') || urlObj.searchParams.get('playerId');
        extractedScanId = urlObj.searchParams.get('scan') || urlObj.searchParams.get('checkInId');
      } catch {
        // Fallback
      }
    }

    // 2. Try JSON parsing
    if (!extractedPlayerId && trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        extractedPlayerId = parsed.playerId || parsed.player || parsed.id;
        extractedScanId = parsed.scan || parsed.checkInId;
      } catch {
        // Fallback
      }
    }

    // 3. Resolve Player & Check-In
    let foundPlayer: Player | undefined;
    let foundCheckIn: DailyCheckIn | undefined;

    // Check by extracted or raw scan/check-in ID
    const searchScanId = extractedScanId || trimmed;
    foundCheckIn = todayCheckIns.find(
      c => c.id.toLowerCase() === searchScanId.toLowerCase() || (searchScanId.length > 5 && trimmed.includes(c.id))
    );

    if (foundCheckIn) {
      foundPlayer = players.find(p => p.id === foundCheckIn!.playerId);
    }

    // Check by extracted or raw player ID
    if (!foundPlayer) {
      const searchPlayerId = extractedPlayerId || trimmed;
      foundPlayer = players.find(
        p => p.id.toLowerCase() === searchPlayerId.toLowerCase() || (searchPlayerId.length > 4 && trimmed.includes(p.id))
      );
      if (foundPlayer) {
        foundCheckIn = todayCheckIns.find(c => c.playerId === foundPlayer!.id);
      }
    }

    // Check by phone number (clean non-digits)
    if (!foundPlayer) {
      const cleanInputDigits = trimmed.replace(/\D/g, '');
      if (cleanInputDigits.length >= 5) {
        foundPlayer = players.find(p => {
          const cleanPhoneDigits = p.phone.replace(/\D/g, '');
          return cleanPhoneDigits.includes(cleanInputDigits) || cleanInputDigits.includes(cleanPhoneDigits);
        });
        if (foundPlayer) {
          foundCheckIn = todayCheckIns.find(c => c.playerId === foundPlayer!.id);
        }
      }
    }

    // Check by player name (fuzzy match)
    if (!foundPlayer && trimmed.length >= 3) {
      foundPlayer = players.find(p => p.fullName.toLowerCase().includes(trimmed.toLowerCase()));
      if (foundPlayer) {
        foundCheckIn = todayCheckIns.find(c => c.playerId === foundPlayer!.id);
      }
    }

    if (foundPlayer) {
      setScannedResult({ player: foundPlayer, checkIn: foundCheckIn });
      setManualCode('');
    } else {
      setScanError(`No player matched “${trimmed}”. Check the QR code or select someone from the active queue.`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScanCode(manualCode);
  };

  const handleApproveScanned = () => {
    if (!scannedResult) return;
    setIsVerifying(true);

    let activeCheckIn = scannedResult.checkIn;
    if (activeCheckIn) {
      approvePlayerEntry(activeCheckIn.id);
    } else {
      // Auto-create daily check-in and approve entry immediately
      activeCheckIn = performDailyCheckIn(scannedResult.player.id, 'Door Scanner Clearance');
      approvePlayerEntry(activeCheckIn.id);
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
      onSelectPlayer(scannedResult.player, activeCheckIn);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setScannedResult(null);
        setScanError(null);
        setCameraError(null);
        setCameraActive(false);
        setManualCode('');
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
                <CheckCircle2 size={13} /> QR match identified
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
                <span role="alert" style={{ fontSize: '0.75rem', color: '#fb7185' }}>{cameraError}</span>
              )}

              <button
                className={`btn ${cameraActive ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => {
                  setCameraError(null);
                  setCameraActive(current => !current);
                }}
                style={{ width: '100%' }}
              >
                <Camera size={16} />
                <span>{cameraActive ? 'Stop Live Camera' : 'Start Live Camera Scanner'}</span>
              </button>
            </div>

            {/* Quick Scanner Barcode / ID Input */}
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                aria-label="Player QR code, ID or phone"
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

            {scanError && <div className="staff-inline-error" role="alert">{scanError}</div>}

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
                      <button
                        key={c.id}
                        type="button"
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
                          width: '100%',
                          color: 'inherit',
                          textAlign: 'left',
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

                        <span className="staff-inline-link">
                          Inspect <ChevronRight size={14} />
                        </span>
                      </button>
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
