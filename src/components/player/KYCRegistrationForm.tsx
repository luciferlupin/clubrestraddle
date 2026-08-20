import React, { useState } from 'react';
import { ShieldCheck, UserPlus, CheckCircle, Sparkles, AlertCircle, FileText, Lock } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { GovtIdType } from '../../types';
import confetti from 'canvas-confetti';

interface KYCRegistrationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const KYCRegistrationForm: React.FC<KYCRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { registerNewPlayer } = useClub();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    govtIdType: 'Passport' as GovtIdType,
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

  const samplePhotos = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  ];

  const handleAutofill = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    setFormData({
      fullName: 'Alexander Wright',
      phone: `+1 (555) 7${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 9000)}`,
      email: `alex.wright.${randomId}@clubpoker.com`,
      dateOfBirth: '1991-08-14',
      govtIdType: 'Passport',
      govtIdNumber: `P${randomId}`,
      address: '1420 Luxury Strip Blvd, Penthouse 18, Las Vegas, NV',
      emergencyContactName: 'Rachel Wright',
      emergencyContactPhone: '+1 (555) 998-1234',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      agreedToRules: true,
      tablePreference: 'High Roller Tournament',
    });
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
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
    if (!formData.govtIdNumber.trim()) errs.govtIdNumber = 'Govt ID Number is required';
    if (!formData.address.trim()) errs.address = 'Residential address is required';
    if (!formData.agreedToRules) errs.agreedToRules = 'You must agree to club rules & KYC declaration';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      registerNewPlayer(
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
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
        });
      } catch {
        // Fallback
      }

      setSubmitting(false);
      onSuccess();
    }, 400);
  };

  return (
    <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <UserPlus size={20} color="#ffffff" />
            New Player KYC Registration
          </h2>
          <p className="card-subtitle">
            First-time club entry requirement. Submitting automatically checks you in for today.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAutofill}
          title="Auto-fill sample valid KYC data"
        >
          <Sparkles size={14} color="#ffffff" /> Auto-fill Sample Data
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal Details */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> 1. Personal & Contact Details
          </h4>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Full Name (as on Govt ID) *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vikram Malhotra"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              />
              {errors.fullName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +1 (555) 000-0000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.phone}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@domain.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth (Must be 21+) *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
              {errors.dateOfBirth && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.dateOfBirth}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Street address, City, State, ZIP"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
            {errors.address && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.address}</span>}
          </div>
        </div>

        {/* Section 2: Government ID & Verification */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} /> 2. Government Identity Verification
          </h4>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Government ID Type *</label>
              <select
                className="form-select"
                value={formData.govtIdType}
                onChange={e => setFormData({ ...formData, govtIdType: e.target.value as GovtIdType })}
              >
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="National ID">National ID</option>
                <option value="State ID">State ID</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Govt ID Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. P12345678 or DL-992384"
                value={formData.govtIdNumber}
                onChange={e => setFormData({ ...formData, govtIdNumber: e.target.value })}
              />
              {errors.govtIdNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.govtIdNumber}</span>}
            </div>
          </div>

          {/* Avatar / Selfie Photo Selector */}
          <div className="form-group">
            <label className="form-label">Member Photo / Profile Avatar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <img
                src={formData.photoUrl}
                alt="Selected Avatar"
                style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #ffffff', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

        {/* Section 3: Emergency Contact & Preferences */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> 3. Emergency Contact & Table Preference
          </h4>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Emergency Contact Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Jane Doe (Spouse/Family)"
                value={formData.emergencyContactName}
                onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +1 (555) 111-2222"
                value={formData.emergencyContactPhone}
                onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Today's Game / Table Preference</label>
            <select
              className="form-select"
              value={formData.tablePreference}
              onChange={e => setFormData({ ...formData, tablePreference: e.target.value })}
            >
              <option value="NLH Cash Game (₹100/₹200)">No-Limit Holdem (₹100/₹200)</option>
              <option value="NLH Cash Game (₹250/₹500)">No-Limit Holdem (₹250/₹500)</option>
              <option value="High Stakes NLH (₹500/₹1000+)">High Stakes NLH (₹500/₹1000+)</option>
              <option value="Pot-Limit Omaha (PLO ₹250/₹500)">Pot-Limit Omaha (PLO ₹250/₹500)</option>
              <option value="♠ Re Straddle High Roller Championship">♠ Re Straddle High Roller Championship</option>
              <option value="VIP Private Lounge">VIP Private Lounge</option>
            </select>
          </div>
        </div>

        {/* Section 4: Club Rules Declaration */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ marginTop: '3px', accentColor: '#e11d48', width: '16px', height: '16px' }}
              checked={formData.agreedToRules}
              onChange={e => setFormData({ ...formData, agreedToRules: e.target.checked })}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              I certify that I am at least 21 years of age, the government ID provided is authentic, and I agree to abide by Club Re Straddle house poker rules, zero-tolerance collusion policies, and responsible gaming guidelines.
            </span>
          </label>
          {errors.agreedToRules && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{errors.agreedToRules}</div>}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            <ShieldCheck size={18} />
            {submitting ? 'Submitting KYC...' : 'Submit KYC & Complete Check-in'}
          </button>
        </div>
      </form>
    </div>
  );
};
