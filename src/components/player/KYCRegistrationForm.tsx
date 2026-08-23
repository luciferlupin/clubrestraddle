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
  CreditCard,
  Check,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId, formatPlayerNumber } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';
import { CARTOON_AVATARS } from '../../utils/cartoonAvatars';

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
    aadhaarNumber: '',
    panNumber: '',
    aadhaarPhotoUrl: '',
    panPhotoUrl: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    photoUrl: CARTOON_AVATARS[0].url,
    agreedToRules: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registeredData, setRegisteredData] = useState<{ player: Player; checkIn: DailyCheckIn } | null>(null);

  const samplePhotos = CARTOON_AVATARS;

  const steps = [
    { num: 1 as FormWizardStep, title: 'Personal Info', desc: 'Name, phone & email', icon: <User size={15} /> },
    { num: 2 as FormWizardStep, title: 'ID Verification', desc: 'Aadhaar & PAN cards', icon: <BadgeCheck size={15} /> },
    { num: 3 as FormWizardStep, title: 'Emergency', desc: 'Emergency contact', icon: <HeartHandshake size={15} /> },
    { num: 4 as FormWizardStep, title: 'Confirmation', desc: 'Rules & pass', icon: <ShieldCheck size={15} /> },
  ];

  const handleAutofill = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const autoPhone = `+91 98${Math.floor(10 + Math.random() * 89)} ${randomDigits}`;
    setFormData({
      fullName: 'Aditya Singhal',
      phone: autoPhone,
      email: `aditya.singhal.${randomDigits}@gmail.com`,
      aadhaarNumber: `5432 8765 ${randomDigits}`,
      panNumber: `ABCPS${randomDigits}R`,
      aadhaarPhotoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      panPhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      address: 'Sector 104, Noida, Uttar Pradesh - 201304',
      emergencyContactName: 'Pooja Singhal',
      emergencyContactPhone: '+91 98112 34567',
      photoUrl: CARTOON_AVATARS[0].url,
      agreedToRules: true,
    });
    setErrors({});
  };

  const validateStep = (step: FormWizardStep) => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required';
      if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
      if (!formData.address.trim()) errs.address = 'Residential address is required';
    }

    if (step === 2) {
      const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
      if (!cleanAadhaar) {
        errs.aadhaarNumber = 'Aadhaar Card number is required';
      } else if (cleanAadhaar.length !== 12) {
        errs.aadhaarNumber = 'Aadhaar number must be exactly 12 digits';
      }

      const cleanPan = formData.panNumber.trim().toUpperCase();
      if (!cleanPan) {
        errs.panNumber = 'PAN Card number is required';
      } else if (cleanPan.length !== 10) {
        errs.panNumber = 'PAN must be exactly 10 alphanumeric characters (e.g. ABCDE1234F)';
      }
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
          address: formData.address,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          photoUrl: formData.photoUrl,
          agreedToRules: formData.agreedToRules,
        }
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
          Welcome to Club Re Straddle, <strong>{registeredData.player.fullName}</strong>. Your membership pass has been generated with verified Aadhaar & PAN credentials.
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
            DOOR CLEARANCE QR PASS • PLAYER ID {formatPlayerNumber(registeredData.player)}
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
            <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{formatPlayerNumber(registeredData.player)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Aadhaar Card:</span>
            <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {registeredData.player.kyc.aadhaarNumber ? maskGovtId(registeredData.player.kyc.aadhaarNumber) : 'Verified'}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>PAN Card:</span>
            <strong style={{ color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
              {registeredData.player.kyc.panNumber || 'Verified'}
            </strong>
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
          👉 <strong>Next Step:</strong> Please present the QR code above to the <strong>Security Officer</strong> at the club entrance. They will scan and verify your Aadhaar & PAN for instant door clearance.
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
              Member KYC Registration (Aadhaar & PAN)
            </h3>
            <p className="card-subtitle">
              Step {currentStep} of 4 · Complete KYC verification with Aadhaar & PAN to obtain your digital pass.
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
                <label className="form-label" htmlFor="kyc-address">Residential City / Address *</label>
                <input
                  id="kyc-address"
                  type="text"
                  className="form-input"
                  placeholder="Street address, City, State"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
                {errors.address && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.address}</span>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TWO ID PROOFS (AADHAAR & PAN CARD) */}
        {currentStep === 2 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="#e11d48" /> 2. Government Identity Proofs (Both Required)
            </h4>

            {/* Two ID Cards Box */}
            <div className="form-grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
              {/* Aadhaar Card Field */}
              <div
                style={{
                  background: 'rgba(225, 29, 72, 0.08)',
                  border: '1px solid rgba(225, 29, 72, 0.35)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" htmlFor="kyc-aadhaar" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} color="#e11d48" />
                    <strong>1. Aadhaar Card Number *</strong>
                  </label>
                  <span style={{ fontSize: '0.68rem', background: '#e11d48', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    12 DIGITS
                  </span>
                </div>
                <input
                  id="kyc-aadhaar"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 5432 8765 4321"
                  value={formData.aadhaarNumber}
                  maxLength={14}
                  onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                  autoFocus
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Government UIDAI 12-digit identification number
                </span>
                {errors.aadhaarNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{errors.aadhaarNumber}</span>}

                {/* Aadhaar Document Photo Upload */}
                <DocumentPhotoUpload
                  id="kyc-aadhaar-doc-upload"
                  label="Aadhaar Card"
                  subLabel="Choose photo from gallery/files or capture with camera."
                  value={formData.aadhaarPhotoUrl}
                  onChange={(url) => setFormData({ ...formData, aadhaarPhotoUrl: url || '' })}
                />
              </div>

              {/* PAN Card Field */}
              <div
                style={{
                  background: 'rgba(225, 29, 72, 0.08)',
                  border: '1px solid rgba(225, 29, 72, 0.35)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" htmlFor="kyc-pan" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BadgeCheck size={16} color="#e11d48" />
                    <strong>2. PAN Card Number *</strong>
                  </label>
                  <span style={{ fontSize: '0.68rem', background: '#0f172a', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)' }}>
                    10 CHARS
                  </span>
                </div>
                <input
                  id="kyc-pan"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber}
                  maxLength={10}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Income Tax Permanent Account Number (for tax invoice & TDS)
                </span>
                {errors.panNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{errors.panNumber}</span>}

                {/* PAN Document Photo Upload */}
                <DocumentPhotoUpload
                  id="kyc-pan-doc-upload"
                  label="PAN Card"
                  subLabel="Choose photo from gallery/files or capture with camera."
                  value={formData.panPhotoUrl}
                  onChange={(url) => setFormData({ ...formData, panPhotoUrl: url || '' })}
                />
              </div>
            </div>

            {/* Profile Avatar Selection */}
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Member Profile Avatar Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <img
                  src={formData.photoUrl}
                  alt="Selected avatar"
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e11d48' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {samplePhotos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, photoUrl: p.url })}
                      style={{
                        padding: '4px',
                        borderRadius: '50%',
                        border: formData.photoUrl === p.url ? '2px solid #e11d48' : '1px solid rgba(255,255,255,0.2)',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <img src={p.url} alt={p.label} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EMERGENCY CONTACT */}
        {currentStep === 3 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartHandshake size={16} color="#e11d48" /> 3. Emergency Contact Details
            </h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="kyc-emergency-name">Emergency Contact Name</label>
                <input
                  id="kyc-emergency-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pooja Singhal"
                  value={formData.emergencyContactName}
                  onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="kyc-emergency-phone">Emergency Contact Mobile</label>
                <input
                  id="kyc-emergency-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98112 34567"
                  value={formData.emergencyContactPhone}
                  onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & RULES DECLARATION */}
        {currentStep === 4 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#e11d48" /> 4. Review & Declarations
            </h4>

            {/* Summary Preview Card */}
            <div style={{ background: '#130508', border: '1px solid rgba(225, 29, 72, 0.4)', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Player Name:</span>
                  <div style={{ fontWeight: 800, color: '#ffffff' }}>{formData.fullName}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Phone Number:</span>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{formData.phone}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Aadhaar Card:</span>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                    {maskGovtId(formData.aadhaarNumber)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>PAN Card:</span>
                  <div style={{ fontWeight: 700, color: '#fb7185', fontFamily: 'monospace' }}>
                    {formData.panNumber.toUpperCase()}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Email:</span>
                  <div style={{ color: '#cbd5e1' }}>{formData.email}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Emergency Contact:</span>
                  <div style={{ color: '#cbd5e1' }}>{formData.emergencyContactName || '—'}</div>
                </div>
              </div>

              {(formData.aadhaarPhotoUrl || formData.panPhotoUrl) && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {formData.aadhaarPhotoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={formData.aadhaarPhotoUrl}
                        alt="Aadhaar Card"
                        style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(225,29,72,0.5)' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#6ee7b7' }}>✓ Aadhaar Photo Attached</span>
                    </div>
                  )}
                  {formData.panPhotoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={formData.panPhotoUrl}
                        alt="PAN Card"
                        style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(225,29,72,0.5)' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#6ee7b7' }}>✓ PAN Photo Attached</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rules Checkbox */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.agreedToRules}
                  onChange={e => setFormData({ ...formData, agreedToRules: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#e11d48', marginTop: '2px' }}
                />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  I confirm that all submitted details and identity documents (Aadhaar & PAN) are genuine and belong to me. I agree to abide by the club code of conduct, responsible gaming policies, and applicable taxation norms.
                </span>
              </label>
              {errors.agreedToRules && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{errors.agreedToRules}</div>}
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          {currentStep > 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevStep}
              disabled={submitting}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              <CheckCircle2 size={18} />
              <span>{submitting ? 'Registering Player...' : 'Complete Registration & Generate Pass'}</span>
            </button>
          )}
        </div>
      </form>

    </div>
  );
};
