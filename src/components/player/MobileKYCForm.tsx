import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  FileText,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import confetti from 'canvas-confetti';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';
import { OtpVerificationModal } from '../common/OtpVerificationModal';

interface MobileKYCFormProps {
  onSuccess: (result: { player: Player; checkIn: DailyCheckIn }) => void;
  onCancel?: () => void;
}

type RegistrationStep = 1 | 2 | 3;

const stepDetails = [
  { number: 1, label: 'About you', icon: UserRound },
  { number: 2, label: 'Verify IDs', icon: BadgeCheck },
  { number: 3, label: 'Ready to play', icon: Check },
] as const;

export const MobileKYCForm: React.FC<MobileKYCFormProps> = ({ onSuccess, onCancel }) => {
  const { registerNewPlayer } = useClub();
  const formTopRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<RegistrationStep>(1);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    aadhaarNumber: '',
    panNumber: '',
    aadhaarPhotoUrl: '',
    panPhotoUrl: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    agreedToRules: false,
    tablePreference: 'Table 1 (Main Lounge)',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  ];

  const getValidationErrors = (targetStep?: RegistrationStep) => {
    const nextErrors: Record<string, string> = {};

    if (!targetStep || targetStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Enter your name as it appears on your ID.';
      if (!formData.phone.trim()) nextErrors.phone = 'Enter your mobile number.';
      if (!formData.email.trim() || !formData.email.includes('@')) nextErrors.email = 'Enter a valid email address.';
    }

    if (!targetStep || targetStep === 2) {
      const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
      if (!cleanAadhaar) {
        nextErrors.aadhaarNumber = 'Aadhaar Card number is required.';
      } else if (cleanAadhaar.length !== 12) {
        nextErrors.aadhaarNumber = 'Aadhaar number must be exactly 12 digits.';
      }

      const cleanPan = formData.panNumber.trim().toUpperCase();
      if (!cleanPan) {
        nextErrors.panNumber = 'PAN Card number is required.';
      } else if (cleanPan.length !== 10) {
        nextErrors.panNumber = 'PAN must be exactly 10 alphanumeric characters.';
      }
    }

    if (!targetStep || targetStep === 3) {
      if (!formData.agreedToRules) nextErrors.agreedToRules = 'Please confirm the genuine declaration & house-rules.';
    }

    return nextErrors;
  };

  const goToStep = (nextStep: RegistrationStep) => {
    setStep(nextStep);
    setErrors({});
    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleNext = () => {
    const stepErrors = getValidationErrors(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    if (step === 1) {
      const phoneChangedOrUnverified = !isPhoneVerified || verifiedPhone !== formData.phone;
      if (phoneChangedOrUnverified) {
        setIsOtpModalOpen(true);
        return;
      }
    }

    goToStep((step + 1) as RegistrationStep);
  };

  const handleOtpSuccess = () => {
    setIsPhoneVerified(true);
    setVerifiedPhone(formData.phone);
    setIsOtpModalOpen(false);
    goToStep(2);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = getValidationErrors();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.fullName || validationErrors.phone || validationErrors.email) {
        setStep(1);
      } else if (validationErrors.aadhaarNumber || validationErrors.panNumber) {
        setStep(2);
      }
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const cleanPan = formData.panNumber.trim().toUpperCase();
      const cleanAadhaar = formData.aadhaarNumber.trim();

      const result = registerNewPlayer(
        {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          aadhaarNumber: cleanAadhaar,
          panNumber: cleanPan,
          aadhaarPhotoUrl: formData.aadhaarPhotoUrl || undefined,
          panPhotoUrl: formData.panPhotoUrl || undefined,
          govtIdType: 'Aadhaar & PAN Card',
          govtIdNumber: `PAN: ${cleanPan} | Aadhaar: ${cleanAadhaar}`,
          address: formData.address || 'Delhi NCR, India',
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          photoUrl: formData.photoUrl,
          agreedToRules: formData.agreedToRules,
        },
        formData.tablePreference,
      );

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
        });
      } catch {
        // Fallback
      }

      setSubmitting(false);
      onSuccess(result);
    }, 300);
  };

  return (
    <section className="mobile-kyc-flow" ref={formTopRef} aria-labelledby="mobile-kyc-title">
      <div className="mobile-flow-heading">
        <button type="button" className="mobile-icon-button" onClick={onCancel} aria-label="Back to player options">
          <ArrowLeft size={21} />
        </button>
        <div>
          <span className="mobile-flow-eyebrow">New member check-in</span>
          <h1 id="mobile-kyc-title">Create your player pass</h1>
          <p>Quick KYC with Aadhaar & PAN verification.</p>
        </div>
      </div>

      <nav className="mobile-stepper" aria-label="Registration progress">
        {stepDetails.map((detail) => {
          const isComplete = detail.number < step;
          const isCurrent = detail.number === step;
          const Icon = detail.icon;

          return (
            <button
              key={detail.number}
              type="button"
              className={`mobile-step-pill ${isCurrent ? 'active' : ''} ${isComplete ? 'completed' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => {
                if (detail.number < step) goToStep(detail.number);
              }}
              disabled={detail.number > step}
            >
              <span className="mobile-step-icon">
                {isComplete ? <Check size={13} aria-hidden="true" /> : <Icon size={13} aria-hidden="true" />}
              </span>
              <span>{detail.label}</span>
            </button>
          );
        })}
      </nav>

      <form onSubmit={handleSubmit} noValidate>
        {step === 1 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-one-title">
            <h2 id="mobile-step-one-title">Personal details</h2>
            <p className="mobile-form-intro">Enter your details for your official club membership pass.</p>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-full-name">Full name</label>
              <input
                id="mobile-full-name"
                type="text"
                className="m-input"
                placeholder="e.g. Aditya Singhal"
                autoComplete="name"
                value={formData.fullName}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'mobile-name-error' : undefined}
                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
              />
              {errors.fullName && <span id="mobile-name-error" className="m-field-error" role="alert">{errors.fullName}</span>}
            </div>

            <div className="m-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="m-form-label" htmlFor="mobile-phone" style={{ margin: 0 }}>Mobile number</label>
                {isPhoneVerified && verifiedPhone === formData.phone ? (
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    <Check size={11} /> Verified
                  </span>
                ) : formData.phone.trim().length >= 10 ? (
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(true)}
                    style={{
                      background: 'rgba(225, 29, 72, 0.15)',
                      border: '1px solid rgba(225, 29, 72, 0.4)',
                      color: '#fb7185',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                    }}
                  >
                    Send OTP
                  </button>
                ) : null}
              </div>
              <div className="mobile-phone-field">
                <span aria-hidden="true">+91</span>
                <input
                  id="mobile-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="m-input"
                  placeholder="98765 43210"
                  value={formData.phone}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'mobile-phone-error' : undefined}
                  onChange={(event) => {
                    setFormData({ ...formData, phone: event.target.value });
                    if (isPhoneVerified && event.target.value !== verifiedPhone) {
                      setIsPhoneVerified(false);
                    }
                  }}
                />
              </div>
              {errors.phone && <span id="mobile-phone-error" className="m-field-error" role="alert">{errors.phone}</span>}
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-email">Email address</label>
              <input
                id="mobile-email"
                type="email"
                className="m-input"
                placeholder="name@domain.com"
                autoComplete="email"
                value={formData.email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'mobile-email-error' : undefined}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
              {errors.email && <span id="mobile-email-error" className="m-field-error" role="alert">{errors.email}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-two-title">
            <h2 id="mobile-step-two-title">Two ID Proofs (Aadhaar & PAN)</h2>
            <p className="mobile-form-intro">Both government identity documents are required for membership clearance & tax compliance.</p>

            {/* Aadhaar Card Input */}
            <div className="m-form-group" style={{ background: 'rgba(225, 29, 72, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="m-form-label" htmlFor="mobile-aadhaar-number" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={15} color="#e11d48" /> 1. Aadhaar Card Number *
                </label>
                <span style={{ fontSize: '0.68rem', background: '#e11d48', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  12 Digits
                </span>
              </div>
              <input
                id="mobile-aadhaar-number"
                type="text"
                inputMode="numeric"
                className="m-input"
                placeholder="e.g. 5432 8765 4321"
                maxLength={14}
                value={formData.aadhaarNumber}
                aria-invalid={Boolean(errors.aadhaarNumber)}
                onChange={(event) => setFormData({ ...formData, aadhaarNumber: event.target.value })}
              />
              {errors.aadhaarNumber && <span className="m-field-error" role="alert">{errors.aadhaarNumber}</span>}

              {/* Mobile Aadhaar Photo Upload */}
              <DocumentPhotoUpload
                id="mobile-aadhaar-doc"
                label="Aadhaar Card"
                subLabel="Take photo or choose file. Auto-compressed (<100 KB)."
                value={formData.aadhaarPhotoUrl}
                onChange={(url) => setFormData({ ...formData, aadhaarPhotoUrl: url || '' })}
              />
            </div>

            {/* PAN Card Input */}
            <div className="m-form-group" style={{ background: 'rgba(225, 29, 72, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="m-form-label" htmlFor="mobile-pan-number" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BadgeCheck size={15} color="#e11d48" /> 2. PAN Card Number *
                </label>
                <span style={{ fontSize: '0.68rem', background: '#0f172a', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)' }}>
                  10 Chars
                </span>
              </div>
              <input
                id="mobile-pan-number"
                type="text"
                className="m-input"
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                value={formData.panNumber}
                aria-invalid={Boolean(errors.panNumber)}
                onChange={(event) => setFormData({ ...formData, panNumber: event.target.value.toUpperCase() })}
              />
              {errors.panNumber && <span className="m-field-error" role="alert">{errors.panNumber}</span>}

              {/* Mobile PAN Photo Upload */}
              <DocumentPhotoUpload
                id="mobile-pan-doc"
                label="PAN Card"
                subLabel="Take photo or choose file. Auto-compressed (<100 KB)."
                value={formData.panPhotoUrl}
                onChange={(url) => setFormData({ ...formData, panPhotoUrl: url || '' })}
              />
            </div>

            <div className="m-form-group">
              <span className="m-form-label">Choose an optional profile photo</span>
              <div className="mobile-avatar-options" role="group" aria-label="Profile photo options">
                {sampleAvatars.map((url, index) => {
                  const selected = formData.photoUrl === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      className={selected ? 'selected' : ''}
                      aria-label={`Profile photo ${index + 1}${selected ? ', selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => setFormData({ ...formData, photoUrl: url })}
                    >
                      <img src={url} alt="" />
                      {selected && <span aria-hidden="true"><Check size={12} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mobile-privacy-note">
              <Lock size={17} />
              <span><strong>Your details stay private.</strong> Only authorised club staff can review KYC credentials.</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-three-title">
            <h2 id="mobile-step-three-title">Declaration & Membership Consent</h2>
            <p className="mobile-form-intro">Review your club membership declaration before submitting.</p>

            <label className={`mobile-consent-card ${errors.agreedToRules ? 'has-error' : ''}`}>
              <input
                type="checkbox"
                checked={formData.agreedToRules}
                aria-describedby={errors.agreedToRules ? 'mobile-rules-error' : undefined}
                onChange={(event) => setFormData({ ...formData, agreedToRules: event.target.checked })}
              />
              <span>
                <strong>Genuine KYC Declaration.</strong>
                I confirm that my Aadhaar and PAN card details are genuine and belong to me. I agree to the club&apos;s rules and responsible-gaming policy.
              </span>
            </label>
            {errors.agreedToRules && <span id="mobile-rules-error" className="m-field-error" role="alert">{errors.agreedToRules}</span>}

            <div className="mobile-privacy-note">
              <FileText size={17} />
              <span>Submitting creates your digital pass and registers your club membership.</span>
            </div>
          </div>
        )}

        <div className="mobile-form-actions">
          {step > 1 ? (
            <button
              type="button"
              className="m-btn m-btn-secondary"
              onClick={() => goToStep((step - 1) as RegistrationStep)}
              disabled={submitting}
            >
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              className="m-btn m-btn-primary"
              onClick={handleNext}
            >
              Next step <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="m-btn m-btn-primary"
              disabled={submitting}
            >
              <ShieldCheck size={18} /> {submitting ? 'Generating pass…' : 'Create pass'}
            </button>
          )}
        </div>
      </form>

      {/* Mobile Registration OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        phone={formData.phone}
        purpose="registration"
        onSuccess={handleOtpSuccess}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </section>
  );
};
