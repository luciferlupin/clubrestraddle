import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  ChevronRight,
  Upload,
  RefreshCw,
  Zap,
  ZapOff,
  Printer,
  FileText,
  SwitchCamera,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn, PaymentMethod } from '../../types';
import { formatTimeOnly, formatAadhaarNumber, formatPanNumber, formatPlayerNumber } from '../../utils/formatters';
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

/** Play short cheerful verification chime via Web Audio API */
const playScanChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // A6
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // AudioContext blocked or not supported
  }
};

/** Trigger device haptic vibration if supported */
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([80, 40, 80]);
    } catch {
      // Ignore
    }
  }
};

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectPlayer,
}) => {
  const {
    players,
    todayCheckIns,
    checkIns,
    approvePlayerEntry,
    rejectPlayerEntry,
    lookupMemberByPhone,
    staffName,
  } = useClub();

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
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);
  const [doorPaymentMethod, setDoorPaymentMethod] = useState<PaymentMethod>('Cash');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimestampRef = useRef<number>(0);

  const pendingCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'pending');

  // Reset states on modal close / open
  useEffect(() => {
    if (!isOpen) {
      setScannedResult(null);
      setScanError(null);
      setCameraError(null);
      setManualCode('');
      setIsSearching(false);
      setIsVerifying(false);
      setIsRejecting(false);
      setTorchOn(false);
      setScanSuccessFlash(false);
      lastScannedCodeRef.current = null;
      lastScanTimestampRef.current = 0;
    } else {
      setCameraActive(true);
    }
  }, [isOpen]);

  // Robust scan processor that handles URLs, JSON, IDs, phone numbers, and check-in tokens
  const processScanCode = useCallback(async (code: string): Promise<boolean> => {
    const trimmed = code.trim();
    if (!trimmed) return false;

    // Cooldown check (skip repeated attempts for identical string within 1.2s)
    const now = Date.now();
    if (trimmed === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 1200) {
      return false;
    }
    lastScannedCodeRef.current = trimmed;
    lastScanTimestampRef.current = now;

    setScanError(null);
    setIsSearching(true);

    try {
      let extractedPlayerId: string | null = null;
      let extractedScanId: string | null = null;
      let extractedPhone: string | null = null;

      // 1. Try URL / Query string parsing
      if (trimmed.includes('?') || trimmed.includes('/') || trimmed.startsWith('http')) {
        try {
          const urlStr = trimmed.startsWith('http')
            ? trimmed
            : `https://clubrestraddle.vercel.app/${trimmed.startsWith('?') ? trimmed : `?${trimmed}`}`;
          const urlObj = new URL(urlStr);
          extractedPlayerId =
            urlObj.searchParams.get('player') ||
            urlObj.searchParams.get('playerId') ||
            urlObj.searchParams.get('p') ||
            urlObj.searchParams.get('id') ||
            urlObj.searchParams.get('member');

          extractedScanId =
            urlObj.searchParams.get('scan') ||
            urlObj.searchParams.get('scanId') ||
            urlObj.searchParams.get('checkInId') ||
            urlObj.searchParams.get('c');

          extractedPhone =
            urlObj.searchParams.get('phone') ||
            urlObj.searchParams.get('mobile') ||
            urlObj.searchParams.get('m');
        } catch {
          // Fallback if URL parsing failed
        }
      }

      // 2. Try JSON parsing
      if (!extractedPlayerId && !extractedScanId && trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          extractedPlayerId = parsed.playerId || parsed.player || parsed.id || parsed.memberId;
          extractedScanId = parsed.scan || parsed.checkInId || parsed.scanId;
          extractedPhone = parsed.phone || parsed.mobile;
        } catch {
          // Fallback
        }
      }

      // 3. Resolve Player & Check-In in local memory
      let foundPlayer: Player | undefined;
      let foundCheckIn: DailyCheckIn | undefined;

      // Try finding by Check-In ID
      const searchScanId = extractedScanId || trimmed;
      if (searchScanId) {
        foundCheckIn = todayCheckIns.find(
          c =>
            c.id.toLowerCase() === searchScanId.toLowerCase() ||
            (searchScanId.length > 5 && trimmed.includes(c.id))
        );

        if (!foundCheckIn) {
          foundCheckIn = checkIns.find(
            c =>
              c.id.toLowerCase() === searchScanId.toLowerCase() ||
              (searchScanId.length > 5 && trimmed.includes(c.id))
          );
        }

        if (foundCheckIn) {
          foundPlayer = players.find(p => p.id === foundCheckIn!.playerId);
        }
      }

      // Try finding by Player ID / phone / member number in memory
      if (!foundPlayer) {
        const searchPlayerId = extractedPlayerId || extractedPhone || trimmed;
        const cleanDigits = searchPlayerId.replace(/\D/g, '');

        foundPlayer = players.find(p => {
          const pDigits = p.phone.replace(/\D/g, '');
          const pAadhaar = (p.kyc?.aadhaarNumber || '').replace(/\D/g, '');
          const pPan = (p.kyc?.panNumber || '').toUpperCase();
          const pGovtId = (p.kyc?.govtIdNumber || '').toLowerCase();

          return (
            p.id.toLowerCase() === searchPlayerId.toLowerCase() ||
            (searchPlayerId.length > 3 && trimmed.toLowerCase().includes(p.id.toLowerCase())) ||
            String(p.memberNumber || '') === searchPlayerId ||
            (cleanDigits.length >= 10 && pDigits.includes(cleanDigits.slice(-10))) ||
            (cleanDigits.length === 12 && pAadhaar === cleanDigits) ||
            (searchPlayerId.length >= 8 && pPan === searchPlayerId.toUpperCase()) ||
            (searchPlayerId.length >= 6 && pGovtId === searchPlayerId.toLowerCase())
          );
        });

        if (foundPlayer) {
          foundCheckIn =
            todayCheckIns.find(c => c.playerId === foundPlayer!.id) ||
            checkIns.find(c => c.playerId === foundPlayer!.id);
        }
      }

      // 4. If not found in local memory, perform live async Supabase lookup
      if (!foundPlayer) {
        const lookupTarget = extractedPlayerId || extractedScanId || extractedPhone || trimmed;
        const livePlayer = await lookupMemberByPhone(lookupTarget);
        if (livePlayer) {
          foundPlayer = livePlayer;
          foundCheckIn =
            todayCheckIns.find(c => c.playerId === livePlayer.id) ||
            checkIns.find(c => c.playerId === livePlayer.id);
        }
      }

      if (foundPlayer) {
        playScanChime();
        triggerHaptic();
        setScanSuccessFlash(true);
        setTimeout(() => setScanSuccessFlash(false), 500);

        setScannedResult({ player: foundPlayer, checkIn: foundCheckIn });
        setManualCode('');
        return true;
      } else {
        setScanError(`No player record found for "${trimmed}". Verify the QR pass or register the walk-in player.`);
        return false;
      }
    } catch (err) {
      console.error('Scan processing error:', err);
      setScanError('Failed to parse scan code. Please try manual entry or photo upload.');
      return false;
    } finally {
      setIsSearching(false);
    }
  }, [players, todayCheckIns, checkIns, lookupMemberByPhone]);

  // Video Frame Scanning Loop with Native BarcodeDetector + Aspect-Preserving jsQR
  useEffect(() => {
    if (!isOpen || !cameraActive || scannedResult) {
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      return;
    }

    let detector: { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } | null = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => typeof detector }).BarcodeDetector;
        detector = new BarcodeDetectorClass({ formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix'] });
      } catch (e) {
        console.warn('BarcodeDetector warning:', e);
      }
    }

    if (!canvasRef.current && typeof document !== 'undefined') {
      canvasRef.current = document.createElement('canvas');
    }

    let isScanning = true;
    let frameSkip = 0;

    const scanFrame = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        frameSkip++;

        // Process every 2nd animation frame to ensure high responsiveness
        if (frameSkip % 2 === 0) {
          let detectedCode: string | null = null;

          // Attempt 1: Native BarcodeDetector (fastest on Chromium/Android)
          if (detector) {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch {
              // Frame detector fallback
            }
          }

          // Attempt 2: High-accuracy jsQR with Aspect Ratio Preservation
          if (!detectedCode && canvasRef.current) {
            try {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                // Pass 2A: Full-frame proportional scale (preserves exact aspect ratio!)
                const maxDim = 960;
                let w = video.videoWidth;
                let h = video.videoHeight;
                if (w > maxDim || h > maxDim) {
                  if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                  } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                  }
                }

                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(video, 0, 0, w, h);
                const fullImgData = ctx.getImageData(0, 0, w, h);
                const code = jsQR(fullImgData.data, w, h, {
                  inversionAttempts: 'attemptBoth',
                });

                if (code && code.data) {
                  detectedCode = code.data;
                }

                // Pass 2B: Center Crop Focus (if full frame didn't catch small/distant QR)
                if (!detectedCode) {
                  const cropSize = Math.round(Math.min(video.videoWidth, video.videoHeight) * 0.72);
                  const cropX = Math.round((video.videoWidth - cropSize) / 2);
                  const cropY = Math.round((video.videoHeight - cropSize) / 2);

                  canvas.width = 480;
                  canvas.height = 480;
                  ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 480, 480);
                  const cropImgData = ctx.getImageData(0, 0, 480, 480);
                  const cropCode = jsQR(cropImgData.data, 480, 480, {
                    inversionAttempts: 'attemptBoth',
                  });

                  if (cropCode && cropCode.data) {
                    detectedCode = cropCode.data;
                  }
                }
              }
            } catch {
              // Ignore frame canvas read errors
            }
          }

          if (detectedCode) {
            const success = await processScanCode(detectedCode);
            if (success) {
              isScanning = false;
              return;
            }
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

  // Start & configure camera stream with fallback constraints
  useEffect(() => {
    const stopCurrentStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };

    if (!isOpen || !cameraActive) {
      stopCurrentStream();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setCameraError(null);
      setHasTorch(false);
      setTorchOn(false);

      try {
        let stream: MediaStream;

        // Try ideal resolution with facingMode first
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback to basic facingMode constraint
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode },
              audio: false,
            });
          } catch {
            // Final fallback to any video device
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        // Detect torch / flashlight capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && 'getCapabilities' in videoTrack) {
          try {
            const capabilities = (videoTrack as unknown as { getCapabilities: () => { torch?: boolean } }).getCapabilities();
            if (capabilities && capabilities.torch) {
              setHasTorch(true);
            }
          } catch {
            // Torch check ignored
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Camera permission was denied or camera hardware is unavailable.';
        setCameraError(message);
        setCameraActive(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCurrentStream();
    };
  }, [isOpen, cameraActive, facingMode]);

  // Re-attach video stream if videoRef re-mounts after closing a player card
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, scannedResult]);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    const nextState = !torchOn;
    try {
      await (track as unknown as { applyConstraints: (c: { advanced: Array<{ torch?: boolean }> }) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // Flip Camera between Rear and Front
  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Photo upload decoder with high-contrast scaling
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

          // Preserve exact image dimensions up to 1600px
          const maxDim = 1600;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imageData.data, w, h, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            await processScanCode(code.data);
          } else {
            // Attempt BarcodeDetector as fallback
            if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
              try {
                const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
                const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
                const barcodes = await detector.detect(img);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  await processScanCode(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // Fall through
              }
            }
            setScanError('No QR code detected in the uploaded image. Please ensure the QR pass is clear and well-lit.');
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

  const handleApproveScanned = (shouldPrint = false) => {
    if (!scannedResult) return;
    setIsVerifying(true);

    const targetId = scannedResult.checkIn?.id || scannedResult.player.id;
    approvePlayerEntry(targetId, doorPaymentMethod);

    if (shouldPrint) {
      setEntryInvoice(generateEntryFeeInvoice(scannedResult.player, scannedResult.checkIn, staffName));
      setIsInvoiceOpen(true);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#10b981', '#fb7185'],
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsVerifying(false);
      if (!shouldPrint) {
        setScannedResult(null);
        onClose();
      }
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
        setTorchOn(false);
        onClose();
      }}
      title="Entrance QR Scanner & Verification"
      subtitle="Scan player door pass QR or search member credentials"
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#fb7185',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={16} color="#10b981" /> QR Pass Scanned & Verified
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
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2.5px solid #ffffff',
                    boxShadow: '0 0 15px rgba(0,0,0,0.8)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e11d48, #881337)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    border: '2.5px solid #ffffff',
                    flexShrink: 0,
                  }}
                >
                  {scannedResult.player.fullName.charAt(0)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                  {scannedResult.player.fullName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Player ID {formatPlayerNumber(scannedResult.player)} • {scannedResult.player.phone}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span>
                    Aadhaar: <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{formatAadhaarNumber(scannedResult.player.kyc.aadhaarNumber, scannedResult.player.kyc.govtIdNumber) || 'UIDAI Verified'}</strong>
                  </span>
                  <span>
                    PAN: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{formatPanNumber(scannedResult.player.kyc.panNumber, scannedResult.player.kyc.govtIdNumber) || 'PAN Verified'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {scannedResult.checkIn && (
              <div
                style={{
                  background: '#120508',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Check-In Timestamp:</span>
                  <strong style={{ color: '#ffffff' }}>Today at {formatTimeOnly(scannedResult.checkIn.checkInTime)}</strong>
                </div>
              </div>
            )}

            {/* Payment Method Selector for ₹500 Door Fee */}
            {scannedResult.checkIn?.verificationStatus !== 'approved' && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700 }}>
                  ₹500 Entry Fee Mode:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setDoorPaymentMethod(pm)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: doorPaymentMethod === pm ? '1px solid #fb7185' : '1px solid rgba(255,255,255,0.15)',
                        background: doorPaymentMethod === pm ? 'rgba(225,29,72,0.3)' : 'transparent',
                        color: doorPaymentMethod === pm ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isRejecting ? (
              <div
                style={{
                  background: 'rgba(159, 18, 57, 0.25)',
                  border: '1.5px solid #e11d48',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
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
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#6ee7b7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                  }}
                >
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
                      setEntryInvoice(generateEntryFeeInvoice(scannedResult.player, scannedResult.checkIn, staffName));
                      setIsInvoiceOpen(true);
                    }}
                  >
                    <Printer size={15} color="#fb7185" />
                    <span>Print / View Bill (₹500)</span>
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
                  type="button"
                  className="btn btn-emerald"
                  onClick={() => handleApproveScanned(false)}
                  disabled={isVerifying}
                  style={{ flex: 1, padding: '10px 8px', fontWeight: 800 }}
                  title="Approve entry without opening printable bill"
                >
                  <CheckCircle2 size={16} />
                  <span>{isVerifying ? 'Approving...' : `Approve (${doorPaymentMethod})`}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApproveScanned(true)}
                  disabled={isVerifying}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #e11d48, #be123c)',
                    borderColor: '#fda4af',
                    padding: '10px 8px',
                    fontWeight: 800,
                  }}
                  title="Approve entry and open printable ₹500 gate bill"
                >
                  <Printer size={15} />
                  <span>Approve & Bill</span>
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setIsRejecting(true)}
                  disabled={isVerifying}
                  style={{ padding: '8px 12px' }}
                >
                  Deny
                </button>

                <button
                  type="button"
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
                border: scanSuccessFlash ? '2px solid #10b981' : '1.5px solid rgba(225, 29, 72, 0.45)',
                borderRadius: '16px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px',
                transition: 'border-color 0.2s ease',
              }}
            >
              {cameraActive ? (
                <div
                  style={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    background: '#000000',
                    height: '240px',
                  }}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Viewfinder Reticle with animated scanning laser line */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '20px',
                      border: scanSuccessFlash ? '2.5px solid #10b981' : '2px solid rgba(244, 63, 94, 0.9)',
                      borderRadius: '14px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.42)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Animated scanning laser line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent 0%, #fb7185 50%, transparent 100%)',
                        boxShadow: '0 0 8px #f43f5e',
                        animation: 'scannerLaser 2s ease-in-out infinite alternate',
                        top: '50%',
                      }}
                    />
                  </div>

                  {/* Top bar controls on camera */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      display: 'flex',
                      gap: '6px',
                      zIndex: 2,
                    }}
                  >
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        style={{
                          background: torchOn ? '#e11d48' : 'rgba(0,0,0,0.65)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={torchOn ? 'Turn off light' : 'Turn on flashlight'}
                      >
                        {torchOn ? <Zap size={14} /> : <ZapOff size={14} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      style={{
                        background: 'rgba(0,0,0,0.65)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Flip camera (front / back)"
                    >
                      <SwitchCamera size={14} />
                    </button>
                  </div>

                  {/* Status pill bottom center */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(6px)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                      }}
                    />
                    <span>Align Player Pass QR in Frame</span>
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
                <div
                  role="alert"
                  style={{
                    fontSize: '0.75rem',
                    color: '#fb7185',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{cameraError}</span>
                </div>
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
                placeholder="Scan, paste QR link, Player ID (e.g. 1), or Phone..."
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{scanError}</span>
              </div>
            )}

            {/* Quick 1-Tap Queue Selector */}
            {pendingCheckIns.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#fb7185',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Awaiting Door Clearance ({pendingCheckIns.length})
                </span>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
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
                            <img
                              src={p.kyc.photoUrl}
                              alt={p.fullName}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#e11d48',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                              }}
                            >
                              {p.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#ffffff' }}>{p.fullName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Checked in at {formatTimeOnly(c.checkInTime)}
                            </div>
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
