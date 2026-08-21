import React, { useState } from 'react';
import { UserPlus, ShieldCheck, User, Phone, FileText, Sparkles, CreditCard, BadgeCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import confetti from 'canvas-confetti';

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
  const [address, setAddress] = useState('Delhi NCR, India');
  const [tablePreference, setTablePreference] = useState('NLH Cash Game (₹250/₹500)');
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
    setAddress('DLF Cyber City, Gurugram, Haryana - 122002');
    setTablePreference('NLH Cash Game (₹250/₹500)');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!phone.trim()) errs.phone = 'Mobile Number is required.';

    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (!cleanAadhaar) {
      errs.aadhaarNumber = 'Aadhaar Card number is required.';
    } else if (cleanAadhaar.length !== 12) {
      errs.aadhaarNumber = 'Aadhaar must be 12 digits.';
    }

    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan) {
      errs.panNumber = 'PAN Card number is required.';
    } else if (cleanPan.length !== 10) {
      errs.panNumber = 'PAN must be 10 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    try {
      const result = registerNewPlayer(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || `member.${Date.now().toString().slice(-4)}@club-restraddle.com`,
          aadhaarNumber: aadhaarNumber.trim(),
          panNumber: cleanPan,
          govtIdType: 'Aadhaar & PAN Card',
          govtIdNumber: `PAN: ${cleanPan} | Aadhaar: ${aadhaarNumber.trim()}`,
          address: address.trim() || 'Delhi NCR, India',
          emergencyContactName: '',
          emergencyContactPhone: '',
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          agreedToRules: true,
        },
        tablePreference
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

        {/* Two ID Proofs Grid (Aadhaar + PAN) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} color="#f43f5e" /> 1. Aadhaar Number *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="12 digits (5432...)"
              value={aadhaarNumber}
              maxLength={14}
              onChange={e => setAadhaarNumber(e.target.value)}
              required
            />
            {errors.aadhaarNumber && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.aadhaarNumber}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BadgeCheck size={14} color="#f43f5e" /> 2. PAN Card *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="ABCDE1234F"
              value={panNumber}
              maxLength={10}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
              onChange={e => setPanNumber(e.target.value.toUpperCase())}
              required
            />
            {errors.panNumber && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.panNumber}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Table / Game Preference</label>
          <select
            className="form-select"
            value={tablePreference}
            onChange={e => setTablePreference(e.target.value)}
          >
            <option value="NLH Cash Game (₹250/₹500)">NLH Cash Game (₹250/₹500)</option>
            <option value="PLO-5 High Stakes (₹500/₹1000)">PLO-5 High Stakes (₹500/₹1000)</option>
            <option value="Re Straddle High Roller Championship">Re Straddle High Roller Championship</option>
            <option value="Open Seating / Reception Float">Open Seating / Reception Float</option>
          </select>
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
              Directly verify Aadhaar & PAN and clear player for gaming floor
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
