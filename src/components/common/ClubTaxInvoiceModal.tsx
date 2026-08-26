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
  const eventDetail2 = invoice.eventDetails || (isEntryFee ? 'Daily door clearance (₹500 inclusive of 5% GST)' : `Texas • MTC • Table ${invoice.tableLocation || 'Main Floor'} • Prize ₹${totalVal.toLocaleString('en-IN')}`);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `CLUB RE STRADDLE • OFFICIAL RECEIPT & INVOICE
Invoice No: ${invoice.invoiceNumber}
Date: ${dateFormatted} ${timeFormatted}
Cashier / Desk: ${invoice.cashierName}
Player: ${invoice.playerName} (ID: ${invoice.playerId || 'Not assigned'})
Venue: JB Complex, Sector 104, Noida, Uttar Pradesh - 201304
Event / Item: ${eventTitle}
Service Charges (Taxable): ₹${taxableServiceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
GST @ ${gstRate}% (CGST ${halfGstRate}% + SGST ${halfGstRate}%): ₹${totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total Amount: ₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Payment Mode: ${invoice.paymentMethod}
Place of Supply: 09 - Uttar Pradesh (Noida)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
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

        {/* Printable Thermal Receipt Sheet (Exact layout as photo) */}
        <div
          id="printable-tax-invoice"
          className="thermal-receipt-paper"
          style={{
            overflowY: 'auto',
            padding: '24px 20px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: '"Courier New", Courier, monospace, monospace',
            fontSize: '12px',
            lineHeight: 1.35,
          }}
        >
          {/* Top Logo & Organization */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <img
              src="/logo.png"
              alt="Club Re Straddle Logo"
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'contain',
                margin: '0 auto 6px',
                display: 'block',
              }}
            />
            
            <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CLUB RE STRADDLE
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 700 }}>
              Club Re Straddle Poker Lounge & Entertainment
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 600 }}>
              JB Complex, Sector 104, Noida, Uttar Pradesh - 201304
            </div>
            <div style={{ fontSize: '9.5px' }}>
              Tel: +91 99589 49859 • Clubrestraddle@gmail.com
            </div>
          </div>

          {/* Double-border TAX INVOICE Box */}
          <div
            style={{
              border: '1.5px solid #000000',
              padding: '4px 0',
              textAlign: 'center',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            OFFICIAL MEMBER BILL & INVOICE
          </div>

          {/* Invoice Metadata Grid */}
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Invoice No.</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{invoice.invoiceNumber || 'CRS/GATE/26-27/0001'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Date</span>
              <span style={{ fontWeight: 700 }}>{dateFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Time</span>
              <span style={{ fontWeight: 700 }}>{timeFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Cashier</span>
              <span style={{ fontWeight: 700 }}>{invoice.cashierName || 'Bharath S'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Place of Supply</span>
              <span style={{ fontWeight: 700 }}>{invoice.placeOfSupply || '09 - Uttar Pradesh (Noida)'}</span>
            </div>
          </div>

          {/* PLAYER Section */}
          <div style={{ borderTop: '1px dashed #000000', paddingTop: '6px', marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '2px' }}>
              PLAYER
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Player ID</span>
              <span style={{ fontWeight: 800 }}>{invoice.playerId || 'Not assigned'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Name</span>
              <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{invoice.playerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>PAN / ID Proof</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{invoice.govtIdNumber ? maskGovtId(invoice.govtIdNumber) : 'PAN Verified'}</span>
            </div>
          </div>

          {/* EVENT Box */}
          <div
            style={{
              border: '1px solid #000000',
              padding: '6px 8px',
              marginBottom: '8px',
              fontSize: '10.5px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 900, textAlign: 'left', marginBottom: '2px' }}>
              EVENT
            </div>
            <div style={{ fontWeight: 800, fontSize: '11px' }}>
              {eventTitle}
            </div>
            <div style={{ fontSize: '9.5px', marginTop: '2px' }}>
              {eventDetail1}
            </div>
            <div style={{ fontSize: '9.5px' }}>
              {eventDetail2}
            </div>
          </div>

          {/* NATURE OF SUPPLY Box */}
          <div
            style={{
              border: '1px solid #000000',
              padding: '6px 8px',
              marginBottom: '10px',
              fontSize: '9.5px',
              lineHeight: 1.25,
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 900, marginBottom: '2px' }}>
              NATURE OF SUPPLY
            </div>
            <div style={{ minHeight: '14px' }}>
              {invoice.natureOfSupply || ''}
            </div>
            <div style={{ marginTop: '4px', fontWeight: 800 }}>
              SAC : {invoice.sacCode || '999691'}
            </div>
          </div>

          {/* AMOUNT & GST Breakdown */}
          <div style={{ borderTop: '1px dashed #000000', paddingTop: '6px', marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '4px' }}>
              AMOUNT
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Service Charges (Taxable)</span>
              <span style={{ fontWeight: 700 }}>{taxableServiceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>GST @ {gstRate}%</span>
              <span style={{ fontWeight: 700 }}>{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontSize: '10.5px' }}>
              <span>CGST @ {halfGstRate}%</span>
              <span>{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontSize: '10.5px' }}>
              <span>SGST @ {halfGstRate}%</span>
              <span>{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div style={{ borderTop: '1.5px solid #000000', marginTop: '6px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 900 }}>
              <span>TOTAL (₹)</span>
              <span>{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ fontSize: '9.5px', fontStyle: 'italic', marginTop: '2px' }}>
              In words: {numberToINRWords(totalVal)}
            </div>
          </div>

          {/* PAYMENT Section */}
          <div style={{ borderTop: '1px dashed #000000', paddingTop: '6px', marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '2px' }}>
              PAYMENT
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900 }}>
              <span>Mode</span>
              <span style={{ textTransform: 'capitalize' }}>{invoice.paymentMethod || 'Cash'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
              <span>Ref / UTR</span>
              <span style={{ fontFamily: 'monospace' }}>{invoice.paymentReference || 'TXN-58192'}</span>
            </div>
          </div>

          {/* Legal Disclaimers (Exact text from thermal bill) */}
          <div
            style={{
              borderTop: '1px solid #000000',
              paddingTop: '6px',
              fontSize: '8.5px',
              lineHeight: 1.25,
              textAlign: 'justify',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginBottom: '10px',
            }}
          >
            {!isEntryFee && (
              <div>
                Tournament entry & service charges are inclusive of 18% GST (SAC 999691). Entry fee is non-refundable once registration is confirmed. Players must be 21 years or older and carry valid government-issued photo ID at all times.
              </div>
            )}
            <div>
              This invoice is for the right to participate only. The prize pool is fixed and pre-determined and bears no relation to entry fees collected. Participation is governed by Club Re Straddle Rules displayed at the venue.
            </div>
            <div>
              TDS under Section 194BA of the Income Tax Act applies on net winnings at the time of cash-out. PAN is mandatory for prize collection above ₹10,000.
            </div>
            <div>
              This is a computer-generated tax invoice and is valid without a physical signature.
            </div>
          </div>

          {/* Footer Responsible Gaming & Website */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #000000', paddingTop: '6px', marginBottom: '8px', fontSize: '9px' }}>
            <div style={{ fontWeight: 700 }}>
              Club Re Straddle — Play Responsibly.
            </div>
            <div style={{ fontSize: '8.5px' }}>
              JB Complex, Sector 104, Noida | +91 99589 49859
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
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            {activeCopy}
          </div>
        </div>
      </div>
    </div>
  );
};
