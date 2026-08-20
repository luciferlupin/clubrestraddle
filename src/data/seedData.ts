import {
  Player,
  DailyCheckIn,
  Tournament,
  TournamentEntry,
  CashTransaction,
  Expense,
  AuditLog,
  StaffUser,
} from '../types';

// Default Staff Users (Admin configured with requested email & credentials)
export const initialStaffUsers: StaffUser[] = [
  {
    id: 'STF-ADM-001',
    fullName: 'Jai Goel',
    email: 'jaigoel2206@gmail.com',
    password: '12345',
    role: 'admin',
    status: 'active',
    createdAt: '2026-08-20T00:00:00Z',
    createdBy: 'System Initializer',
  },
];

// Clean Slate: No Mock/Dummy Data
export const initialPlayers: Player[] = [];
export const initialCheckIns: DailyCheckIn[] = [];
export const initialTournaments: Tournament[] = [];
export const initialEntries: TournamentEntry[] = [];
export const initialCashTransactions: CashTransaction[] = [];
export const initialExpenses: Expense[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'LOG-SYS-001',
    portal: 'Admin',
    user: 'Jai Goel (Super Admin)',
    action: 'System Initialized',
    details: 'Club Showdown Poker OS initialized with Super Admin account (jaigoel2206@gmail.com).',
    timestamp: new Date().toISOString(),
  },
];
