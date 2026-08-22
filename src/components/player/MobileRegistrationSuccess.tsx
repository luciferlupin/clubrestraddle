import React from 'react';
import { ArrowRight, Check, CheckCircle2, Clock3, QrCode, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly } from '../../utils/formatters';

interface MobileRegistrationSuccessProps {
  player: Player;
  checkIn: DailyCheckIn;
  onContinue: () => void;
}

export const MobileRegistrationSuccess: React.FC<MobileRegistrationSuccessProps> = ({
  player,
  checkIn,
  onContinue,
}) => {
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?portal=security&scan=${checkIn.id}&player=${player.id}`
    : `https://clubrestraddle.vercel.app/?portal=security&scan=${checkIn.id}&player=${player.id}`;

  return (
    <section className="registration-success-screen" aria-labelledby="registration-success-title">
      <header className="registration-success-heading">
        <span className="registration-success-icon" aria-hidden="true"><CheckCircle2 size={32} /></span>
        <span className="mobile-flow-eyebrow">Registration complete</span>
        <h1 id="registration-success-title">Your player pass is ready</h1>
        <p>Welcome, <strong>{player.fullName}</strong>. You are checked in and ready for door verification.</p>
      </header>

      <div className="registration-pass-card">
        <div className="registration-pass-topline">
          <span><QrCode size={17} /> Door clearance pass</span>
          <span>Awaiting scan</span>
        </div>
        <div className="registration-pass-qr">
          <QRCodeSVG value={verificationUrl} size={190} bgColor="#ffffff" fgColor="#0f172a" level="H" />
        </div>
        <div className="registration-pass-identity">
          <div>
            <strong>{player.fullName}</strong>
            <span>{player.id}</span>
          </div>
          <span>{checkIn.tablePreference}</span>
        </div>
      </div>

      <section className="registration-next-steps" aria-labelledby="registration-next-steps-title">
        <h2 id="registration-next-steps-title">What happens next</h2>
        <ol>
          <li>
            <span><ShieldCheck size={18} /></span>
            <div><strong>Show this QR at the entrance</strong><p>The security team will confirm your KYC and age status.</p></div>
          </li>
          <li>
            <span><Clock3 size={18} /></span>
            <div><strong>Wait for door clearance</strong><p>Your player home will show the latest entry status.</p></div>
          </li>
          <li>
            <span><Check size={18} /></span>
            <div>
              <strong>Enjoy your visit</strong>
              <p>You checked in at {formatTimeOnly(checkIn.checkInTime)} for {checkIn.tablePreference}.</p>
            </div>
          </li>
        </ol>
      </section>

      <button type="button" className="m-btn m-btn-primary registration-success-cta" onClick={onContinue}>
        Open my player home <ArrowRight size={18} />
      </button>
    </section>
  );
};
