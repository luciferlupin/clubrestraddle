import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Smartphone, RefreshCw, CheckCircle2, AlertCircle, Sparkles, X, MessageSquare, MessageCircle } from 'lucide-react';
import { sendPhoneOtp, verifyPhoneOtp, formatToE164 } from '../../services/phoneAuthService';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  phone: string;
  onSuccess: (formattedPhone: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  phone,
  onSuccess,
  onClose,
  title = 'Verify Mobile Number',
  subtitle,
}) => {
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formattedPhone = formatToE164(phone);

  // Trigger sending OTP when modal opens with a phone number
  useEffect(() => {
    if (isOpen && phone) {
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      handleSendOtp(channel);
    }
  }, [isOpen, phone]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first empty digit or first input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendOtp = async (targetChannel = channel) => {
    setIsSending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const result = await sendPhoneOtp(phone, targetChannel);
    setIsSending(false);

    if (result.success) {
      setStatusMessage(result.message);
      setIsDemoMode(Boolean(result.isDemo));
      setDemoCode(result.demoCode || null);
      setCooldown(30);
    } else {
      setErrorMessage(result.message || `Failed to dispatch ${targetChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} code.`);
    }
  };

  const handleSwitchChannel = (newChannel: 'whatsapp' | 'sms') => {
    if (newChannel === channel) return;
    setChannel(newChannel);
    setOtpDigits(['', '', '', '', '', '']);
    handleSendOtp(newChannel);
  };

  const handleDigitChange = (index: number, value: string) => {
    // Handle pasting multi-digit code (e.g. 6 digits)
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (pastedDigits.length === 6) {
        triggerVerification(newDigits.join(''));
      }
      return;
    }

    const cleanDigit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically trigger verification
    const fullOtp = newDigits.join('');
    if (fullOtp.length === 6 && newDigits.every((d) => d !== '')) {
      triggerVerification(fullOtp);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    const result = await verifyPhoneOtp(phone, code);
    setIsVerifying(false);

    if (result.success) {
      setStatusMessage('Phone verified successfully!');
      setTimeout(() => {
        onSuccess(result.formattedPhone || formattedPhone);
        onClose();
      }, 400);
    } else {
      setErrorMessage(result.message || 'Incorrect verification code.');
    }
  };

  const handleAutofillDemo = () => {
    if (demoCode) {
      const digits = demoCode.split('');
      setOtpDigits(digits);
      triggerVerification(demoCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="phone-verify-backdrop" role="dialog" aria-modal="true" aria-labelledby="phone-verify-title">
      <div className="phone-verify-modal">
        {/* Header */}
        <div className="phone-verify-header">
          <div className={`phone-verify-badge ${channel === 'whatsapp' ? 'whatsapp-badge' : ''}`}>
            {channel === 'whatsapp' ? (
              <MessageCircle size={22} color="#22c55e" />
            ) : (
              <Smartphone size={20} className="phone-verify-badge-icon" />
            )}
          </div>
          <button
            type="button"
            className="phone-verify-close-btn"
            onClick={onClose}
            aria-label="Close verification modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="phone-verify-body">
          <h2 id="phone-verify-title">{title}</h2>
          <p className="phone-verify-subtitle">
            {subtitle || (
              <>
                We sent a 6-digit security code via{' '}
                <strong style={{ color: channel === 'whatsapp' ? '#4ade80' : '#ffffff' }}>
                  {channel === 'whatsapp' ? 'WhatsApp (WP)' : 'SMS'}
                </strong>{' '}
                to <strong className="phone-verify-target">{formattedPhone}</strong>
              </>
            )}
          </p>

          {/* Delivery Channel Selector (WhatsApp vs SMS) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className={`btn btn-sm ${channel === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '0.78rem',
                padding: '6px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: channel === 'whatsapp' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                borderColor: channel === 'whatsapp' ? '#22c55e' : 'transparent',
                color: channel === 'whatsapp' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
              }}
              onClick={() => handleSwitchChannel('whatsapp')}
            >
              <MessageCircle size={14} color={channel === 'whatsapp' ? '#ffffff' : '#22c55e'} />
              WhatsApp (WP)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${channel === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '0.78rem',
                padding: '6px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: channel === 'sms' ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : 'transparent',
                borderColor: channel === 'sms' ? '#f43f5e' : 'transparent',
                color: channel === 'sms' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
              }}
              onClick={() => handleSwitchChannel('sms')}
            >
              <Smartphone size={14} color={channel === 'sms' ? '#ffffff' : '#cbd5e1'} />
              SMS Code
            </button>
          </div>

          {/* Twilio & Supabase Trust Banner */}
          <div className="phone-verify-provider-tag" style={{ borderLeft: channel === 'whatsapp' ? '3px solid #22c55e' : undefined }}>
            <ShieldCheck size={14} color={channel === 'whatsapp' ? '#4ade80' : undefined} />
            <span>Secured via Twilio {channel === 'whatsapp' ? 'WhatsApp Gateway' : 'SMS'} & Supabase</span>
          </div>

          {/* Demo helper notice if in test mode */}
          {isDemoMode && (
            <div className="phone-verify-demo-banner">
              <div className="demo-banner-content">
                <Sparkles size={15} />
                <span>Test Mode: Code is <strong>{demoCode || '123456'}</strong></span>
              </div>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={handleAutofillDemo}
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* 6-Digit OTP Inputs */}
          <div className="phone-verify-inputs" role="group" aria-label="6-digit verification code">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6} // allows paste of entire code
                className={`phone-otp-box ${digit ? 'filled' : ''} ${errorMessage ? 'has-error' : ''}`}
                style={{
                  borderColor: digit && channel === 'whatsapp' ? '#22c55e' : undefined,
                  boxShadow: digit && channel === 'whatsapp' ? '0 0 10px rgba(34, 197, 94, 0.25)' : undefined,
                }}
                value={digit}
                disabled={isVerifying}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="phone-verify-error" role="alert">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success / Status Message */}
          {statusMessage && !errorMessage && (
            <div className="phone-verify-status" style={{ color: channel === 'whatsapp' ? '#86efac' : undefined }}>
              <CheckCircle2 size={15} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="phone-verify-actions">
            <button
              type="button"
              className="m-btn m-btn-primary phone-verify-submit-btn"
              style={{
                background: channel === 'whatsapp' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : undefined,
                borderColor: channel === 'whatsapp' ? '#22c55e' : undefined,
              }}
              disabled={isVerifying || otpDigits.join('').length < 6}
              onClick={() => triggerVerification()}
            >
              {isVerifying ? (
                <>
                  <RefreshCw size={16} className="spin-icon" /> Verifying Code…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm & Verify
                </>
              )}
            </button>

            {/* Resend OTP button with cooldown */}
            <div className="phone-verify-resend-row">
              <span>Didn&apos;t receive the code?</span>
              {cooldown > 0 ? (
                <span className="resend-countdown">Resend in {cooldown}s</span>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="resend-active-btn"
                    disabled={isSending}
                    onClick={() => handleSendOtp('whatsapp')}
                    style={{ color: '#4ade80' }}
                  >
                    {isSending ? 'Sending…' : '💬 Resend on WhatsApp'}
                  </button>
                  <span style={{ color: '#475569' }}>•</span>
                  <button
                    type="button"
                    className="resend-active-btn"
                    disabled={isSending}
                    onClick={() => handleSendOtp('sms')}
                  >
                    {isSending ? 'Sending…' : '📱 Send via SMS'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
