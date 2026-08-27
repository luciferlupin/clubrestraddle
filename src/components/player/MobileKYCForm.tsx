import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import confetti from 'canvas-confetti';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';
import { PhoneVerificationModal } from '../common/PhoneVerificationModal';
import { CARTOON_AVATARS } from '../../utils/cartoonAvatars';
import { getKycDraft, saveKycDraft, clearKycDraft, KycFormData } from '../../utils/kycDraftStorage';
import { RotateCcw } from 'lucide-react';

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

  // Load saved draft if present (e.g. returning after choosing photo from gallery or app switch)
  const initialDraft = getKycDraft();

  const [step, setStep] = useState<RegistrationStep>(() => {
    if (initialDraft && initialDraft.step >= 1 && initialDraft.step <= 3) {
      return initialDraft.step as RegistrationStep;
    }
    return 1;
  });

  const [formData, setFormData] = useState<KycFormData>(() => {
    if (initialDraft && initialDraft.formData) {
      return {
        fullName: initialDraft.formData.fullName || '',
        phone: initialDraft.formData.phone || '',
        email: initialDraft.formData.email || '',
        aadhaarNumber: initialDraft.formData.aadhaarNumber || '',
        panNumber: initialDraft.formData.panNumber || '',
        aadhaarPhotoUrl: initialDraft.formData.aadhaarPhotoUrl || '',
        aadhaarBackPhotoUrl: initialDraft.formData.aadhaarBackPhotoUrl || '',
        panPhotoUrl: initialDraft.formData.panPhotoUrl || '',
        address: initialDraft.formData.address || '',
        emergencyContactName: initialDraft.formData.emergencyContactName || '',
        emergencyContactPhone: initialDraft.formData.emergencyContactPhone || '',
        photoUrl: initialDraft.formData.photoUrl || CARTOON_AVATARS[0].url,
        agreedToRules: Boolean(initialDraft.formData.agreedToRules),
      };
    }
    return {
      fullName: '',
      phone: '',
      email: '',
      aadhaarNumber: '',
      panNumber: '',
      aadhaarPhotoUrl: '',
      aadhaarBackPhotoUrl: '',
      panPhotoUrl: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      photoUrl: CARTOON_AVATARS[0].url,
      agreedToRules: false,
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(() => {
    return Boolean(initialDraft?.isPhoneVerified);
  });
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string>(() => {
    return initialDraft?.verifiedPhoneNumber || '';
  });
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState<boolean>(() => {
    return Boolean(initialDraft && (initialDraft.step > 1 || initialDraft.formData?.fullName || initialDraft.formData?.aadhaarNumber));
  });

  // Auto-save form draft whenever form fields, step, or phone verification status change
  React.useEffect(() => {
    const hasContent = Boolean(
      formData.fullName ||
      formData.phone ||
      formData.aadhaarNumber ||
      formData.aadhaarPhotoUrl ||
      formData.panPhotoUrl ||
      step > 1
    );
    if (hasContent) {
      saveKycDraft({
        formData,
        step,
        isPhoneVerified,
        verifiedPhoneNumber,
      });
    }
  }, [formData, step, isPhoneVerified, verifiedPhoneNumber]);

  const handleResetForm = () => {
    clearKycDraft();
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      aadhaarNumber: '',
      panNumber: '',
      aadhaarPhotoUrl: '',
      aadhaarBackPhotoUrl: '',
      panPhotoUrl: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      photoUrl: CARTOON_AVATARS[0].url,
      agreedToRules: false,
    });
    setStep(1);
    setIsPhoneVerified(false);
    setVerifiedPhoneNumber('');
    setHasDraftRestored(false);
    setErrors({});
  };

  const sampleAvatars = CARTOON_AVATARS.map(avatar => avatar.url);

  const getValidationErrors = (targetStep?: RegistrationStep) => {
    const nextErrors: Record<string, string> = {};

    if (!targetStep || targetStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Enter your name as it appears on your ID.';
      const cleanDigits = formData.phone.replace(/\D/g, '').slice(-10);
      if (!formData.phone.trim()) {
        nextErrors.phone = 'Enter your mobile number.';
      } else if (cleanDigits.length !== 10) {
        nextErrors.phone = 'Enter a valid 10-digit mobile number.';
      } else if (!isPhoneVerified || verifiedPhoneNumber !== formData.phone) {
        nextErrors.phone = 'Mobile SMS verification is mandatory. Please verify your phone via OTP to proceed to Step 2.';
      }
      if (!formData.email.trim() || !formData.email.includes('@')) nextErrors.email = 'Enter a valid email address.';
    }

    if (!targetStep || targetStep === 2) {
      const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
      if (!cleanAadhaar) {
        nextErrors.aadhaarNumber = 'Aadhaar Card number is required.';
      } else if (cleanAadhaar.length !== 12) {
        nextErrors.aadhaarNumber = 'Aadhaar number must be exactly 12 digits.';
      }
      if (!formData.aadhaarPhotoUrl) nextErrors.aadhaarPhotoUrl = 'Aadhaar Card Front photo upload is mandatory to proceed.';
      if (!formData.aadhaarBackPhotoUrl) nextErrors.aadhaarBackPhotoUrl = 'Aadhaar Card Back photo upload is mandatory to proceed.';

      const cleanPan = formData.panNumber.trim().toUpperCase();
      if (!cleanPan) {
        nextErrors.panNumber = 'PAN Card number is required.';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
        nextErrors.panNumber = 'Enter a valid 10-character PAN (e.g. ABCDE1234F).';
      }
      if (!formData.panPhotoUrl) nextErrors.panPhotoUrl = 'PAN Card photo upload is mandatory to proceed.';
    }

    if (!targetStep || targetStep === 3) {
      if (!formData.agreedToRules) nextErrors.agreedToRules = 'Please confirm the genuine declaration & house-rules.';
    }

    return nextErrors;
  };

  const goToStep = (nextStep: RegistrationStep) => {
    // Validate all previous steps before allowing step jump
    for (let s = 1; s < nextStep; s++) {
      const prevErrors = getValidationErrors(s as RegistrationStep);
      if (Object.keys(prevErrors).length > 0) {
        setErrors(prevErrors);
        setStep(s as RegistrationStep);
        if (s === 1 && !isPhoneVerified && formData.phone.replace(/\D/g, '').length >= 10) {
          setIsVerifyModalOpen(true);
        }
        return;
      }
    }

    setStep(nextStep);
    setErrors({});
    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleNext = () => {
    const stepErrors = getValidationErrors(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      if (step === 1 && (!isPhoneVerified || verifiedPhoneNumber !== formData.phone) && formData.phone.replace(/\D/g, '').length >= 10) {
        setIsVerifyModalOpen(true);
      }
      return;
    }

    goToStep((step + 1) as RegistrationStep);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = getValidationErrors();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.fullName || validationErrors.phone || validationErrors.email) {
        setStep(1);
      } else if (validationErrors.aadhaarNumber || validationErrors.panNumber || validationErrors.aadhaarPhotoUrl || validationErrors.aadhaarBackPhotoUrl || validationErrors.panPhotoUrl) {
        setStep(2);
      }
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const cleanPan = formData.panNumber.trim().toUpperCase();
      const cleanAadhaar = formData.aadhaarNumber.trim();
      const phoneIsVerified = isPhoneVerified && verifiedPhoneNumber === formData.phone;

      const result = registerNewPlayer(
        {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          phoneVerified: phoneIsVerified,
          phoneVerifiedAt: phoneIsVerified ? new Date().toISOString() : undefined,
          aadhaarNumber: cleanAadhaar,
          panNumber: cleanPan,
          aadhaarPhotoUrl: formData.aadhaarPhotoUrl || undefined,
          aadhaarBackPhotoUrl: formData.aadhaarBackPhotoUrl || undefined,
          panPhotoUrl: formData.panPhotoUrl || undefined,
          govtIdType: 'Aadhaar & PAN Card',
          govtIdNumber: `PAN: ${cleanPan} | Aadhaar: ${cleanAadhaar}`,
          address: formData.address || 'Delhi NCR, India',
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          photoUrl: formData.photoUrl,
          agreedToRules: formData.agreedToRules,
        },
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

      clearKycDraft();
      setSubmitting(false);
      onSuccess(result);
    }, 300);
  };

  return (
    <section className="mobile-kyc-flow" ref={formTopRef} aria-labelledby="mobile-kyc-title">
      <div className="mobile-flow-heading" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" className="mobile-icon-button" onClick={onCancel} aria-label="Back to player options">
            <ArrowLeft size={21} />
          </button>
          <div>
            <span className="mobile-flow-eyebrow">New member check-in</span>
            <h1 id="mobile-kyc-title">Create your player pass</h1>
          </div>
        </div>
        {hasDraftRestored && (
          <button
            type="button"
            className="mobile-icon-button"
            style={{ fontSize: '0.75rem', color: '#fca5a5', width: 'auto', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)', gap: '4px', display: 'flex', alignItems: 'center' }}
            onClick={handleResetForm}
            title="Reset form"
          >
            <RotateCcw size={13} /> <span>Reset</span>
          </button>
        )}
      </div>

      {hasDraftRestored && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(225, 29, 72, 0.18), rgba(244, 63, 94, 0.08))',
            border: '1px solid rgba(225, 29, 72, 0.35)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '0.78rem',
            color: '#fda4af',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#34d399" />
            <span>
              <strong>Draft Restored:</strong> Continuing at <strong>Step {step} ({stepDetails.find(d => d.number === step)?.label})</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHasDraftRestored(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </div>
      )}

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="m-form-label" htmlFor="mobile-phone" style={{ marginBottom: 0 }}>
                  Mobile number
                </label>
                {isPhoneVerified && verifiedPhoneNumber === formData.phone ? (
                  <span className="phone-verified-pill">
                    <CheckCircle2 size={13} /> SMS Verified
                  </span>
                ) : formData.phone.replace(/\D/g, '').length >= 10 ? (
                  <button
                    type="button"
                    className="phone-verify-action-btn"
                    onClick={() => setIsVerifyModalOpen(true)}
                  >
                    <Smartphone size={13} /> Verify via SMS
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
                    const nextPhone = event.target.value;
                    setFormData({ ...formData, phone: nextPhone });
                    if (isPhoneVerified && nextPhone !== verifiedPhoneNumber) {
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
            <h2 id="mobile-step-two-title">Aadhaar & PAN</h2>

            {/* Aadhaar Card Input */}
            <div className="m-form-group mobile-id-field">
              <label className="m-form-label" htmlFor="mobile-aadhaar-number">Aadhaar Card number</label>
              <input
                id="mobile-aadhaar-number"
                type="text"
                inputMode="numeric"
                className="m-input"
                placeholder="e.g. 5432 8765 4321"
                maxLength={14}
                value={formData.aadhaarNumber}
                aria-invalid={Boolean(errors.aadhaarNumber)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 12);
                  setFormData({ ...formData, aadhaarNumber: digits.replace(/(\d{4})(?=\d)/g, '$1 ') });
                }}
              />
              {errors.aadhaarNumber && <span className="m-field-error" role="alert">{errors.aadhaarNumber}</span>}

              {/* Mobile Aadhaar Front Photo Upload */}
              <DocumentPhotoUpload
                id="mobile-aadhaar-doc"
                label="Aadhaar Card (Front)"
                subLabel="Choose front photo from gallery/files or snap with camera."
                value={formData.aadhaarPhotoUrl}
                onChange={(url) => setFormData({ ...formData, aadhaarPhotoUrl: url || '' })}
                required
              />
              {errors.aadhaarPhotoUrl && <span className="m-field-error" role="alert">{errors.aadhaarPhotoUrl}</span>}

              {/* Mobile Aadhaar Back Photo Upload */}
              <DocumentPhotoUpload
                id="mobile-aadhaar-back-doc"
                label="Aadhaar Card (Back)"
                subLabel="Choose back photo with address from gallery/files or snap with camera."
                value={formData.aadhaarBackPhotoUrl}
                onChange={(url) => setFormData({ ...formData, aadhaarBackPhotoUrl: url || '' })}
                required
              />
              {errors.aadhaarBackPhotoUrl && <span className="m-field-error" role="alert">{errors.aadhaarBackPhotoUrl}</span>}
            </div>

            {/* PAN Card Input */}
            <div className="m-form-group mobile-id-field">
              <label className="m-form-label" htmlFor="mobile-pan-number">PAN Card number</label>
              <input
                id="mobile-pan-number"
                type="text"
                className="m-input"
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                value={formData.panNumber}
                aria-invalid={Boolean(errors.panNumber)}
                onChange={(event) => setFormData({ ...formData, panNumber: event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase() })}
              />
              {errors.panNumber && <span className="m-field-error" role="alert">{errors.panNumber}</span>}

              {/* Mobile PAN Photo Upload */}
              <DocumentPhotoUpload
                id="mobile-pan-doc"
                label="PAN Card"
                subLabel="Choose from gallery/files or snap with camera."
                value={formData.panPhotoUrl}
                onChange={(url) => setFormData({ ...formData, panPhotoUrl: url || '' })}
                required
              />
              {errors.panPhotoUrl && <span className="m-field-error" role="alert">{errors.panPhotoUrl}</span>}
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

          </div>
        )}

        {step === 3 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-three-title">
            <h2 id="mobile-step-three-title">Confirm details</h2>

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

      <PhoneVerificationModal
        isOpen={isVerifyModalOpen}
        phone={formData.phone}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={(verifiedNumber) => {
          setIsPhoneVerified(true);
          setVerifiedPhoneNumber(formData.phone);
        }}
      />
    </section>
  );
};
