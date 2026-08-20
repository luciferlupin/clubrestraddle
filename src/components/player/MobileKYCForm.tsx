import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  FileText,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { GovtIdType, Player, DailyCheckIn } from '../../types';
import confetti from 'canvas-confetti';

interface MobileKYCFormProps {
  onSuccess: (result: { player: Player; checkIn: DailyCheckIn }) => void;
  onCancel?: () => void;
}

type RegistrationStep = 1 | 2 | 3;

const stepDetails = [
  { number: 1, label: 'About you', icon: UserRound },
  { number: 2, label: 'Verify ID', icon: BadgeCheck },
  { number: 3, label: 'Ready to play', icon: Check },
] as const;

export const MobileKYCForm: React.FC<MobileKYCFormProps> = ({ onSuccess, onCancel }) => {
  const { registerNewPlayer } = useClub();
  const formTopRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<RegistrationStep>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    govtIdType: 'Aadhaar Card' as GovtIdType,
    govtIdNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    agreedToRules: false,
    tablePreference: 'NLH Cash Game (₹250/₹500)',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  ];

  const maxBirthDate = new Date();
  maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 21);
  const maxBirthDateString = maxBirthDate.toISOString().split('T')[0];

  const getIdPlaceholder = () => {
    switch (formData.govtIdType) {
      case 'Aadhaar Card':
        return '12-digit Aadhaar number';
      case 'PAN Card':
        return 'ABCDE1234F';
      case 'Passport':
        return 'A1234567';
      case 'Driving License':
        return 'DL-1420110012345';
      case 'Voter ID':
        return 'Enter Voter ID number';
      default:
        return 'Enter ID number';
    }
  };

  const getValidationErrors = (targetStep?: RegistrationStep) => {
    const nextErrors: Record<string, string> = {};

    if (!targetStep || targetStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Enter your name as it appears on your ID.';
      if (!formData.phone.trim()) nextErrors.phone = 'Enter your mobile number.';
      if (!formData.email.trim() || !formData.email.includes('@')) nextErrors.email = 'Enter a valid email address.';

      if (!formData.dateOfBirth) {
        nextErrors.dateOfBirth = 'Select your date of birth.';
      } else if (formData.dateOfBirth > maxBirthDateString) {
        nextErrors.dateOfBirth = 'Club entry is available to players aged 21 and above.';
      }
    }

    if (!targetStep || targetStep === 2) {
      if (!formData.govtIdNumber.trim()) nextErrors.govtIdNumber = 'Enter your government ID number.';
    }

    if (!targetStep || targetStep === 3) {
      if (!formData.agreedToRules) nextErrors.agreedToRules = 'Please confirm the age and house-rules declaration.';
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
    goToStep((step + 1) as RegistrationStep);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = getValidationErrors();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.fullName || validationErrors.phone || validationErrors.email || validationErrors.dateOfBirth) {
        setStep(1);
      } else if (validationErrors.govtIdNumber) {
        setStep(2);
      }
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const result = registerNewPlayer(
        {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          govtIdType: formData.govtIdType,
          govtIdNumber: formData.govtIdNumber,
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
        // Registration still succeeds when the celebration effect is unavailable.
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
          <p>Three quick steps. Usually takes under two minutes.</p>
        </div>
      </div>

      <ol className="mobile-stepper" aria-label={`Registration progress: step ${step} of 3`}>
        {stepDetails.map(({ number, label, icon: StepIcon }) => (
          <li key={number} className={number === step ? 'active' : number < step ? 'complete' : ''}>
            <span className="mobile-step-dot" aria-hidden="true">
              {number < step ? <Check size={14} /> : <StepIcon size={14} />}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <form className="mobile-kyc-form" onSubmit={handleSubmit} noValidate>
        {step === 1 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-one-title">
            <h2 id="mobile-step-one-title">Tell us about yourself</h2>
            <p className="mobile-form-intro">Use the same details shown on your government ID.</p>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-full-name">Full legal name</label>
              <input
                id="mobile-full-name"
                type="text"
                className="m-input"
                placeholder="Your full name"
                autoComplete="name"
                value={formData.fullName}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'mobile-full-name-error' : undefined}
                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
              />
              {errors.fullName && <span id="mobile-full-name-error" className="m-field-error" role="alert">{errors.fullName}</span>}
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-phone">Mobile number</label>
              <input
                id="mobile-phone"
                type="tel"
                inputMode="tel"
                className="m-input"
                placeholder="98765 43210"
                autoComplete="tel"
                value={formData.phone}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'mobile-phone-error' : undefined}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              />
              {errors.phone && <span id="mobile-phone-error" className="m-field-error" role="alert">{errors.phone}</span>}
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-email">Email address</label>
              <input
                id="mobile-email"
                type="email"
                inputMode="email"
                className="m-input"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'mobile-email-error' : undefined}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
              {errors.email && <span id="mobile-email-error" className="m-field-error" role="alert">{errors.email}</span>}
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-dob">Date of birth</label>
              <input
                id="mobile-dob"
                type="date"
                className="m-input"
                max={maxBirthDateString}
                autoComplete="bday"
                value={formData.dateOfBirth}
                aria-invalid={Boolean(errors.dateOfBirth)}
                aria-describedby="mobile-dob-help"
                onChange={(event) => setFormData({ ...formData, dateOfBirth: event.target.value })}
              />
              <span id="mobile-dob-help" className={errors.dateOfBirth ? 'm-field-error' : 'm-field-help'} role={errors.dateOfBirth ? 'alert' : undefined}>
                {errors.dateOfBirth || 'Players must be 21 or older.'}
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-two-title">
            <h2 id="mobile-step-two-title">Verify your identity</h2>
            <p className="mobile-form-intro">Your ID is used only for age and membership verification.</p>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-id-type">Government ID type</label>
              <select
                id="mobile-id-type"
                className="m-select"
                value={formData.govtIdType}
                onChange={(event) => setFormData({ ...formData, govtIdType: event.target.value as GovtIdType, govtIdNumber: '' })}
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-id-number">ID number</label>
              <input
                id="mobile-id-number"
                type="text"
                className="m-input"
                placeholder={getIdPlaceholder()}
                autoCapitalize="characters"
                value={formData.govtIdNumber}
                aria-invalid={Boolean(errors.govtIdNumber)}
                aria-describedby={errors.govtIdNumber ? 'mobile-id-number-error' : 'mobile-id-number-help'}
                onChange={(event) => setFormData({ ...formData, govtIdNumber: event.target.value })}
              />
              {errors.govtIdNumber ? (
                <span id="mobile-id-number-error" className="m-field-error" role="alert">{errors.govtIdNumber}</span>
              ) : (
                <span id="mobile-id-number-help" className="m-field-help">Double-check the number before continuing.</span>
              )}
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
              <span><strong>Your details stay private.</strong> Only authorised club staff can review KYC information.</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="m-card mobile-form-card" role="group" aria-labelledby="mobile-step-three-title">
            <h2 id="mobile-step-three-title">Choose today&apos;s game</h2>
            <p className="mobile-form-intro">You can change this with the floor team after check-in.</p>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="mobile-table-preference">Preferred table</label>
              <select
                id="mobile-table-preference"
                className="m-select"
                value={formData.tablePreference}
                onChange={(event) => setFormData({ ...formData, tablePreference: event.target.value })}
              >
                <option value="NLH Cash Game (₹100/₹200)">No-Limit Holdem (₹100/₹200)</option>
                <option value="NLH Cash Game (₹250/₹500)">No-Limit Holdem (₹250/₹500)</option>
                <option value="High Stakes NLH (₹500/₹1000+)">High Stakes NLH (₹500/₹1000+)</option>
                <option value="Re Straddle High Roller Championship">Re Straddle High Roller Championship</option>
                <option value="Pot-Limit Omaha (PLO ₹250/₹500)">Pot-Limit Omaha (₹250/₹500)</option>
              </select>
            </div>

            <label className={`mobile-consent-card ${errors.agreedToRules ? 'has-error' : ''}`}>
              <input
                type="checkbox"
                checked={formData.agreedToRules}
                aria-describedby={errors.agreedToRules ? 'mobile-rules-error' : undefined}
                onChange={(event) => setFormData({ ...formData, agreedToRules: event.target.checked })}
              />
              <span>
                <strong>I confirm I am 21 or older.</strong>
                The information I provided is accurate, and I agree to the club&apos;s house rules and responsible-gaming policy.
              </span>
            </label>
            {errors.agreedToRules && <span id="mobile-rules-error" className="m-field-error" role="alert">{errors.agreedToRules}</span>}

            <div className="mobile-privacy-note">
              <FileText size={17} />
              <span>Submitting creates your digital pass and checks you in for today.</span>
            </div>
          </div>
        )}

        <div className="mobile-form-actions">
          {step > 1 && (
            <button type="button" className="m-btn m-btn-secondary" onClick={() => goToStep((step - 1) as RegistrationStep)}>
              <ArrowLeft size={18} /> Back
            </button>
          )}

          {step < 3 ? (
            <button type="button" className="m-btn m-btn-primary" onClick={handleNext}>
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button type="submit" className="m-btn m-btn-primary" disabled={submitting}>
              <ShieldCheck size={18} />
              {submitting ? 'Creating your pass…' : 'Create pass & check in'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
};
