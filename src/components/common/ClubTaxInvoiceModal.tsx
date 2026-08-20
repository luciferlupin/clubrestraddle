import React from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Spade,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentMethod } from '../../types';
import { formatDateTime, formatINR, maskGovtId, numberToINRWords } from '../../utils/formatters';

export interface ClubInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  category: 'Table Chip Purchase' | 'Tournament Entry & Rake' | 'Cash Game Float' | 'Membership Settlement';
  
  // Member details
  playerId?: string;
  playerName: string;
  playerPhone?: string;
  playerEmail?: string;
  govtIdType?: string;
  govtIdNumber?: string;
  membershipTier?: string;
  tableLocation?: string;
  
  // Items
  items: Array<{
    description: string;
    details?: string;
    chips?: number;
    amount: number;
  }>;
  
  subtotal: number;
  rakeOrFee?: number;
  totalAmount: number;
  
  // Settlement details
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  cashierName: string;
  securityOfficerName?: string;
  notes?: string;
}

interface ClubTaxInvoiceModalProps {
  invoice: ClubInvoiceData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClubTaxInvoiceModal: React.FC<ClubTaxInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const titleId = React.useId();

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `CLUB RE STRADDLE • OFFICIAL BILLING INVOICE
Invoice No: ${invoice.invoiceNumber}
Date: ${formatDateTime(invoice.invoiceDate)}
Billed To: ${invoice.playerName} (${invoice.playerId || 'Member'})
Table/Seat: ${invoice.tableLocation || 'Main Floor'}
Category: ${invoice.category}
Amount Settled: ₹${formatINR(invoice.totalAmount)} (${numberToINRWords(invoice.totalAmount)})
Payment Mode: ${invoice.paymentMethod} (Physical Settlement)
Cashier Officer: ${invoice.cashierName}
Club GSTIN: 07AAACL1234F1Z8`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const qrVerificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/staff?invoice=${invoice.invoiceNumber}`
    : `https://clubrestraddle.vercel.app/staff?invoice=${invoice.invoiceNumber}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="club-invoice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c0406',
          borderRadius: '16px',
          border: '1.5px solid #e11d48',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(225, 29, 72, 0.25)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar (Non-Printable) */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #19070a 0%, #0d0305 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#e11d48" />
            <span id={titleId} style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
              Official Tax & Billing Invoice • {invoice.invoiceNumber}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopySummary}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ color: '#94a3b8' }}
              aria-label="Close invoice"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet Content */}
        <div
          id="printable-tax-invoice"
          style={{
            overflowY: 'auto',
            padding: '28px 32px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Club Header & Letterhead */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e11d48', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spade size={22} color="#e11d48" fill="#e11d48" aria-hidden="true" />
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', margin: 0, color: '#0f172a', textTransform: 'uppercase' }}>
                  Club Re Straddle
                </h1>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e11d48', marginTop: '2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Premium Poker Club & High Roller Gaming Lounge
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                Level 4, Luxury Wing, DLF Cyber City, Phase 2, Gurugram, Haryana - 122002<br />
                Club Owners: <strong>Shivam Gupta & Rajbeer Gupta</strong> • GSTIN / Reg: <strong>07AAACL1234F1Z8</strong><br />
                Desk Contact: +91 98102 34891 • Email: billing@restraddle.club
              </div>
            </div>

            {/* Right: Invoice Type Stamp & Badge */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                TAX / BILLING INVOICE
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#e11d48', marginTop: '6px', fontFamily: 'monospace' }}>
                {invoice.invoiceNumber}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Date: {formatDateTime(invoice.invoiceDate)}
              </div>
            </div>
          </div>

          {/* Bill To & Cashier Station Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Billed To (Member Details)
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {invoice.playerName}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                Member ID: <strong>{invoice.playerId || 'Registered Guest'}</strong>
                {invoice.membershipTier && ` • ${invoice.membershipTier} Tier`}
              </div>
              {invoice.playerPhone && (
                <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                  Mobile: {invoice.playerPhone}
                </div>
              )}
              {invoice.govtIdType && invoice.govtIdNumber && (
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Verified KYC: {invoice.govtIdType} ({maskGovtId(invoice.govtIdNumber)})
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Gaming Floor & Cashier Station
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                Table / Station: <strong style={{ color: '#e11d48' }}>{invoice.tableLocation || 'Main Cashier Desk'}</strong>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                Cashier Officer: <strong>{invoice.cashierName}</strong>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                Settlement Status: <strong style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={13} /> Settled & Verified</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>Description & Particulars</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Playing Chips</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.description}</div>
                    {item.details && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.details}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                    {item.chips ? formatINR(item.chips) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ₹{formatINR(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Totals & Amount in Words */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', borderTop: '2px solid #e2e8f0', paddingTop: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                Amount in Words
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', fontStyle: 'italic', marginTop: '2px' }}>
                {numberToINRWords(invoice.totalAmount)}
              </div>

              {/* Marked Payment Mode Box */}
              <div style={{ marginTop: '12px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Marked Payment Settlement Mode:
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {invoice.paymentMethod} {invoice.paymentReference ? `(Ref: ${invoice.paymentReference})` : ''}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                  Settled physically at club cash desk / floor. No payment processed through software.
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700 }}>₹{formatINR(invoice.subtotal)}</span>
              </div>

              {invoice.rakeOrFee !== undefined && invoice.rakeOrFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>House Rake & Entry Fee:</span>
                  <span style={{ fontWeight: 700 }}>₹{formatINR(invoice.rakeOrFee)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid #0f172a',
                  paddingTop: '8px',
                  marginTop: '4px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  color: '#e11d48',
                }}
              >
                <span>TOTAL SETTLED:</span>
                <span>₹{formatINR(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* QR Verification & Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '4px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <QRCodeSVG value={qrVerificationUrl} size={64} fgColor="#0f172a" />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>
                <strong>SCAN TO VERIFY INVOICE</strong><br />
                Club Verification Code: {invoice.invoiceNumber}<br />
                Authorized by: {invoice.cashierName}
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e11d48', fontFamily: 'cursive' }}>
                {invoice.cashierName}
              </div>
              <div style={{ borderTop: '1px solid #0f172a', marginTop: '4px', paddingTop: '2px', fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Authorized Cashier Desk
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div style={{ textAlign: 'center', fontSize: '0.64rem', color: '#94a3b8', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            Club Re Straddle is a private members club. This official invoice confirms receipt of physical payment for club tournament entry / table chips. Chips remain property of Club Re Straddle.
          </div>
        </div>
      </div>
    </div>
  );
};
