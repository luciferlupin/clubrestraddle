import React, { useState, useId } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  FileText,
  Spade,
  Download,
} from 'lucide-react';
import { PaymentMethod } from '../../types';
import { formatDateOnly, formatTimeOnly, numberToINRWords, maskGovtId } from '../../utils/formatters';
import { printThermalSlip } from '../../utils/printThermal';

export interface ClubInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  category?: string;
  
  // Member / Player
  playerId?: string;
  playerName: string;
  playerPhone?: string;
  playerEmail?: string;
  govtIdType?: string;
  govtIdNumber?: string;
  membershipTier?: string;
  
  // Event / Tournament particulars
  eventName?: string;
  eventDate?: string;
  eventDetails?: string;
  tournamentName?: string;
  tableLocation?: string;
  seatNumber?: string;
  
  // Nature of Supply
  natureOfSupply?: string;
  sacCode?: string;
  
  // Financials & GST
  taxableAmount?: number;
  serviceCharge?: number;
  subtotal?: number;
  rakeOrFee?: number;
  totalAmount: number;
  gstRate?: number;
  cgstRate?: number;
  sgstRate?: number;
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  
  // Settlement
  paymentMethod: PaymentMethod | string;
  paymentReference?: string;
  cashierName: string;
  placeOfSupply?: string;
  
  // Entity Branding
  clubName?: string;
  companyName?: string;
  companyAddress?: string;
  gstin?: string;
  contactPhone?: string;
  website?: string;
  copyType?: 'PLAYER COPY' | 'CASHIER COPY';
  
  items?: Array<{
    description: string;
    details?: string;
    chips?: number;
    amount: number;
  }>;
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
  const [copied, setCopied] = useState(false);
  const [activeCopy, setActiveCopy] = useState<'PLAYER COPY' | 'CASHIER COPY'>('PLAYER COPY');
  const titleId = useId();

  if (!isOpen || !invoice) return null;

  // Determine GST Rate: 5% strictly for Door/Gate Entry fees only, and 18% for tournaments and club services
  const isTournament =
    Boolean(
      invoice.category?.toLowerCase().includes('tournament') ||
      invoice.invoiceNumber?.includes('TRN') ||
      invoice.eventName?.toLowerCase().includes('tournament') ||
      invoice.tournamentName
    );

  const isEntryFee =
    !isTournament &&
    Boolean(
      invoice.category?.toLowerCase().includes('door') ||
      invoice.category?.toLowerCase().includes('gate') ||
      invoice.category?.toLowerCase().includes('daily entry') ||
      invoice.category?.toLowerCase().includes('lounge access') ||
      invoice.invoiceNumber?.includes('GATE') ||
      invoice.invoiceNumber?.includes('ENT')
    );

  const gstRate = invoice.gstRate ?? (isEntryFee ? 5 : 18);
  const halfGstRate = invoice.cgstRate ?? Number((gstRate / 2).toFixed(1));

  const totalVal = Number(invoice.totalAmount) || 0;
  
  // Taxable Service Charge = Total / (1 + gstRate / 100) (e.g. Total / 1.05 for 5% GST = 476.19)
  const taxableServiceCharge = invoice.taxableAmount ?? Number((totalVal / (1 + gstRate / 100)).toFixed(2));
  const totalGst = invoice.gstAmount ?? Number((totalVal - taxableServiceCharge).toFixed(2));
  const cgst = invoice.cgstAmount ?? Number((totalGst / 2).toFixed(2));
  const sgst = invoice.sgstAmount ?? Number((totalGst - cgst).toFixed(2));

  // Dates & Times
  const dateFormatted = invoice.invoiceDate ? formatDateOnly(invoice.invoiceDate) : '11 Jul 2026';
  const timeFormatted = invoice.invoiceDate ? formatTimeOnly(invoice.invoiceDate) : '12:31:04';

  // Event description
  const eventTitle = invoice.eventName || invoice.tournamentName || invoice.items?.[0]?.description || (isEntryFee ? 'Club Door Entry & Facility Access' : 'MTT - 6,66,666 - Texas Holdem - 11th July');
  const eventDetail1 = invoice.eventDate || `Gate Check-in • ${dateFormatted} • ${timeFormatted}`;
  const eventDetail2 = invoice.eventDetails || (isEntryFee ? 'Daily door clearance (₹500 inclusive of 5% Service Charge)' : `Texas • MTC • Table ${invoice.tableLocation || 'Main Floor'} • Prize ₹${totalVal.toLocaleString('en-IN')}`);

  const handlePrint = () => {
    printThermalSlip('printable-tax-invoice', `Tax-Invoice-${invoice.invoiceNumber || 'Bill'}`);
  };

  const handleCopySummary = () => {
    const summary = `CLUB RE STRADDLE • OFFICIAL RECEIPT & INVOICE
Invoice No: ${invoice.invoiceNumber}
Date: ${dateFormatted} ${timeFormatted}
Cashier / Desk: ${invoice.cashierName}
Player: ${invoice.playerName} (ID: ${invoice.playerId || 'Not assigned'})
Venue: JB Complex, Sector 104, Noida, Uttar Pradesh - 201304
Event / Item: ${eventTitle}
Taxable Service Charge: ₹${taxableServiceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Service Charge @ ${gstRate}%: ₹${totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total Amount: ₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Payment Mode: ${invoice.paymentMethod}
Place of Supply: 09 - Uttar Pradesh (Noida)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="club-invoice-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
          maxWidth: '460px',
          maxHeight: '94vh',
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
        {/* Top Control Bar (Screen only, hidden on print) */}
        <div
          className="no-print"
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #19070a 0%, #0d0305 100%)',
            borderBottom: '1px solid rgba(225, 29, 72, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="#e11d48" />
            <span id={titleId} style={{ fontWeight: 800, fontSize: '0.86rem', color: '#ffffff' }}>
              Tax Invoice • {invoice.invoiceNumber}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Copy Type Toggle */}
            <div style={{ display: 'flex', background: '#200910', borderRadius: '6px', padding: '2px', border: '1px solid rgba(225,29,72,0.3)' }}>
              <button
                type="button"
                onClick={() => setActiveCopy('PLAYER COPY')}
                style={{
                  padding: '3px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: '4px',
                  border: 'none',
                  background: activeCopy === 'PLAYER COPY' ? '#e11d48' : 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Player
              </button>
              <button
                type="button"
                onClick={() => setActiveCopy('CASHIER COPY')}
                style={{
                  padding: '3px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: '4px',
                  border: 'none',
                  background: activeCopy === 'CASHIER COPY' ? '#e11d48' : 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Cashier
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopySummary}
              style={{ fontSize: '0.74rem', padding: '4px 8px' }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ color: '#94a3b8' }}
              aria-label="Close invoice"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Sheet (Faithfully structured like the physical POS Tax Invoice) */}
        <div
          id="printable-tax-invoice"
          className="thermal-receipt-paper"
          style={{
            overflowY: 'auto',
            padding: '16px 14px 28px 14px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace',
            fontSize: '10.5px',
            lineHeight: 1.3,
            boxSizing: 'border-box',
          }}
        >
          {/* Top Logo & Organization Branding */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <img
              src="/logo.png"
              alt="Club Re Straddle Logo"
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                margin: '0 auto 4px',
                display: 'block',
              }}
            />
            
            <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000000' }}>
              CLUB RE STRADDLE
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '2px', color: '#111827' }}>
              Club Re Straddle Poker Lounge & Entertainment
            </div>
            <div style={{ fontSize: '8.5px', color: '#374151', marginTop: '1px' }}>
              JB Complex, Sector 104, Noida, Uttar Pradesh - 201304
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#1f2937', marginTop: '1px' }}>
              GSTIN: 09AAWFN3832H1ZP
            </div>
          </div>

          {/* Double-border TAX INVOICE Header Box */}
          <div
            style={{
              borderTop: '1.5px solid #000000',
              borderBottom: '1.5px solid #000000',
              padding: '3px 0',
              textAlign: 'center',
              fontWeight: 900,
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: '6px 0 8px 0',
            }}
          >
            TAX INVOICE
          </div>

          {/* Invoice Metadata Grid */}
          <div style={{ marginBottom: '7px', fontSize: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>Invoice No.</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.01em', textAlign: 'right', wordBreak: 'break-all' }}>{invoice.invoiceNumber || 'CRS/GA/26-27/0001'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>Date</span>
              <span style={{ fontWeight: 700, textAlign: 'right' }}>{dateFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>Time</span>
              <span style={{ fontWeight: 700, textAlign: 'right' }}>{timeFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>Cashier</span>
              <span style={{ fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{invoice.cashierName || 'Cashier Counter'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>Place of Supply</span>
              <span style={{ fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{invoice.placeOfSupply ? invoice.placeOfSupply.split(' ')[0] : '09'}</span>
            </div>
          </div>

          {/* PLAYER Section */}
          <div style={{ borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '7px', fontSize: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '2px', textTransform: 'uppercase' }}>
              PLAYER
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>Player ID</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', textAlign: 'right' }}>{invoice.playerId || '2880'}</span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <div style={{ fontWeight: 600, fontSize: '9px' }}>Name</div>
              <div style={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', wordBreak: 'break-word' }}>
                {invoice.playerName}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>ID Proof</span>
              <span style={{ fontWeight: 800, textAlign: 'right' }}>{invoice.govtIdType?.toUpperCase().includes('AADHAAR') ? 'AADHAAR' : 'PAN'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>ID Number</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', textAlign: 'right' }}>{invoice.govtIdNumber || 'AHCPD1875B'}</span>
            </div>
          </div>

          {/* EVENT Box */}
          <div style={{ marginBottom: '7px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '2px', textTransform: 'uppercase' }}>
              EVENT
            </div>
            <div
              style={{
                border: '1px solid #000000',
                padding: '5px 7px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: '10.5px', lineHeight: 1.25, wordBreak: 'break-word' }}>
                {eventTitle}
              </div>
              <div style={{ fontSize: '8.5px', marginTop: '2px', color: '#000000', wordBreak: 'break-word' }}>
                {eventDetail1}
              </div>
              {eventDetail2 && (
                <div style={{ fontSize: '8.5px', marginTop: '1px', color: '#000000', wordBreak: 'break-word' }}>
                  {eventDetail2}
                </div>
              )}
            </div>
          </div>

          {/* NATURE OF SUPPLY Box */}
          <div style={{ marginBottom: '7px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '2px', textTransform: 'uppercase' }}>
              NATURE OF SUPPLY
            </div>
            <div
              style={{
                border: '1px solid #000000',
                padding: '5px 7px',
                fontSize: '8px',
                lineHeight: 1.25,
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ color: '#000000', wordBreak: 'break-word' }}>
                {isEntryFee
                  ? 'Right of admission and lounge access to the club premises for skill-based recreational gaming, refreshments, and facility amenities.'
                  : (invoice.natureOfSupply || 'Right to participate in the above-named skill-based poker tournament, by way of entry fee. This fee grants participation rights only and is entirely de-linked from the prize pool. Prize pool is fixed and pre-determined independently of entry fee collections.')}
              </div>
              <div style={{ marginTop: '3px', fontWeight: 800, fontFamily: 'monospace' }}>
                SAC : {invoice.sacCode || '999691'}
              </div>
            </div>
          </div>

          {/* AMOUNT & Service Charge Breakdown */}
          <div style={{ borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '7px', fontSize: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '3px', textTransform: 'uppercase' }}>
              AMOUNT
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ flexShrink: 0 }}>Entry Fee (Taxable)</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{taxableServiceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ flexShrink: 0 }}>GST @ {gstRate}%</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ flexShrink: 0 }}>CGST @ {halfGstRate}%</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
              <span style={{ flexShrink: 0 }}>SGST @ {halfGstRate}%</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Solid Total Line */}
            <div style={{ borderTop: '1.5px solid #000000', marginTop: '4px', paddingTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', fontSize: '12px', fontWeight: 900 }}>
              <span style={{ flexShrink: 0 }}>TOTAL (₹)</span>
              <span style={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', textAlign: 'right' }}>{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ fontSize: '8.5px', fontStyle: 'italic', marginTop: '2px', lineHeight: 1.2, color: '#000000', wordBreak: 'break-word' }}>
              In words: {numberToINRWords(totalVal)}
            </div>
          </div>

          {/* PAYMENT Details Section */}
          <div style={{ borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '7px', fontSize: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '2px', textTransform: 'uppercase' }}>
              PAYMENT
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', fontSize: '11px', fontWeight: 900, marginBottom: '2px' }}>
              <span style={{ flexShrink: 0 }}>Mode</span>
              <span style={{ textAlign: 'right' }}>{invoice.paymentMethod || 'Cash'}</span>
            </div>
            {invoice.paymentReference && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', fontSize: '9.5px' }}>
                <span style={{ flexShrink: 0 }}>Ref / UTR</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', wordBreak: 'break-all' }}>{invoice.paymentReference}</span>
              </div>
            )}
          </div>

          {/* Statutory Terms & Conditions (Faithful reproduction of photo) */}
          <div style={{ fontSize: '7.2px', lineHeight: 1.22, color: '#000000', borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '8px', boxSizing: 'border-box' }}>
            <p style={{ marginBottom: '3px' }}>
              Entry fee is non-refundable once registration is confirmed. Players must be 18 years or older and carry valid government-issued photo ID at all times.
            </p>
            <p style={{ marginBottom: '3px' }}>
              This invoice is for the right to participate only. The prize pool is fixed and pre-determined and bears no relation to entry fees collected. Participation is governed by Club Re Straddle Tournament Rules displayed at the venue.
            </p>
            <p style={{ marginBottom: '3px' }}>
              TDS under Section 194BA of the Income Tax Act applies on net winnings at the time of cash-out. PAN is mandatory for prize collection above ₹10,000.
            </p>
            <p style={{ marginBottom: '4px' }}>
              This is a computer-generated tax invoice and is valid without a physical signature.
            </p>
            <div style={{ textAlign: 'center', borderTop: '1px solid #000000', paddingTop: '4px', marginTop: '4px', fontWeight: 700 }}>
              <div>Club Re Straddle — Play Responsibly.</div>
              <div style={{ fontSize: '7px' }}>www.clubrestraddle.com | +91 99589 49859</div>
            </div>
          </div>

          {/* Boxed Stamp */}
          <div
            style={{
              border: '1.5px solid #000000',
              padding: '3px 0',
              textAlign: 'center',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {activeCopy}
          </div>
        </div>
      </div>
    </div>
  );
};
