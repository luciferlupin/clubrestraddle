import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Smartphone, RefreshCw, CheckCircle2, AlertCircle, X, Lock, Key } from 'lucide-react';
import { sendOtp, verifyOtpCode, normalizePhone, isSmsGatewayConfigured } from '../../utils/otpService';
import confetti from 'canvas-confetti';

interface OtpVerificationModalProps {
  isOpen: boolean;
  phone: string;
  purpose?: 'registration' | 'login';
  onSuccess: () => void;
  onClose: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  phone,
  purpose = 'login',
  onSuccess,
  onClose,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send real SMS OTP upon opening modal
  useEffect(() => {
    if (isOpen && phone) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setCountdown(30);
      setCanResend(false);

      const triggerSend = async () => {
        setSending(true);
        try {
          const res = await sendOtp(phone, purpose);
          if (res.success) {
            setInfoMessage(res.message);
          } else {
            setError(res.message);
          }
        } catch (err: any) {
          setError(err?.message || 'Failed to dispatch SMS OTP.');
        } finally {
          setSending(false);
        }
      };

      triggerSend();

      // Focus first digit box after render
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 150);
    }
  }, [isOpen, phone, purpose]);

  // Resend countdown timer
  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const cleanPhone = normalizePhone(phone);
  const formattedDisplayPhone = cleanPhone.length === 10
    ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
    : phone;

  const handleDigitChange = (index: number, value: string) => {
    setError(null);

    // If pasted full string (e.g. from SMS autofill or clipboard)
    if (value.length > 1) {
      const cleanValue = value.replace(/\D/g, '').slice(0, 6);
      if (cleanValue.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < cleanValue.length; i++) {
          newDigits[i] = cleanValue[i];
        }
        setDigits(newDigits);
        const nextIndex = Math.min(cleanValue.length, 5);
        inputRefs.current[nextIndex]?.focus();

        if (cleanValue.length === 6) {
          submitVerification(newDigits.join(''));
        }
        return;
      }
    }

    const singleDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (singleDigit && index === 5 && newDigits.every(d => d.trim() !== '')) {
      submitVerification(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      submitVerification(pasted);
    }
  };

  const submitVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP received in your SMS.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const result = await verifyOtpCode(phone, code);
      if (result.success) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#ffffff'],
          });
        } catch {
          // fallback
        }
        onSuccess();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || sending) return;
    setSending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await sendOtp(phone, purpose);
      if (res.success) {
        setInfoMessage(res.message);
        setDigits(['', '', '', '', '', '']);
        setCountdown(30);
        setCanResend(false);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.message);
        if (res.cooldownSeconds) {
          setCountdown(res.cooldownSeconds);
          setCanResend(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend SMS.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'linear-gradient(180deg, #18060a 0%, #0e0204 100%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(225, 29, 72, 0.45)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 35px rgba(225, 29, 72, 0.25)',
          overflow: 'hidden',
          padding: '28px 24px',
          color: '#ffffff',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close OTP Verification"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cbd5e1',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.35))',
              border: '2px solid rgba(225, 29, 72, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 20px rgba(225, 29, 72, 0.3)',
            }}
          >
            <Smartphone size={28} color="#fb7185" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0' }}>
            Verify Your Mobile Number
          </h3>

          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
            We've sent a 6-digit SMS verification code to
          </p>
          <p style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', margin: '4px 0 0 0' }}>
            {formattedDisplayPhone}
          </p>
        </div>

        {/* Delivery Status Banner */}
        {infoMessage && !error && (
          <div
            style={{
              background: isSmsGatewayConfigured() ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${isSmsGatewayConfigured() ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: isSmsGatewayConfigured() ? '#34d399' : '#fbbf24',
              marginBottom: '16px',
            }}
          >
            {isSmsGatewayConfigured() ? (
              <>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{infoMessage}</span>
              </>
            ) : (
              <>
                <Key size={15} style={{ flexShrink: 0 }} />
                <span>Preview mode active. Enter test code <strong style={{ color: '#ffffff' }}>123456</strong> or add Fast2SMS API key in .env</span>
              </>
            )}
          </div>
        )}

        {/* 6 Digit Input Boxes */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '18px',
          }}
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              style={{
                width: '46px',
                height: '54px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.65)',
                border: digit ? '2px solid #e11d48' : '1.5px solid rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                fontSize: '1.4rem',
                fontWeight: 900,
                textAlign: 'center',
                outline: 'none',
                boxShadow: digit ? '0 0 14px rgba(225, 29, 72, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: '#f87171',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => submitVerification()}
            disabled={verifying || digits.some(d => !d.trim())}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '0.96rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {verifying ? (
              <>
                <RefreshCw size={18} className="spin-anim" />
                <span>Verifying SMS Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Verify & Continue</span>
              </>
            )}
          </button>

          {/* Resend SMS Controller */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '6px' }}>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={sending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fb7185',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                }}
              >
                <RefreshCw size={14} className={sending ? 'spin-anim' : ''} />
                <span>Resend SMS OTP</span>
              </button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Didn't receive SMS? Resend in <strong style={{ color: '#ffffff' }}>{countdown}s</strong>
              </span>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: '#94a3b8',
          }}
        >
          <Lock size={12} color="#10b981" />
          <span>Carrier Secured 256-bit SMS Verification</span>
        </div>
      </div>
    </div>
  );
};
