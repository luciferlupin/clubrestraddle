import type { ClubInvoiceData } from '../components/common/ClubTaxInvoiceModal';
import type { Player, DailyCheckIn, Tournament, TournamentEntry, CashTransaction } from '../types';
import {
  formatClubLabel,
  formatDateOnly,
  formatTimeOnly,
  formatPlayerNumber,
  generateGateInvoiceNumber,
} from './formatters';

/**
 * Generates official ₹500 Door Entry & Lounge Access Tax Invoice (Inclusive of 5% GST)
 */
export const generateEntryFeeInvoice = (
  player: Player,
  checkIn: DailyCheckIn,
  staffName: string = 'Security / Front Desk'
): ClubInvoiceData => {
  const checkInDateTime = checkIn.checkInDate && checkIn.checkInTime
    ? `${checkIn.checkInDate}T${checkIn.checkInTime}`
    : new Date().toISOString();

  return {
    invoiceNumber: generateGateInvoiceNumber(checkIn.id),
    invoiceDate: checkInDateTime,
    category: 'Club Door Entry & Lounge Access Fee',
    playerId: formatPlayerNumber(player),
    playerName: player.fullName,
    playerPhone: player.phone,
    playerEmail: player.email,
    govtIdType: player.kyc.govtIdType || 'Aadhaar & PAN Card',
    govtIdNumber: player.kyc.panNumber || player.kyc.aadhaarNumber || player.kyc.govtIdNumber,
    membershipTier: player.membershipTier,
    tableLocation: 'Club entrance',
    eventName: 'Club Daily Entry & Facility Access',
    eventDate: `Check-in • ${formatDateOnly(checkInDateTime)} • ${formatTimeOnly(checkInDateTime)}`,
    eventDetails: 'Daily entrance clearance (₹500 inclusive of 5% GST)',
    natureOfSupply: '',
    sacCode: '999691',
    gstRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    taxableAmount: 476.19,
    serviceCharge: 476.19,
    subtotal: 476.19,
    gstAmount: 23.81,
    cgstAmount: 11.90,
    sgstAmount: 11.91,
    totalAmount: 500,
    paymentMethod: checkIn.paymentMethod || 'Cash',
    paymentReference: `ENT-${checkIn.id}`,
    cashierName: checkIn.verifiedBy || staffName,
    items: [
      {
        description: 'Club Door Entry & Facility Access Fee (5% GST Included)',
        details: 'Daily entrance clearance, refreshments & gaming lounge amenities',
        amount: 500,
      },
    ],
  };
};

/**
 * Generates official Tournament Entry & Service Charge Tax Invoice
 */
export const generateTournamentInvoice = (
  entry: TournamentEntry,
  tournament?: Tournament,
  player?: Player,
  staffName: string = 'Tournament Director'
): ClubInvoiceData => {
  let invoiceNumber = entry.receiptNumber;
  if (!invoiceNumber || !invoiceNumber.startsWith('CRS/')) {
    const trnId = entry.tournamentId || tournament?.id || 'TRN-2026-01';
    const trnMatch = trnId.match(/TRN-(?:2026-)?(\d+)/i) || trnId.match(/(\d+)$/);
    const seriesCode = trnMatch ? `TRN-${trnMatch[1].padStart(2, '0')}` : 'TRN-01';
    const entrySeqMatch = entry.id.match(/\d+$/);
    const seq = entrySeqMatch ? entrySeqMatch[0].padStart(4, '0') : '0001';
    invoiceNumber = `CRS/${seriesCode}/26-27/${seq}`;
  }

  const totalAmount = (entry.buyInAmount || 0) + (entry.rakeAmount || 0);

  return {
    invoiceNumber,
    invoiceDate: entry.registeredAt || new Date().toISOString(),
    category: 'Tournament Entry & Service Charge',
    playerId: player ? formatPlayerNumber(player) : entry.playerId,
    playerName: entry.playerName,
    playerPhone: entry.playerPhone || player?.phone,
    playerEmail: player?.email,
    govtIdType: player?.kyc.govtIdType || 'Aadhaar & PAN Card',
    govtIdNumber: player?.kyc.panNumber || player?.kyc.aadhaarNumber || player?.kyc.govtIdNumber,
    membershipTier: player?.membershipTier || 'VIP',
    tableLocation: `Table ${entry.tableNumber || '1'} • Seat ${entry.seatNumber || '1'}`,
    eventName: formatClubLabel(entry.tournamentName || tournament?.name || 'Club Tournament Championship'),
    eventDate: `Texas • ${formatDateOnly(entry.registeredAt || new Date().toISOString())} • ${formatTimeOnly(entry.registeredAt || new Date().toISOString())}`,
    eventDetails: `Tournament • Table ${entry.tableNumber || '1'} • Seat ${entry.seatNumber || '1'}`,
    natureOfSupply: '',
    sacCode: '999691',
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    totalAmount: totalAmount > 0 ? totalAmount : (tournament ? tournament.buyInFee + tournament.clubRake : 5000),
    serviceCharge: entry.rakeAmount || (tournament ? tournament.clubRake : 500),
    subtotal: entry.buyInAmount || (tournament ? tournament.buyInFee : 4500),
    paymentMethod: entry.paymentMethod || 'Cash',
    paymentReference: entry.paymentReference || `TRN-REF-${entry.id}`,
    cashierName: entry.cashierName || staffName,
    items: [
      {
        description: `${formatClubLabel(entry.tournamentName || tournament?.name || 'Tournament')} - Buy-in Stack`,
        details: `${tournament?.startingChips?.toLocaleString() || '25,000'} Starting Tournament Chips`,
        chips: tournament?.startingChips || 25000,
        amount: entry.buyInAmount || (tournament ? tournament.buyInFee : 4500),
      },
      {
        description: 'Tournament Service Charges & Organization Fee (18% GST Included)',
        details: 'Floor supervision, dealers, table service & club facilitation',
        amount: entry.rakeAmount || (tournament ? tournament.clubRake : 500),
      },
    ],
  };
};

/**
 * Generates official Cashier Receipt / Service Charge Tax Invoice for incoming collections (excludes payouts)
 */
export const generateCashTransactionInvoice = (
  txn: CashTransaction,
  player?: Player,
  staffName: string = 'Cashier Desk'
): ClubInvoiceData => {
  const cshMatch = txn.id.match(/\d+$/);
  const cshSeq = cshMatch ? cshMatch[0].padStart(4, '0') : '0001';

  return {
    invoiceNumber: `CRS/CSH/26-27/${cshSeq}`,
    invoiceDate: txn.timestamp || new Date().toISOString(),
    category: `${txn.category} Tax Invoice`,
    playerId: player ? formatPlayerNumber(player) : undefined,
    playerName: txn.playerName || player?.fullName || 'Member Player',
    playerPhone: player?.phone,
    playerEmail: player?.email,
    govtIdType: player?.kyc.govtIdType,
    govtIdNumber: player?.kyc.panNumber || player?.kyc.aadhaarNumber || player?.kyc.govtIdNumber,
    membershipTier: player?.membershipTier,
    eventName: `Gaming Floor • ${txn.category}`,
    eventDate: `${formatDateOnly(txn.timestamp)} • ${formatTimeOnly(txn.timestamp)}`,
    eventDetails: `${txn.description} (${txn.paymentMethod})`,
    natureOfSupply: '',
    sacCode: '999691',
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    totalAmount: txn.amount,
    paymentMethod: txn.paymentMethod,
    paymentReference: txn.referenceId || txn.id,
    cashierName: txn.cashierName || staffName,
    items: [
      {
        description: `${txn.category} - ${txn.description}`,
        details: `Settlement via ${txn.paymentMethod}`,
        amount: txn.amount,
      },
    ],
  };
};
