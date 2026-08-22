import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Smartphone, RefreshCw, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { sendOtp, verifyOtpCode, getActiveOtp } from '../../utils/otpService';
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
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [activeCodeHint, setActiveCodeHint] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP upon opening modal
  useEffect(() => {
    if (isOpen && phone) {
      const active = getActiveOtp(phone);
      if (!active) {
        const { code } = sendOtp(phone, purpose);
        setActiveCodeHint(code);
      } else {
        setActiveCodeHint(active.code);
      }

      setDigits(['', '', '', '', '', '']);
      setError(null);
      setCountdown(30);
      setCanResend(false);

      // Focus first input after render
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen, phone, purpose]);

  // Countdown timer for resending OTP
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

  const handleDigitChange = (index: number, value: string) => {
    setError(null);

    // If pasted full string (e.g. 6 digits)
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
      // Step back
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

  const submitVerification = (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setVerifying(true);
    setError(null);

    setTimeout(() => {
      const result = verifyOtpCode(phone, code);
      setVerifying(false);

      if (result.success) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
        onSuccess();
      } else {
        setError(result.message);
      }
    }, 400);
  };

  const handleResendOtp = () => {
    const { code } = sendOtp(phone, purpose);
    setActiveCodeHint(code);
    setDigits(['', '', '', '', '', '']);
    setError(null);
    setCountdown(30);
    setCanResend(false);
    inputRefs.current[0]?.focus();
  };

  const handleAutoFill = () => {
    const active = getActiveOtp(phone);
    const code = active?.code || activeCodeHint || '123456';
    const splitDigits = code.split('');
    setDigits(splitDigits);
    submitVerification(code);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'linear-gradient(180deg, #18060a 0%, #0e0204 100%)',
          borderRadius: '20px',
          border: '1.5px solid rgba(225, 29, 72, 0.45)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 35px rgba(225, 29, 72, 0.25)',
          overflow: 'hidden',
          padding: '28px 24px',
          color: '#ffffff',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
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
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
            <Smartphone size={26} color="#fb7185" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {purpose === 'registration' ? 'Verify Mobile Number' : 'Mobile OTP Sign-In'}
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>
            Enter the 6-digit OTP sent to{' '}
            <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{phone}</strong>
          </p>
        </div>

        {/* 6-Digit OTP Box Grid */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            margin: '20px 0',
          }}
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={el => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={e => handleDigitChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              style={{
                width: '46px',
                height: '54px',
                textAlign: 'center',
                fontSize: '1.4rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                borderRadius: '10px',
                background: digit ? 'rgba(225, 29, 72, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                border: digit ? '2px solid #e11d48' : '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: digit ? '0 0 12px rgba(225, 29, 72, 0.35)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: '14px',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Auto-fill button for testing convenience */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={handleAutoFill}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '5px 12px',
              color: '#38bdf8',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} /> Tap to Auto-fill Code {activeCodeHint ? `(${activeCodeHint})` : ''}
          </button>
        </div>

        {/* Submit Verification CTA */}
        <button
          type="button"
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: 800,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(225, 29, 72, 0.4)',
          }}
          onClick={() => submitVerification()}
          disabled={verifying || digits.some(d => d === '')}
        >
          {verifying ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Verifying Code...
            </>
          ) : (
            <>
              <ShieldCheck size={18} /> Verify & Continue
            </>
          )}
        </button>

        {/* Resend OTP Footer */}
        <div
          style={{
            marginTop: '18px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>Didn't receive the OTP?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResendOtp}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e11d48',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Resend OTP
            </button>
          ) : (
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Resend in {countdown}s</span>
          )}
        </div>
      </div>
    </div>
  );
};
