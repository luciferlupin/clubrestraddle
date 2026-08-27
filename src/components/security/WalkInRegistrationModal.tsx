import React, { useState } from 'react';
import { UserPlus, ShieldCheck, User, Phone, FileText, Sparkles, CreditCard, BadgeCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import confetti from 'canvas-confetti';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';

interface WalkInRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (player: Player, checkIn: DailyCheckIn) => void;
}

export const WalkInRegistrationModal: React.FC<WalkInRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerNewPlayer, reviewKYC, approvePlayerEntry } = useClub();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarPhotoUrl, setAadhaarPhotoUrl] = useState('');
  const [aadhaarBackPhotoUrl, setAadhaarBackPhotoUrl] = useState('');
  const [panPhotoUrl, setPanPhotoUrl] = useState('');
  const [address, setAddress] = useState('Delhi NCR, India');
  const [autoApprove, setAutoApprove] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAutofill = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFullName('Harsh Vardhan');
    setPhone(`+91 98${Math.floor(10 + Math.random() * 89)} ${randomNum}`);
    setEmail(`harsh.vardhan.${randomNum}@gmail.com`);
    setAadhaarNumber(`5432 9876 ${randomNum}`);
    setPanNumber(`BKPPS${randomNum}R`);
    setAddress('Sector 104, Noida, Uttar Pradesh - 201304');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!phone.trim()) errs.phone = 'Mobile Number is required.';

    const rawAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (rawAadhaar && rawAadhaar.length !== 12) {
      errs.aadhaarNumber = 'Aadhaar must be 12 digits (or leave empty).';
    }

    const cleanPan = panNumber.trim().toUpperCase();
    if (cleanPan && cleanPan.length !== 10) {
      errs.panNumber = 'PAN must be 10 characters (or leave empty).';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    try {
      const cleanAadhaar = aadhaarNumber.trim();
      const hasId = cleanAadhaar || cleanPan;
      const combinedGovtId = (cleanPan && cleanAadhaar)
        ? `PAN: ${cleanPan} | Aadhaar: ${cleanAadhaar}`
        : (cleanPan ? `PAN: ${cleanPan}` : (cleanAadhaar ? `Aadhaar: ${cleanAadhaar}` : 'Walk-in Check-in'));

      const result = registerNewPlayer(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || `member.${Date.now().toString().slice(-4)}@club-restraddle.com`,
          aadhaarNumber: cleanAadhaar || undefined,
          panNumber: cleanPan || undefined,
          aadhaarPhotoUrl: aadhaarPhotoUrl || undefined,
          aadhaarBackPhotoUrl: aadhaarBackPhotoUrl || undefined,
          panPhotoUrl: panPhotoUrl || undefined,
          govtIdType: hasId ? 'Aadhaar & PAN Card' : 'Walk-in Guest',
          govtIdNumber: combinedGovtId,
          address: address.trim() || 'Delhi NCR, India',
          emergencyContactName: '',
          emergencyContactPhone: '',
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          agreedToRules: true,
        }
      );

      if (autoApprove) {
        reviewKYC(result.player.id, 'verified');
        approvePlayerEntry(result.checkIn.id);
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#fb7185', '#be123c'],
        });
      } catch {
        // Fallback
      }

      onSuccess(result.player, result.checkIn);
      onClose();
    } catch (err) {
      console.error('Walk-in registration error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Walk-in Member Quick Registration"
      subtitle="Security Checkpoint 1-Hand Rapid Onboarding with Aadhaar & PAN"
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAutofill}
            style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Sparkles size={13} color="#f43f5e" />
            <span>Fill Demo Walk-in</span>
          </button>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="#f43f5e" /> Member Full Name *
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Aditya Sharma"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
          {errors.fullName && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={14} color="#f43f5e" /> Mobile Phone *
          </label>
          <input
            type="tel"
            className="form-input"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          {errors.phone && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.phone}</span>}
        </div>

        {/* Two ID Proofs Grid (Aadhaar + PAN) - Optional for rapid walk-in */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} color="#f43f5e" /> 1. Aadhaar Number <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="12 digits (optional for walk-in)"
              value={aadhaarNumber}
              maxLength={14}
              onChange={e => setAadhaarNumber(e.target.value)}
            />
            {errors.aadhaarNumber && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.aadhaarNumber}</span>}
            <DocumentPhotoUpload
              id="walkin-aadhaar-doc"
              label="Aadhaar Card (Front)"
              subLabel="Optional photo from camera/gallery"
              value={aadhaarPhotoUrl}
              onChange={(url) => setAadhaarPhotoUrl(url || '')}
            />
            <DocumentPhotoUpload
              id="walkin-aadhaar-back-doc"
              label="Aadhaar Card (Back)"
              subLabel="Optional back photo"
              value={aadhaarBackPhotoUrl}
              onChange={(url) => setAadhaarBackPhotoUrl(url || '')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BadgeCheck size={14} color="#f43f5e" /> 2. PAN Card <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="10 chars (e.g. ABCDE1234F)"
              value={panNumber}
              maxLength={10}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
              onChange={e => setPanNumber(e.target.value.toUpperCase())}
            />
            {errors.panNumber && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.panNumber}</span>}
            <DocumentPhotoUpload
              id="walkin-pan-doc"
              label="PAN Card"
              subLabel="Optional photo from camera/gallery"
              value={panPhotoUrl}
              onChange={(url) => setPanPhotoUrl(url || '')}
            />
          </div>
        </div>

        {/* Auto-verify switch */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#6ee7b7' }}>
              Instant KYC & Door Entry Clearance
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              Clear player immediately, or uncheck to review manually in entrance queue
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={e => setAutoApprove(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ marginTop: '6px' }}
        >
          <ShieldCheck size={18} />
          <span>{submitting ? 'Registering...' : 'Complete Walk-in Registration'}</span>
        </button>
      </form>
    </Modal>
  );
};
