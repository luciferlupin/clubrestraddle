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
  Clock3,
  Clock,
  Smartphone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId, formatPlayerNumber, formatCurrency } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';
import { CARTOON_AVATARS } from '../../utils/cartoonAvatars';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import { Eye, Receipt } from 'lucide-react';
import { PhoneVerificationModal } from '../common/PhoneVerificationModal';

interface KYCRegistrationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

type FormWizardStep = 1 | 2 | 3 | 4;

export const KYCRegistrationForm: React.FC<KYCRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { registerNewPlayer, staffName } = useClub();
  const [currentStep, setCurrentStep] = useState<FormWizardStep>(1);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const [formData, setFormData] = useState({
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
      aadhaarBackPhotoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
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
      if (!formData.fullName.trim()) errs.fullName = 'Full Legal Name is required';
      const cleanPhoneDigits = formData.phone.replace(/\D/g, '').slice(-10);
      if (!formData.phone.trim()) {
        errs.phone = 'Phone number is required';
      } else if (cleanPhoneDigits.length !== 10) {
        errs.phone = 'Enter a valid 10-digit mobile number';
      } else if (!isPhoneVerified || verifiedPhoneNumber !== formData.phone) {
        errs.phone = 'Mobile SMS verification is mandatory. Please verify your phone via OTP to proceed to Step 2.';
      }
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
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
        errs.panNumber = 'Enter a valid 10-character PAN (e.g. ABCDE1234F)';
      }

      if (!formData.aadhaarPhotoUrl) {
        errs.aadhaarPhotoUrl = 'Aadhaar Card Front photo upload is mandatory to proceed';
      }
      if (!formData.aadhaarBackPhotoUrl) {
        errs.aadhaarBackPhotoUrl = 'Aadhaar Card Back photo upload is mandatory to proceed';
      }
      if (!formData.panPhotoUrl) {
        errs.panPhotoUrl = 'PAN Card photo upload is mandatory to proceed';
      }
    }

    if (step === 4) {
      if (!formData.agreedToRules) errs.agreedToRules = 'You must agree to club rules & KYC declaration';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 1 && (!isPhoneVerified || verifiedPhoneNumber !== formData.phone) && formData.phone.replace(/\D/g, '').length >= 10) {
        setIsVerifyModalOpen(true);
      }
      return;
    }

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

    const isApproved = registeredData.checkIn.verificationStatus === 'approved';
    const entryInvoice: ClubInvoiceData | null = isApproved
      ? generateEntryFeeInvoice(
          registeredData.player,
          registeredData.checkIn,
          staffName || 'Club Front Desk'
        )
      : null;

    return (
      <div
        className="card"
        style={{
          maxWidth: '620px',
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
          Welcome to Club Re Straddle, <strong>{registeredData.player.fullName}</strong>. Your digital entrance pass is ready.
        </p>

        {/* Security Verification Notice */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '14px 18px',
            textAlign: 'left',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 800, fontSize: '0.88rem', marginBottom: '4px' }}>
            <Clock3 size={18} />
            <span>Awaiting Security Gate Clearance</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
            Please present the QR code below to the <strong>Security Guard</strong> at the door. Upon security verification and entrance approval, your ₹500 entry fee (inclusive of 5% Service Charge) will be processed and official tax invoice issued.
          </p>
        </div>

        {/* Official Entry Gate Fee Tax Invoice Card (ONLY WHEN APPROVED) */}
        {isApproved && entryInvoice && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(24, 8, 12, 0.95) 0%, rgba(12, 4, 6, 0.98) 100%)',
              border: '1.5px solid rgba(225, 29, 72, 0.45)',
              borderRadius: '14px',
              padding: '16px 18px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#e11d48" />
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>Entry Gate Fee Tax Invoice (SAC 999691 • 5% Service Charge)</span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                ✓ Paid ₹500
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1' }}>
              <span>Invoice Number:</span>
              <strong style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>{entryInvoice.invoiceNumber}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1' }}>
              <span>Taxable Entry Amount:</span>
              <span>{formatCurrency(entryInvoice.taxableAmount || 476.19)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1' }}>
              <span>Service Charge @ 5%:</span>
              <span>{formatCurrency(Math.round(((entryInvoice.totalAmount || 500) - (entryInvoice.taxableAmount || 476.19)) * 100) / 100)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
              <span>Total Gate Fee Charged (Incl. 5% Service Charge):</span>
              <span style={{ color: '#34d399' }}>{formatCurrency(entryInvoice.totalAmount || 500)}</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                marginTop: '4px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderColor: 'rgba(225, 29, 72, 0.4)',
                color: '#ffffff',
              }}
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              <Eye size={14} color="#e11d48" /> View / Print Official Tax Invoice Bill
            </button>
          </div>
        )}

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

        {/* Club Tax Invoice Modal */}
        <ClubTaxInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoice={entryInvoice}
        />
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
                    } else {
                      for (let stepIdx = 1; stepIdx < s.num; stepIdx++) {
                        if (!validateStep(stepIdx as FormWizardStep)) {
                          if (stepIdx === 1 && (!isPhoneVerified || verifiedPhoneNumber !== formData.phone) && formData.phone.replace(/\D/g, '').length >= 10) {
                            setIsVerifyModalOpen(true);
                          }
                          setCurrentStep(stepIdx as FormWizardStep);
                          return;
                        }
                      }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" htmlFor="kyc-phone" style={{ marginBottom: 0 }}>Primary Mobile Number *</label>
                  {isPhoneVerified && verifiedPhoneNumber === formData.phone ? (
                    <span className="phone-verified-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '999px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> SMS Verified
                    </span>
                  ) : formData.phone.replace(/\D/g, '').length >= 10 ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fda4af', borderColor: 'rgba(225,29,72,0.4)' }}
                      onClick={() => setIsVerifyModalOpen(true)}
                    >
                      <Smartphone size={12} /> Verify via SMS
                    </button>
                  ) : null}
                </div>
                <input
                  id="kyc-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={e => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (isPhoneVerified && e.target.value !== verifiedPhoneNumber) {
                      setIsPhoneVerified(false);
                    }
                  }}
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

                {/* Aadhaar Front Document Photo Upload */}
                <DocumentPhotoUpload
                  id="kyc-aadhaar-doc-upload"
                  label="Aadhaar Card (Front)"
                  subLabel="Choose front photo from gallery/files or capture with camera."
                  value={formData.aadhaarPhotoUrl}
                  onChange={(url) => setFormData({ ...formData, aadhaarPhotoUrl: url || '' })}
                  required
                />
                {errors.aadhaarPhotoUrl && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{errors.aadhaarPhotoUrl}</span>}

                {/* Aadhaar Back Document Photo Upload */}
                <DocumentPhotoUpload
                  id="kyc-aadhaar-back-doc-upload"
                  label="Aadhaar Card (Back)"
                  subLabel="Choose back photo with address from gallery/files or capture with camera."
                  value={formData.aadhaarBackPhotoUrl}
                  onChange={(url) => setFormData({ ...formData, aadhaarBackPhotoUrl: url || '' })}
                  required
                />
                {errors.aadhaarBackPhotoUrl && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{errors.aadhaarBackPhotoUrl}</span>}
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
                  required
                />
                {errors.panPhotoUrl && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{errors.panPhotoUrl}</span>}
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

              {(formData.aadhaarPhotoUrl || formData.aadhaarBackPhotoUrl || formData.panPhotoUrl) && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {formData.aadhaarPhotoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={formData.aadhaarPhotoUrl}
                        alt="Aadhaar Card Front"
                        style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(225,29,72,0.5)' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#6ee7b7' }}>✓ Aadhaar Front</span>
                    </div>
                  )}
                  {formData.aadhaarBackPhotoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={formData.aadhaarBackPhotoUrl}
                        alt="Aadhaar Card Back"
                        style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(225,29,72,0.5)' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#6ee7b7' }}>✓ Aadhaar Back</span>
                    </div>
                  )}
                  {formData.panPhotoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={formData.panPhotoUrl}
                        alt="PAN Card"
                        style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(225,29,72,0.5)' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#6ee7b7' }}>✓ PAN Card</span>
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

      {/* Phone SMS OTP Verification Modal */}
      <PhoneVerificationModal
        isOpen={isVerifyModalOpen}
        phone={formData.phone}
        title="Verify Mobile Number"
        subtitle={`We sent a 6-digit SMS security code to verify mobile number ${formData.phone}.`}
        onSuccess={(verifiedPhone) => {
          setIsPhoneVerified(true);
          setVerifiedPhoneNumber(formData.phone);
          setIsVerifyModalOpen(false);
        }}
        onClose={() => setIsVerifyModalOpen(false)}
      />

    </div>
  );
};
