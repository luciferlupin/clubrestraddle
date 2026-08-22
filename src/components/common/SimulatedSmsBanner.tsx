import React, { useEffect, useState } from 'react';
import { MessageSquare, ShieldCheck, X, Copy, Check } from 'lucide-react';
import { subscribeToOtpNotifications } from '../../utils/otpService';

interface SmsNotification {
  id: string;
  phone: string;
  code: string;
  purpose: 'registration' | 'login';
}

export const SimulatedSmsBanner: React.FC = () => {
  const [currentSms, setCurrentSms] = useState<SmsNotification | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOtpNotifications(payload => {
      setCurrentSms({
        id: Date.now().toString(),
        phone: payload.phone,
        code: payload.code,
        purpose: payload.purpose,
      });
      setCopied(false);

      // Auto dismiss after 12 seconds
      const timer = setTimeout(() => {
        setCurrentSms(null);
      }, 12000);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  if (!currentSms) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSms.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100000,
        maxWidth: '460px',
        width: 'calc(100% - 32px)',
        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(225, 29, 72, 0.6)',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(225, 29, 72, 0.3)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #e11d48, #9f1239)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={13} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fca5a5', letterSpacing: '0.04em' }}>
              MESSAGES • CLUB-RE-STRADDLE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>now</span>
            <button
              type="button"
              onClick={() => setCurrentSms(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.84rem', color: '#f8fafc', lineHeight: 1.4, margin: '4px 0 8px' }}>
          Your verification code is{' '}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#38bdf8',
              letterSpacing: '0.15em',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {currentSms.code}
          </span>
          . Valid for 5 minutes.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            To: {currentSms.phone} ({currentSms.purpose === 'registration' ? 'New KYC' : 'Member Sign-In'})
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? (
              <>
                <Check size={12} /> Copied
              </>
            ) : (
              <>
                <Copy size={12} /> Copy Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
