import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  ChevronRight,
  Upload,
  RefreshCw,
  Sparkles,
  Zap,
  Printer,
  FileText,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, maskGovtId, formatPlayerNumber } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import confetti from 'canvas-confetti';

import jsQR from 'jsqr';

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
  const { players, todayCheckIns, approvePlayerEntry, rejectPlayerEntry, performDailyCheckIn, lookupMemberByPhone, staffName } = useClub();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [scannedResult, setScannedResult] = useState<{ player: Player; checkIn?: DailyCheckIn } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [entryInvoice, setEntryInvoice] = useState<ClubInvoiceData | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pendingCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'pending');

  useEffect(() => {
    if (isOpen) return;
    setScannedResult(null);
    setScanError(null);
    setCameraError(null);
    setManualCode('');
    setIsSearching(false);
    setIsVerifying(false);
    setIsRejecting(false);
  }, [isOpen]);

  const processScanCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanError(null);
    setIsSearching(true);

    try {
      let extractedPlayerId: string | null = null;
      let extractedScanId: string | null = null;

      // 1. Try URL parsing if it looks like a URL or query string
      if (trimmed.includes('?') || trimmed.includes('/') || trimmed.startsWith('http')) {
        try {
          const urlStr = trimmed.startsWith('http') ? trimmed : `https://clubrestraddle.vercel.app/${trimmed.startsWith('?') ? trimmed : `?${trimmed}`}`;
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

      // 3. Resolve Player & Check-In in local memory
      let foundPlayer: Player | undefined;
      let foundCheckIn: DailyCheckIn | undefined;

      const searchScanId = extractedScanId || trimmed;
      foundCheckIn = todayCheckIns.find(
        c => c.id.toLowerCase() === searchScanId.toLowerCase() || (searchScanId.length > 5 && trimmed.includes(c.id))
      );

      if (foundCheckIn) {
        foundPlayer = players.find(p => p.id === foundCheckIn!.playerId);
      }

      if (!foundPlayer) {
        const searchPlayerId = extractedPlayerId || trimmed;
        foundPlayer = players.find(
          p => p.id.toLowerCase() === searchPlayerId.toLowerCase() || (searchPlayerId.length > 4 && trimmed.includes(p.id))
        );
        if (foundPlayer) {
          foundCheckIn = todayCheckIns.find(c => c.playerId === foundPlayer!.id);
        }
      }

      // 4. If not found in local memory, perform async Supabase live lookup!
      if (!foundPlayer) {
        const lookupTarget = extractedPlayerId || extractedScanId || trimmed;
        const livePlayer = await lookupMemberByPhone(lookupTarget);
        if (livePlayer) {
          foundPlayer = livePlayer;
          foundCheckIn = todayCheckIns.find(c => c.playerId === livePlayer.id);
        }
      }

      if (foundPlayer) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(100);
          } catch {
            // ignore
          }
        }
        setScannedResult({ player: foundPlayer, checkIn: foundCheckIn });
        setManualCode('');
      } else {
        setScanError(`No player record found for "${trimmed}". Verify the QR pass or register the walk-in player.`);
      }
    } catch (err) {
      console.error('Scan processing error:', err);
      setScanError('Failed to parse scan code. Please try manual entry or photo upload.');
    } finally {
      setIsSearching(false);
    }
  }, [players, todayCheckIns, lookupMemberByPhone]);

  // Continuous frame scanner using BarcodeDetector + jsQR on video element
  useEffect(() => {
    if (!isOpen || !cameraActive || scannedResult) {
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      return;
    }

    let detector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix'] });
      } catch (e) {
        console.warn('BarcodeDetector initialization warning:', e);
      }
    }

    // Lazy create off-screen canvas for jsQR
    if (!canvasRef.current && typeof document !== 'undefined') {
      canvasRef.current = document.createElement('canvas');
    }

    let isScanning = true;
    let frameSkip = 0;

    const scanFrame = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        frameSkip++;
        // Scan every 2nd frame to keep UI responsive and butter smooth
        if (frameSkip % 2 === 0) {
          let detectedCode: string | null = null;

          // Attempt 1: Native BarcodeDetector if available
          if (detector) {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch {
              // Frame skip
            }
          }

          // Attempt 2: High-accuracy jsQR canvas fallback (works on iOS Safari & everywhere)
          if (!detectedCode && canvasRef.current) {
            try {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                const width = Math.min(video.videoWidth, 640);
                const height = Math.min(video.videoHeight, 480);
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(video, 0, 0, width, height);
                const imageData = ctx.getImageData(0, 0, width, height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'attemptBoth',
                });
                if (code && code.data) {
                  detectedCode = code.data;
                }
              }
            } catch {
              // Ignore canvas read errors
            }
          }

          if (detectedCode) {
            isScanning = false;
            await processScanCode(detectedCode);
            return;
          }
        }
      }

      if (isScanning) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
      }
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [isOpen, cameraActive, scannedResult, processScanCode]);

  // Start / stop camera stream
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
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Camera permission was denied or camera is unavailable.';
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

  // Scan from photo upload using jsQR + canvas
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            setScanError('Canvas context unavailable.');
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            await processScanCode(code.data);
          } else {
            // Attempt BarcodeDetector as second chance
            if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
              try {
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                const barcodes = await detector.detect(img);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  await processScanCode(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // fall through
              }
            }
            setScanError('No QR code detected in the uploaded image. Please try a clearer photo or manual search.');
          }
        } catch (readErr) {
          console.error('Image decode error:', readErr);
          setScanError('Could not decode QR code from image.');
        }
      };
    } catch (err) {
      console.error('File load error:', err);
      setScanError('Failed to read image file.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void processScanCode(manualCode);
  };

  const handleApproveScanned = () => {
    if (!scannedResult) return;
    setIsVerifying(true);

    const targetId = scannedResult.checkIn?.id || scannedResult.player.id;
    approvePlayerEntry(targetId);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#fb7185', '#be123c'],
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsVerifying(false);
      setScannedResult(null);
      onClose();
    }, 350);
  };

  const handleDenyScanned = () => {
    if (!scannedResult) return;
    setIsVerifying(true);

    const targetId = scannedResult.checkIn?.id || scannedResult.player.id;
    rejectPlayerEntry(targetId, rejectReason.trim());

    setTimeout(() => {
      setIsVerifying(false);
      setIsRejecting(false);
      onSelectPlayer(scannedResult.player, scannedResult.checkIn);
      onClose();
    }, 350);
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
        setIsRejecting(false);
        onClose();
      }}
      title="Entrance QR Scanner & Verification"
      subtitle="Scan digital member pass QR or select from arrival queue"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#10b981" /> QR Pass Verified
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
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffffff' }}
                />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e11d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem' }}>
                  {scannedResult.player.fullName.charAt(0)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.18rem', fontWeight: 800, color: '#ffffff' }}>
                  {scannedResult.player.fullName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                  Player ID: {formatPlayerNumber(scannedResult.player)} • {scannedResult.player.phone}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Aadhaar: <strong style={{ color: '#ffffff' }}>{scannedResult.player.kyc.aadhaarNumber ? maskGovtId(scannedResult.player.kyc.aadhaarNumber) : 'UIDAI Verified'}</strong></span>
                  <span>PAN: <strong style={{ color: '#fb7185' }}>{scannedResult.player.kyc.panNumber || 'PAN Verified'}</strong></span>
                </div>
              </div>
            </div>

            {scannedResult.checkIn && (
              <div style={{ background: '#120508', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Check-In Time:</span>
                  <strong style={{ color: '#ffffff' }}>Today at {formatTimeOnly(scannedResult.checkIn.checkInTime)}</strong>
                </div>
              </div>
            )}

            {isRejecting ? (
              <div style={{ background: 'rgba(159, 18, 57, 0.25)', border: '1.5px solid #e11d48', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fca5a5' }}>
                  Reason for Entry Denial:
                </label>
                <select
                  className="form-control"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  style={{ fontSize: '0.8rem', background: '#18080d' }}
                >
                  <option value="Govt ID details mismatch or expired identification.">Govt ID details mismatch or expired identification</option>
                  <option value="Underage policy restriction (Strictly 21+ only).">Underage policy restriction (Strictly 21+ only)</option>
                  <option value="Active club disciplinary suspension or policy violation.">Active club disciplinary suspension</option>
                  <option value="Dress code or club conduct policy violation.">Dress code or club conduct policy violation</option>
                  <option value="Failed security screening check at entrance.">Failed security screening check at entrance</option>
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDenyScanned}
                    disabled={isVerifying}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    Confirm Entry Denial
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsRejecting(false)}
                    style={{ padding: '8px 12px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : scannedResult.checkIn?.verificationStatus === 'approved' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.8rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <CheckCircle2 size={15} /> Entrance Pass Approved & Verified
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      background: 'rgba(225, 29, 72, 0.16)',
                      borderColor: 'rgba(225, 29, 72, 0.45)',
                      color: '#ffffff',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                    }}
                    onClick={() => {
                      setEntryInvoice(generateEntryFeeInvoice(scannedResult.player, scannedResult.checkIn!, staffName));
                      setIsInvoiceOpen(true);
                    }}
                  >
                    <Printer size={15} color="#fb7185" />
                    <span>Print / View Bill (₹500 · 5% GST)</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onSelectPlayer(scannedResult.player, scannedResult.checkIn);
                      onClose();
                    }}
                    style={{ padding: '10px 14px' }}
                  >
                    Inspect Profile
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setScannedResult(null)}
                    style={{ padding: '10px 12px' }}
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleApproveScanned}
                  disabled={isVerifying}
                  style={{ flex: 1 }}
                >
                  <CheckCircle2 size={18} />
                  <span>{isVerifying ? 'Approving...' : 'Approve & Grant Entry'}</span>
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => setIsRejecting(true)}
                  disabled={isVerifying}
                  style={{ padding: '8px 14px' }}
                >
                  Deny Entry
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setScannedResult(null)}
                  style={{ width: 'auto', padding: '8px 12px' }}
                >
                  Scan Another
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Live Camera Scanner Box */}
            <div
              style={{
                background: '#120508',
                border: '1.5px solid rgba(225, 29, 72, 0.45)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px',
              }}
            >
              {cameraActive ? (
                <div style={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px', background: '#000000', height: '220px' }}>
                  <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Viewfinder Reticle with animated scanning line */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '24px',
                      border: '2px solid rgba(244, 63, 94, 0.85)',
                      borderRadius: '16px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                    }}
                  />
                  
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.75)',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Zap size={12} color="#fb7185" />
                    <span>Point at Player Door Pass QR</span>
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
                  <Camera size={30} />
                </div>
              )}

              {cameraError && (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#fb7185' }}>{cameraError}</span>
              )}

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  className={`btn ${cameraActive ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => {
                    setCameraError(null);
                    setCameraActive(curr => !curr);
                  }}
                  style={{ flex: 1 }}
                >
                  <Camera size={16} />
                  <span>{cameraActive ? 'Pause Camera' : 'Start Camera Scanner'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  title="Scan from QR image file"
                  style={{ width: 'auto', padding: '0 14px' }}
                >
                  <Upload size={16} />
                  <span>Upload QR</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Quick Search & Barcode Input */}
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                aria-label="Player QR code, ID or phone"
                type="text"
                className="form-input"
                placeholder="Scan, paste QR link, Player ID (for example 1), or Phone..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={isSearching} style={{ width: 'auto' }}>
                {isSearching ? <RefreshCw size={16} className="spin-icon" /> : <Search size={16} />}
                <span>{isSearching ? 'Checking...' : 'Lookup'}</span>
              </button>
            </form>

            {scanError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                }}
              >
                {scanError}
              </div>
            )}

            {/* Quick 1-Tap Queue Selector */}
            {pendingCheckIns.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Awaiting Door Clearance ({pendingCheckIns.length})
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

      {/* Official Tax Invoice Modal for QR Screen Printing */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={entryInvoice}
      />
    </Modal>
  );
};
