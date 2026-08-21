import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  Sparkles,
  FileText,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  BadgeCheck,
  Phone,
  Check,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useClub } from '../../context/ClubContext';
import { GovtIdType, Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface KYCRegistrationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

type FormWizardStep = 1 | 2 | 3 | 4;

export const KYCRegistrationForm: React.FC<KYCRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { registerNewPlayer } = useClub();
  const [currentStep, setCurrentStep] = useState<FormWizardStep>(1);

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
  const [registeredData, setRegisteredData] = useState<{ player: Player; checkIn: DailyCheckIn } | null>(null);

  const samplePhotos = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  ];

  const steps = [
    { num: 1 as FormWizardStep, title: 'Personal Info', desc: 'Name, phone & DOB', icon: <User size={15} /> },
    { num: 2 as FormWizardStep, title: 'ID Verification', desc: 'Aadhaar/PAN & photo', icon: <BadgeCheck size={15} /> },
    { num: 3 as FormWizardStep, title: 'Preferences', desc: 'Table & emergency', icon: <HeartHandshake size={15} /> },
    { num: 4 as FormWizardStep, title: 'Confirmation', desc: 'Rules & pass', icon: <ShieldCheck size={15} /> },
  ];

  const handleAutofill = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      fullName: 'Aditya Singhal',
      phone: `+91 98${Math.floor(10 + Math.random() * 89)} ${Math.floor(1000 + Math.random() * 9000)}`,
      email: `aditya.singhal.${randomId}@gmail.com`,
      dateOfBirth: '1993-06-18',
      govtIdType: 'Aadhaar Card',
      govtIdNumber: `5432 8765 ${randomId}`,
      address: 'Tower 4, DLF Cyber City, Phase 2, Gurugram, Haryana - 122002',
      emergencyContactName: 'Pooja Singhal',
      emergencyContactPhone: '+91 98112 34567',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      agreedToRules: true,
      tablePreference: 'Re Straddle High Roller Championship',
    });
    setErrors({});
  };

  const validateStep = (step: FormWizardStep) => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required';
      if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
      if (!formData.dateOfBirth) {
        errs.dateOfBirth = 'Date of birth is required';
      } else {
        const dob = new Date(formData.dateOfBirth);
        const diff = Date.now() - dob.getTime();
        const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
        if (isNaN(age) || age < 21) {
          errs.dateOfBirth = `Player must be at least 21 years of age (Calculated age: ${age || 0})`;
        }
      }
      if (!formData.address.trim()) errs.address = 'Residential address is required';
    }

    if (step === 2) {
      if (!formData.govtIdNumber.trim()) errs.govtIdNumber = 'Govt ID Number is required';
    }

    if (step === 4) {
      if (!formData.agreedToRules) errs.agreedToRules = 'You must agree to club rules & KYC declaration';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as FormWizardStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormWizardStep);
      setErrors({});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

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
          address: formData.address,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          photoUrl: formData.photoUrl,
          agreedToRules: formData.agreedToRules,
        },
        formData.tablePreference
      );

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
        });
      } catch {
        // Fallback
      }

      setSubmitting(false);
      setRegisteredData(result);
    }, 400);
  };

  const getIdPlaceholder = () => {
    switch (formData.govtIdType) {
      case 'Aadhaar Card':
        return 'e.g. 5432 8765 4321 (12 digits)';
      case 'PAN Card':
        return 'e.g. ABCDE1234F (10 characters)';
      case 'Passport':
        return 'e.g. A1234567';
      case 'Driving License':
        return 'e.g. DL-1420110012345';
      case 'Voter ID':
        return 'e.g. EPIC-9923841';
      default:
        return 'Enter Government ID Number';
    }
  };

  // If Registration succeeded, show the Door Clearance QR Pass
  if (registeredData) {
    const verificationUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?portal=security&scan=${registeredData.checkIn.id}&player=${registeredData.player.id}`
      : `https://clubrestraddle.vercel.app/?portal=security&scan=${registeredData.checkIn.id}&player=${registeredData.player.id}`;

    return (
      <div
        className="card"
        style={{
          maxWidth: '580px',
          margin: '0 auto',
          border: '1.5px solid #e11d48',
          boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 30px rgba(225,29,72,0.2)',
          padding: '32px 24px',
          textAlign: 'center',
          background: 'linear-gradient(160deg, #15060b 0%, #090305 100%)',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.35), rgba(159, 18, 57, 0.5))',
            border: '2px solid #e11d48',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 24px rgba(225,29,72,0.4)',
          }}
        >
          <CheckCircle2 size={38} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
          KYC Registration Completed!
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#cbd5e1', marginBottom: '20px' }}>
          Welcome to Club Re Straddle, <strong>{registeredData.player.fullName}</strong>. Your membership pass has been generated.
        </p>

        {/* High-Contrast QR Clearance Pass */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            border: '3px solid #e11d48',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <QRCodeSVG
            value={verificationUrl}
            size={180}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="H"
          />
          <span style={{ color: '#0f172a', fontSize: '0.74rem', fontWeight: 800, marginTop: '8px', letterSpacing: '0.04em' }}>
            DOOR CLEARANCE QR PASS • {registeredData.player.id}
          </span>
        </div>

        {/* Clearance Card Info */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(225, 29, 72, 0.35)',
            borderRadius: '12px',
            padding: '14px 18px',
            textAlign: 'left',
            marginBottom: '20px',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Member ID:</span>
            <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{registeredData.player.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Identity Document:</span>
            <strong style={{ color: '#ffffff' }}>{registeredData.player.kyc.govtIdType}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Check-In Time:</span>
            <strong style={{ color: '#ffffff' }}>Today at {formatTimeOnly(registeredData.checkIn.checkInTime)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Status:</span>
            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
              <span className="badge-dot" /> Awaiting Security Scan
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(225, 29, 72, 0.12)',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.8rem',
            color: '#fda4af',
            textAlign: 'left',
            marginBottom: '20px',
          }}
        >
          👉 <strong>Next Step:</strong> Please present the QR code above to the <strong>Security Officer</strong> at the club entrance. They will scan and verify your Aadhaar / PAN for instant door clearance.
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onSuccess}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span>Enter Member Lounge Dashboard</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="card wizard-container" style={{ maxWidth: '780px', margin: '0 auto', border: '1px solid rgba(225, 29, 72, 0.45)', position: 'relative' }}>
      <form onSubmit={handleSubmit}>
        {/* Header with Title & Quick Autofill */}
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="card-title">
              <UserPlus size={18} color="#e11d48" />
              Member KYC & Profile Registration
            </h3>
            <p className="card-subtitle">
              Step {currentStep} of 4 · Complete registration to obtain your verified digital pass.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAutofill}
            >
              <Sparkles size={14} /> Quick Demo Fill
            </button>
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Interactive Stepper Tracker */}
        <div className="wizard-step-tracker" role="navigation" aria-label="Registration Steps">
          {steps.map((s, idx) => {
            const isActive = s.num === currentStep;
            const isComplete = s.num < currentStep;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  className={`wizard-step-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                  onClick={() => {
                    // Allow clicking previous steps or validated next
                    if (s.num < currentStep) {
                      setCurrentStep(s.num);
                    } else if (s.num === currentStep + 1 && validateStep(currentStep)) {
                      setCurrentStep(s.num);
                    }
                  }}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="wizard-step-badge">
                    {isComplete ? <Check size={14} /> : s.num}
                  </span>
                  <div className="wizard-step-text">
                    <span className="wizard-step-title">{s.title}</span>
                    <span className="wizard-step-desc">{s.desc}</span>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`wizard-step-connector ${isComplete ? 'complete' : ''}`} aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: PERSONAL & CONTACT INFORMATION */}
        {currentStep === 1 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#e11d48" /> 1. Personal & Contact Information
            </h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="kyc-full-name">Full Legal Name (as per Govt ID) *</label>
                <input
                  id="kyc-full-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aditya Singhal"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  autoFocus
                />
                {errors.fullName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="kyc-phone">Primary Mobile Number *</label>
                <input
                  id="kyc-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.phone}</span>}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="kyc-email">Email Address *</label>
                <input
                  id="kyc-email"
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="kyc-date-of-birth">Date of Birth (Must be 21+) *</label>
                <input
                  id="kyc-date-of-birth"
                  type="date"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                {errors.dateOfBirth && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.dateOfBirth}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="kyc-address">Residential Address *</label>
              <input
                id="kyc-address"
                type="text"
                className="form-input"
                placeholder="Street address, City, State, PIN Code"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
              {errors.address && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.address}</span>}
            </div>
          </div>
        )}

        {/* STEP 2: GOVERNMENT ID & PHOTO */}
        {currentStep === 2 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="#e11d48" /> 2. Government Identity Verification (Aadhaar / PAN)
            </h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="kyc-id-type">Government ID Type *</label>
                <select
                  id="kyc-id-type"
                  className="form-select"
                  value={formData.govtIdType}
                  onChange={e => setFormData({ ...formData, govtIdType: e.target.value as GovtIdType })}
                >
                  <option value="Aadhaar Card">Aadhaar Card (12-Digit UIDAI)</option>
                  <option value="PAN Card">PAN Card (10-Digit Alphanumeric)</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="kyc-id-number">Govt ID Number *</label>
                <input
                  id="kyc-id-number"
                  type="text"
                  className="form-input"
                  placeholder={getIdPlaceholder()}
                  value={formData.govtIdNumber}
                  onChange={e => setFormData({ ...formData, govtIdNumber: e.target.value })}
                  autoFocus
                />
                {errors.govtIdNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.govtIdNumber}</span>}
              </div>
            </div>

            {/* Avatar / Photo Selection */}
            <div className="form-group" style={{ marginTop: '10px' }}>
              <div className="form-label" id="kyc-avatar-label">Member Photo / Profile Avatar</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <img
                  src={formData.photoUrl}
                  alt="Selected Avatar"
                  style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #e11d48', objectFit: 'cover' }}
                />
                <div role="group" aria-labelledby="kyc-avatar-label" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {samplePhotos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-sm ${formData.photoUrl === p.url ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFormData({ ...formData, photoUrl: p.url })}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EMERGENCY CONTACT & PREFERENCES */}
        {currentStep === 3 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartHandshake size={16} color="#e11d48" /> 3. Emergency Contact & Table Preference
            </h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="kyc-emergency-name">Emergency Contact Name</label>
                <input
                  id="kyc-emergency-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pooja Singhal (Family/Spouse)"
                  value={formData.emergencyContactName}
                  onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="kyc-emergency-phone">Emergency Contact Phone</label>
                <input
                  id="kyc-emergency-phone"
                  type="text"
                  className="form-input"
                  placeholder="e.g. +91 98112 34567"
                  value={formData.emergencyContactPhone}
                  onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="kyc-table-preference">Today's Game / Table Preference</label>
              <select
                id="kyc-table-preference"
                className="form-select"
                value={formData.tablePreference}
                onChange={e => setFormData({ ...formData, tablePreference: e.target.value })}
              >
                <option value="NLH Cash Game (₹100/₹200)">No-Limit Holdem (₹100/₹200)</option>
                <option value="NLH Cash Game (₹250/₹500)">No-Limit Holdem (₹250/₹500)</option>
                <option value="High Stakes NLH (₹500/₹1000+)">High Stakes NLH (₹500/₹1000+)</option>
                <option value="Pot-Limit Omaha (PLO ₹250/₹500)">Pot-Limit Omaha (PLO ₹250/₹500)</option>
                <option value="Re Straddle High Roller Championship">Re Straddle High Roller Championship</option>
                <option value="VIP Private Lounge">VIP Private Lounge</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 4: RULES DECLARATION & REVIEW */}
        {currentStep === 4 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#e11d48" /> 4. Review Details & Complete Registration
            </h4>

            {/* Review Summary Card */}
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '0.84rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Member Name:</span>
                  <div style={{ fontWeight: 800, color: '#ffffff' }}>{formData.fullName || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Phone Number:</span>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{formData.phone || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Identity Document:</span>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{formData.govtIdType}: {formData.govtIdNumber ? maskGovtId(formData.govtIdNumber) : '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Game Preference:</span>
                  <div style={{ fontWeight: 700, color: '#fb7185' }}>{formData.tablePreference}</div>
                </div>
              </div>
            </div>

            {/* Club Rules Declaration */}
            <div style={{ background: 'rgba(225, 29, 72, 0.1)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(225, 29, 72, 0.35)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: '3px', accentColor: '#e11d48', width: '18px', height: '18px' }}
                  checked={formData.agreedToRules}
                  onChange={e => setFormData({ ...formData, agreedToRules: e.target.checked })}
                />
                <span style={{ fontSize: '0.84rem', color: '#ffffff', lineHeight: 1.45 }}>
                  I certify that I am at least 21 years of age, the government ID provided is authentic, and I agree to abide by Club Re Straddle house poker rules, zero-tolerance collusion policies, and responsible gaming guidelines.
                </span>
              </label>
              {errors.agreedToRules && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{errors.agreedToRules}</div>}
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons: Previous Step & Next Step */}
        <div className="wizard-nav-actions">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                className="wizard-prev-btn"
                onClick={handlePrevStep}
              >
                <ArrowLeft size={16} /> Previous Step
              </button>
            ) : onCancel ? (
              <button
                type="button"
                className="wizard-prev-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Step {currentStep} of 4
            </span>

            {currentStep < 4 ? (
              <button
                type="button"
                className="wizard-next-btn"
                onClick={handleNextStep}
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="wizard-next-btn"
                disabled={submitting}
              >
                <ShieldCheck size={18} />
                <span>{submitting ? 'Creating Pass…' : 'Submit KYC & Generate Pass'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
