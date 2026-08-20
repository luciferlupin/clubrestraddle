// Data Types for Poker Club Management System

export type UserRole = 'player' | 'cashier' | 'security' | 'admin';

export type StaffRole = 'admin' | 'cashier' | 'security';

export type StaffStatus = 'active' | 'suspended';

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
  status: StaffStatus;
  createdAt: string;
  createdBy?: string;
  lastLoginAt?: string;
}

export type KYCStatus = 'pending' | 'verified' | 'rejected';

export type EntryVerificationStatus = 'pending' | 'approved' | 'rejected';

export type GovtIdType = 'Passport' | 'Driving License' | 'National ID' | 'State ID' | 'Voter ID';

export type MembershipTier = 'Standard' | 'Silver' | 'Gold' | 'VIP' | 'High Roller';

export type TournamentStatus = 'Upcoming' | 'Registering' | 'Running' | 'Completed' | 'Cancelled';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Credit/Debit Card' | 'Chips' | 'UPI/Digital';

export type CashFlowType = 'in' | 'out';

export type CashCategory = 
  // Cash In
  | 'Tournament Buy-in'
  | 'Cash Game Buy-in'
  | 'Chip Purchase'
  | 'Float Deposit'
  | 'Table Rake'
  | 'Membership Fee'
  // Cash Out
  | 'Tournament Prize Payout'
  | 'Cash Game Cash-out'
  | 'Player Cash Withdrawal'
  | 'Float Withdrawal'
  | 'Player Refund'
  | 'Cashier Settlement';

export type ExpenseCategory = 
  | 'Dealer & Staff Wages'
  | 'Rent & Utilities'
  | 'Cards, Chips & Tables'
  | 'Refreshments & F&B'
  | 'Security & Surveillance'
  | 'Licensing & Compliance'
  | 'Maintenance & Repairs'
  | 'Miscellaneous';

export interface PlayerKYC {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  govtIdType: GovtIdType;
  govtIdNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photoUrl: string;
  agreedToRules: boolean;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface Player {
  id: string; // e.g., 'PLR-1001'
  fullName: string;
  phone: string;
  email: string;
  membershipTier: MembershipTier;
  kycStatus: KYCStatus;
  kyc: PlayerKYC;
  registeredAt: string;
  totalVisits: number;
  notes?: string;
}

export interface DailyCheckIn {
  id: string; // e.g., 'CHK-2026-001'
  playerId: string;
  playerName: string;
  playerPhone: string;
  checkInDate: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS
  verificationStatus: EntryVerificationStatus;
  verifiedBy?: string; // Security officer name
  verifiedAt?: string;
  rejectionReason?: string;
  tablePreference?: string;
}

export interface Tournament {
  id: string; // e.g., 'TRN-501'
  name: string;
  buyInFee: number;
  clubRake: number;
  startingChips: number;
  guaranteedPrizePool: number;
  maxSeats: number;
  blindLevelsMinutes: number;
  startTime: string;
  status: TournamentStatus;
  createdAt: string;
  createdBy: string;
}

export interface TournamentEntry {
  id: string; // e.g., 'ENT-901'
  tournamentId: string;
  tournamentName: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  buyInAmount: number;
  rakeAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  receiptNumber: string;
  seatNumber?: string;
  tableNumber?: string;
  entryStatus: 'Registered' | 'Seated' | 'Eliminated' | 'Re-entry';
  registeredAt: string;
  cashierName: string;
}

export interface CashTransaction {
  id: string; // e.g., 'CSH-701'
  type: CashFlowType;
  category: CashCategory;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  referenceId?: string; // Links to tournament entry or receipt
  playerName?: string;
  cashierName: string;
  timestamp: string;
  balanceAfter: number;
}

export interface Expense {
  id: string; // e.g., 'EXP-301'
  category: ExpenseCategory;
  amount: number;
  description: string;
  paidTo: string;
  paymentMethod: PaymentMethod;
  date: string;
  recordedBy: string;
  receiptNumber?: string;
}

export interface AuditLog {
  id: string;
  portal: 'Player' | 'Cashier' | 'Security' | 'Admin';
  user: string;
  action: string;
  details: string;
  timestamp: string;
}
