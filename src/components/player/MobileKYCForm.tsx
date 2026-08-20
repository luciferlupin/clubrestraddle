import React, { useState } from 'react';
import { UserPlus, Sparkles, ShieldCheck, ArrowLeft, FileText, Lock } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { GovtIdType, Player, DailyCheckIn } from '../../types';
import confetti from 'canvas-confetti';

interface MobileKYCFormProps {
  onSuccess: (result: { player: Player; checkIn: DailyCheckIn }) => void;
  onCancel?: () => void;
}

export const MobileKYCForm: React.FC<MobileKYCFormProps> = ({ onSuccess, onCancel }) => {
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

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
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
      address: '1420 Luxury Strip Blvd, Las Vegas, NV',
      emergencyContactName: 'Rachel Wright',
      emergencyContactPhone: '+1 (555) 998-1234',
      photoUrl: sampleAvatars[0],
      agreedToRules: true,
      tablePreference: 'Re Straddle High Roller Tournament',
    });
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email required';
    if (!formData.dateOfBirth) {
      errs.dateOfBirth = 'Date of birth required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const diff = Date.now() - dob.getTime();
      const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      if (isNaN(age) || age < 21) {
        errs.dateOfBirth = `Must be 21+ years old (Age: ${age || 0})`;
      }
    }
    if (!formData.govtIdNumber.trim()) errs.govtIdNumber = 'Govt ID # required';
    if (!formData.agreedToRules) errs.agreedToRules = 'Must agree to poker rules & declaration';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
          address: formData.address || 'Las Vegas, NV',
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
      onSuccess(result);
    }, 300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header Card */}
      <div className="m-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="m-card-title">
              <UserPlus size={20} color="#ffffff" />
              New Member KYC
            </h2>
            <p className="m-card-subtitle">Required for first-time poker club entry</p>
          </div>
          <button
            type="button"
            className="m-btn m-btn-secondary m-btn-sm"
            onClick={handleAutofill}
            style={{ width: 'auto' }}
          >
            <Sparkles size={14} color="#ffffff" /> Auto-fill
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Section: Personal Info */}
        <div className="m-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Personal Details
          </span>

          <div className="m-form-group">
            <label className="m-form-label">Full Legal Name *</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Vikram Malhotra"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            />
            {errors.fullName && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{errors.fullName}</span>}
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Mobile Phone Number *</label>
            <input
              type="tel"
              className="m-input"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
            {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{errors.phone}</span>}
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Email Address *</label>
            <input
              type="email"
              className="m-input"
              placeholder="name@domain.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{errors.email}</span>}
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Date of Birth (21+ required) *</label>
            <input
              type="date"
              className="m-input"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
            {errors.dateOfBirth && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{errors.dateOfBirth}</span>}
          </div>
        </div>

        {/* Section: Government ID */}
        <div className="m-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            2. Government ID
          </span>

          <div className="m-form-group">
            <label className="m-form-label">ID Document Type *</label>
            <select
              className="m-select"
              value={formData.govtIdType}
              onChange={e => setFormData({ ...formData, govtIdType: e.target.value as GovtIdType })}
            >
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="National ID">National ID</option>
              <option value="State ID">State ID</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Govt ID Number *</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. P99218392"
              value={formData.govtIdNumber}
              onChange={e => setFormData({ ...formData, govtIdNumber: e.target.value })}
            />
            {errors.govtIdNumber && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{errors.govtIdNumber}</span>}
          </div>

          {/* Avatar selector */}
          <div className="m-form-group">
            <label className="m-form-label">Profile Avatar</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <img
                src={formData.photoUrl}
                alt=""
                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--gold-light)', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1 }}>
                {sampleAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt=""
                    onClick={() => setFormData({ ...formData, photoUrl: url })}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: formData.photoUrl === url ? '2px solid #e11d48' : '1px solid var(--border-subtle)',
                      opacity: formData.photoUrl === url ? 1 : 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Game Preference & Rules */}
        <div className="m-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            3. Game Preference & Declaration
          </span>

          <div className="m-form-group">
            <label className="m-form-label">Preferred Table Today</label>
            <select
              className="m-select"
              value={formData.tablePreference}
              onChange={e => setFormData({ ...formData, tablePreference: e.target.value })}
            >
              <option value="NLH Cash Game (₹100/₹200)">No-Limit Holdem (₹100/₹200 Cash)</option>
              <option value="NLH Cash Game (₹250/₹500)">No-Limit Holdem (₹250/₹500 Cash)</option>
              <option value="High Stakes NLH (₹500/₹1000+)">High Stakes NLH (₹500/₹1000+)</option>
              <option value="♠ Re Straddle High Roller Championship">♠ Re Straddle High Roller Championship</option>
              <option value="Pot-Limit Omaha (PLO ₹250/₹500)">Pot-Limit Omaha (PLO ₹250/₹500)</option>
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '10px',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            <input
              type="checkbox"
              style={{ marginTop: '2px', accentColor: '#e11d48', width: '18px', height: '18px' }}
              checked={formData.agreedToRules}
              onChange={e => setFormData({ ...formData, agreedToRules: e.target.checked })}
            />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.35 }}>
              I certify I am 21+ years old, provided accurate government ID, and agree to Club Re Straddle house poker rules.
            </span>
          </label>
          {errors.agreedToRules && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{errors.agreedToRules}</span>}
        </div>

        {/* Submit Touch Button */}
        <button type="submit" className="m-btn m-btn-primary" disabled={submitting}>
          <ShieldCheck size={18} />
          {submitting ? 'Submitting KYC...' : 'Submit KYC & Complete Check-In'}
        </button>

        {onCancel && (
          <button type="button" className="m-btn m-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};
