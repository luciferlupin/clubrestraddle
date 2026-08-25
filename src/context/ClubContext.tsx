import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
  UserRole,
  Player,
  PlayerKYC,
  DailyCheckIn,
  Tournament,
  TournamentEntry,
  CashTransaction,
  Expense,
  AuditLog,
  CashCategory,
  PaymentMethod,
  KYCStatus,
  StaffUser,
  ChipRequest,
  GateCashTransfer,
} from '../types';
import {
  initialStaffUsers,
  initialPlayers,
  initialCheckIns,
  initialTournaments,
  initialEntries,
  initialCashTransactions,
  initialExpenses,
  initialAuditLogs,
  initialChipRequests,
} from '../data/seedData';
import {
  generateId,
  generateSequentialPlayerId,
  generateSequentialCheckInId,
  generateSequentialChipId,
  generateSequentialGateTransferId,
  generateReceiptNumber,
  getTodayDateString,
  isTimestampInCurrentSession,
  formatSessionLabel,
} from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { cartoonAvatarForPlayer } from '../utils/cartoonAvatars';

const ensurePermanentMemberNumbers = (players: Player[]): Player[] => {
  let maxNumber = 0;
  for (const p of players) {
    if (typeof p.memberNumber === 'number' && p.memberNumber > maxNumber) {
      maxNumber = p.memberNumber;
    } else if (/^\d+$/.test(p.id)) {
      const num = parseInt(p.id, 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  let changed = false;
  const normalized = players.map(player => {
    if (typeof player.memberNumber === 'number' && player.memberNumber > 0) {
      return player;
    }
    if (/^\d+$/.test(player.id)) {
      const num = parseInt(player.id, 10);
      if (num > 0) {
        changed = true;
        return { ...player, memberNumber: num };
      }
    }
    maxNumber += 1;
    changed = true;
    return { ...player, memberNumber: maxNumber };
  });
  return changed ? normalized : players;
};

const playerToDatabaseRow = (player: Player) => ({
  id: player.id,
  member_number: player.memberNumber,
  full_name: player.fullName,
  phone: player.phone,
  email: player.email,
  membership_tier: player.membershipTier,
  kyc_status: player.kycStatus,
  date_of_birth: player.kyc.dateOfBirth || '2000-01-01',
  govt_id_type: player.kyc.govtIdType === 'Aadhaar & PAN Card' ? 'Aadhaar Card' : (player.kyc.govtIdType || 'Aadhaar Card'),
  govt_id_number: player.kyc.govtIdNumber || 'KYC-PENDING',
  aadhaar_number: player.kyc.aadhaarNumber || null,
  pan_number: player.kyc.panNumber || null,
  aadhaar_photo_url: player.kyc.aadhaarPhotoUrl || null,
  aadhaar_back_photo_url: player.kyc.aadhaarBackPhotoUrl || null,
  pan_photo_url: player.kyc.panPhotoUrl || null,
  address: player.kyc.address || null,
  emergency_contact_name: player.kyc.emergencyContactName || null,
  emergency_contact_phone: player.kyc.emergencyContactPhone || null,
  photo_url: player.kyc.photoUrl || null,
  agreed_to_rules: player.kyc.agreedToRules,
  verified_at: player.kyc.verifiedAt || null,
  verified_by: player.kyc.verifiedBy || null,
  rejection_reason: player.kyc.rejectionReason || null,
  phone_verified: player.phoneVerified || player.kyc.phoneVerified || false,
  phone_verified_at: player.phoneVerifiedAt || player.kyc.phoneVerifiedAt || null,
  total_visits: player.totalVisits,
  notes: player.notes || null,
  created_at: player.registeredAt,
});

const reconcileStalePendingCheckIns = (checkIns: DailyCheckIn[]): {
  checkIns: DailyCheckIn[];
  repaired: DailyCheckIn[];
} => {
  const latestResolvedByPlayer = new Map<string, DailyCheckIn>();
  const timestamp = (checkIn: DailyCheckIn) =>
    new Date(`${checkIn.checkInDate}T${checkIn.checkInTime || '00:00:00'}`).getTime() || 0;

  for (const checkIn of checkIns) {
    if (checkIn.verificationStatus === 'pending') continue;
    const current = latestResolvedByPlayer.get(checkIn.playerId);
    if (!current || timestamp(checkIn) > timestamp(current)) {
      latestResolvedByPlayer.set(checkIn.playerId, checkIn);
    }
  }

  const repaired: DailyCheckIn[] = [];
  const reconciled = checkIns.map(checkIn => {
    if (checkIn.verificationStatus !== 'pending') return checkIn;
    const newerDecision = latestResolvedByPlayer.get(checkIn.playerId);
    if (!newerDecision || timestamp(checkIn) >= timestamp(newerDecision)) return checkIn;
    const updated: DailyCheckIn = {
      ...checkIn,
      verificationStatus: newerDecision.verificationStatus,
      verifiedBy: newerDecision.verifiedBy,
      verifiedAt: newerDecision.verifiedAt,
      rejectionReason: newerDecision.rejectionReason,
    };
    repaired.push(updated);
    return updated;
  });

  return { checkIns: reconciled, repaired };
};

export const playQueueChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // ignore audio autoplay restriction
  }
};

interface ClubContextType {
  // Navigation & Session
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  selectedPlayerId: string;
  setSelectedPlayerId: (id: string) => void;
  staffName: string;
  setStaffName: (name: string) => void;

  // Realtime & Multi-Device Sync
  isRealtimeConnected: boolean;
  syncNow: () => Promise<void>;

  // Staff Authentication & Users
  staffUsers: StaffUser[];
  currentStaffUser: StaffUser | null;
  loginStaff: (email: string, password: string) => { success: boolean; message?: string; user?: StaffUser };
  logoutStaff: () => void;
  createStaffUser: (params: { fullName: string; email: string; password: string; role: 'cashier' | 'security' }) => { success: boolean; message?: string; user?: StaffUser };
  deleteStaffUser: (id: string) => void;
  toggleStaffStatus: (id: string) => void;

  // Data Collections
  players: Player[];
  checkIns: DailyCheckIn[];
  tournaments: Tournament[];
  entries: TournamentEntry[];
  cashTransactions: CashTransaction[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  chipRequests: ChipRequest[];

  // Derived Values
  currentPlayer: Player | undefined;
  todayCheckIns: DailyCheckIn[];
  pendingChipOrdersCount: number;
  currentCashBalance: number;
  physicalCashBalance: number;
  upiBalance: number;
  bankBalance: number;
  cardBalance: number;
  totalLiquidityBalance: number;
  physicalCashIn: number;
  physicalCashOut: number;
  physicalCashExpenses: number;
  upiIn: number;
  upiOut: number;
  upiExpenses: number;
  bankIn: number;
  bankOut: number;
  bankExpenses: number;
  cardIn: number;
  cardOut: number;
  cardExpenses: number;
  totalExpensesAmount: number;
  totalCashInAmount: number;
  totalCashOutAmount: number;
  netTreasuryBalance: number;

  // Today's Scoped Collections & Balances (for Cashier & Daily Desk)
  todayCashTransactions: CashTransaction[];
  todayEntries: TournamentEntry[];
  todayExpenses: Expense[];
  todayPhysicalCashBalance: number;
  todayUpiBalance: number;
  todayBankBalance: number;
  todayCardBalance: number;
  todayTotalBalance: number;
  todayCashInAmount: number;
  todayCashOutAmount: number;
  todayExpensesAmount: number;
  todayPhysicalCashIn: number;
  todayPhysicalCashOut: number;
  todayUpiIn: number;
  todayUpiOut: number;
  todayBankIn: number;
  todayBankOut: number;

  // Gate Cash Collection & Handover System (Linked to Inside Cashier & Main Cash)
  gateTransfers: GateCashTransfer[];
  todayApprovedDoorCount: number;
  todayGateCollected: number;
  todayGateCashCollected: number;
  todayGateUpiCollected: number;
  todayGateBankCollected: number;
  todayGateTransfers: GateCashTransfer[];
  todayGateTransferredAmount: number;
  todayGateCashInHand: number;
  allTimeGateCollected: number;
  allTimeGateTransferred: number;
  allTimeGateCashInHand: number;
  transferGateCashToCashier: (params: {
    amount: number;
    receivedByCashier: string;
    paymentMethod?: PaymentMethod;
    notes?: string;
  }) => GateCashTransfer;

  // Player CRUD Actions
  registerNewPlayer: (kycData: Omit<PlayerKYC, 'submittedAt'>) => { player: Player; checkIn: DailyCheckIn };
  performDailyCheckIn: (playerId: string) => DailyCheckIn;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  deletePlayer: (playerId: string) => void;
  updatePlayerKYC: (playerId: string, updatedKYC: Partial<PlayerKYC>) => void;
  hasPlayerCheckedInToday: (playerId: string) => DailyCheckIn | undefined;
  lookupMemberByPhone: (phoneOrId: string) => Promise<Player | null>;
  findMemberByPhone: (phoneOrId: string) => Promise<Player | null>;
  requestBuyChips: (params: { playerId: string; amount: number; tableNumber: string; seatNumber: string; paymentMethod: PaymentMethod; notes?: string }) => ChipRequest;

  // Cashier & Tournament CRUD Actions
  createTournament: (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'createdBy'>) => Tournament;
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => void;
  deleteTournament: (tournamentId: string) => void;
  registerPlayerForTournament: (params: {
    tournamentId: string;
    playerId: string;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    tableNumber?: string;
    seatNumber?: string;
  }) => TournamentEntry;
  updateTournamentEntry: (entryId: string, updates: Partial<TournamentEntry>) => void;
  deleteTournamentEntry: (entryId: string) => void;
  fulfillChipRequest: (requestId: string) => ChipRequest | undefined;
  cancelChipRequest: (requestId: string, reason?: string) => void;
  updateChipRequest: (requestId: string, updates: Partial<ChipRequest>) => void;
  deleteChipRequest: (requestId: string) => void;
  addCashReceived: (params: {
    category: CashCategory;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    playerName?: string;
    referenceId?: string;
  }) => CashTransaction;
  addCashGiven: (params: {
    category: CashCategory;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    playerName?: string;
    referenceId?: string;
  }) => CashTransaction;
  updateCashTransaction: (transactionId: string, updates: Partial<CashTransaction>) => void;
  deleteCashTransaction: (transactionId: string) => void;
  updateTournamentStatus: (tournamentId: string, status: Tournament['status']) => void;

  // Security & Attendance CRUD Actions
  approvePlayerEntry: (checkInId: string, paymentMethod?: PaymentMethod) => void;
  rejectPlayerEntry: (checkInId: string, reason: string) => void;
  updateCheckIn: (checkInId: string, updates: Partial<DailyCheckIn>) => void;
  deleteCheckIn: (checkInId: string) => void;
  reviewKYC: (playerId: string, status: KYCStatus, reason?: string) => void;

  // Admin, Expense & Audit CRUD Actions
  addExpense: (expenseData: Omit<Expense, 'id' | 'recordedBy'>) => Expense;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  updateStaffUser: (staffId: string, updates: Partial<StaffUser>) => void;
  deleteAuditLog: (logId: string) => void;
  clearAuditLogs: () => void;
  resetToDemoData: () => void;
  addAuditLog: (portal: AuditLog['portal'], action: string, details: string) => void;
}

const STORAGE_KEYS = {
  STAFF_USERS: 'clubshowdown_staff_users_v5',
  CURRENT_STAFF: 'clubshowdown_current_staff_v5',
  PLAYERS: 'clubshowdown_players_v5',
  CHECK_INS: 'clubshowdown_checkins_v5',
  TOURNAMENTS: 'clubshowdown_tournaments_v5',
  ENTRIES: 'clubshowdown_entries_v5',
  CASH_TXNS: 'clubshowdown_cash_txns_v5',
  EXPENSES: 'clubshowdown_expenses_v5',
  AUDIT_LOGS: 'clubshowdown_audit_logs_v5',
  CHIP_REQUESTS: 'clubshowdown_chip_requests_v5',
  GATE_TRANSFERS: 'clubshowdown_gate_transfers_v5',
  ACTIVE_ROLE: 'clubshowdown_active_role_v5',
  SELECTED_PLAYER: 'clubshowdown_selected_player_v5',
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to read from localStorage (${key}):`, e);
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to write to localStorage (${key}):`, e);
  }
};

export const ClubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    const savedRole = loadFromStorage<UserRole>(STORAGE_KEYS.ACTIVE_ROLE, 'player');
    const savedStaff = loadFromStorage<StaffUser | null>(STORAGE_KEYS.CURRENT_STAFF, null);
    if (savedStaff && savedRole === 'player') {
      return savedStaff.role === 'admin' ? 'admin' : (savedStaff.role as UserRole);
    }
    return savedRole;
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() =>
    loadFromStorage(STORAGE_KEYS.STAFF_USERS, initialStaffUsers)
  );

  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(() =>
    loadFromStorage<StaffUser | null>(STORAGE_KEYS.CURRENT_STAFF, null)
  );

  const [selectedPlayerId, setSelectedPlayerIdState] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.SELECTED_PLAYER, '')
  );

  const [staffName, setStaffName] = useState<string>('Staff Officer');

  const [players, setPlayers] = useState<Player[]>(() =>
    ensurePermanentMemberNumbers(loadFromStorage(STORAGE_KEYS.PLAYERS, initialPlayers))
  );
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() =>
    loadFromStorage(STORAGE_KEYS.CHECK_INS, initialCheckIns)
  );
  const [tournaments, setTournaments] = useState<Tournament[]>(() =>
    loadFromStorage(STORAGE_KEYS.TOURNAMENTS, initialTournaments)
  );
  const [entries, setEntries] = useState<TournamentEntry[]>(() =>
    loadFromStorage(STORAGE_KEYS.ENTRIES, initialEntries)
  );
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.CASH_TXNS, initialCashTransactions)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage(STORAGE_KEYS.EXPENSES, initialExpenses)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs)
  );
  const [chipRequests, setChipRequests] = useState<ChipRequest[]>(() =>
    loadFromStorage(STORAGE_KEYS.CHIP_REQUESTS, initialChipRequests)
  );
  const [gateTransfers, setGateTransfers] = useState<GateCashTransfer[]>(() =>
    loadFromStorage(STORAGE_KEYS.GATE_TRANSFERS, [])
  );

  // Sync state to LocalStorage
  useEffect(() => saveToStorage(STORAGE_KEYS.STAFF_USERS, staffUsers), [staffUsers]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CURRENT_STAFF, currentStaffUser), [currentStaffUser]);
  useEffect(() => saveToStorage(STORAGE_KEYS.PLAYERS, players), [players]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CHECK_INS, checkIns), [checkIns]);
  useEffect(() => saveToStorage(STORAGE_KEYS.TOURNAMENTS, tournaments), [tournaments]);
  useEffect(() => saveToStorage(STORAGE_KEYS.ENTRIES, entries), [entries]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CASH_TXNS, cashTransactions), [cashTransactions]);
  useEffect(() => saveToStorage(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveToStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs), [auditLogs]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CHIP_REQUESTS, chipRequests), [chipRequests]);
  useEffect(() => saveToStorage(STORAGE_KEYS.GATE_TRANSFERS, gateTransfers), [gateTransfers]);
  useEffect(() => saveToStorage(STORAGE_KEYS.ACTIVE_ROLE, activeRole), [activeRole]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SELECTED_PLAYER, selectedPlayerId), [selectedPlayerId]);

  // Adjust staff name when user logs in/out or switches role
  useEffect(() => {
    if (currentStaffUser) {
      setStaffName(`${currentStaffUser.fullName} (${currentStaffUser.role.toUpperCase()})`);
    } else {
      if (activeRole === 'cashier') setStaffName('Cashier Staff');
      else if (activeRole === 'security') setStaffName('Security Officer');
      else if (activeRole === 'admin') setStaffName('Club Admin');
      else setStaffName('Player');
    }
  }, [currentStaffUser, activeRole]);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);

  // Cross-Tab / Multi-Window Real-time Sync via BroadcastChannel & Storage events
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannelRef.current = new BroadcastChannel('club_restraddle_sync');
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }
    return () => {
      try {
        broadcastChannelRef.current?.close();
      } catch {}
    };
  }, []);

  const broadcastUpdate = useCallback((type: string, payload?: any) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type, payload, timestamp: Date.now() });
      } else if (typeof BroadcastChannel !== 'undefined') {
        const tempBc = new BroadcastChannel('club_restraddle_sync');
        tempBc.postMessage({ type, payload, timestamp: Date.now() });
        setTimeout(() => tempBc.close(), 1000);
      }
    } catch {
      // Browser fallback
    }

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('club_restraddle_sync', { detail: { type, payload, timestamp: Date.now() } }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('club_restraddle_sync');
        bc.onmessage = (event) => {
          if (!event.data || !event.data.type) return;
          const { type, payload } = event.data;

          if (type === 'SYNC_ALL') {
            setStaffUsers(loadFromStorage(STORAGE_KEYS.STAFF_USERS, initialStaffUsers));
            setPlayers(loadFromStorage(STORAGE_KEYS.PLAYERS, initialPlayers));
            setCheckIns(loadFromStorage(STORAGE_KEYS.CHECK_INS, initialCheckIns));
            setTournaments(loadFromStorage(STORAGE_KEYS.TOURNAMENTS, initialTournaments));
            setEntries(loadFromStorage(STORAGE_KEYS.ENTRIES, initialEntries));
            setCashTransactions(loadFromStorage(STORAGE_KEYS.CASH_TXNS, initialCashTransactions));
            setExpenses(loadFromStorage(STORAGE_KEYS.EXPENSES, initialExpenses));
            setAuditLogs(loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs));
            setChipRequests(loadFromStorage(STORAGE_KEYS.CHIP_REQUESTS, initialChipRequests));
          } else if (type === 'CHIP_REQUESTS_UPDATED' && payload) {
            setChipRequests(payload);
          } else if (type === 'NEW_CHIP_ORDER' && payload) {
            setChipRequests(prev => {
              const exists = prev.some(r => r.id === payload.id);
              if (exists) return prev.map(r => (r.id === payload.id ? payload : r));
              return [payload, ...prev];
            });
            playQueueChime();
          } else if (type === 'NEW_CHECK_IN' && payload) {
            setCheckIns(prev => {
              const exists = prev.some(c => c.id === payload.id);
              if (exists) return prev.map(c => (c.id === payload.id ? payload : c));
              return [payload, ...prev];
            });
            playQueueChime();
          } else if (type === 'CHECK_INS_UPDATED' && payload) {
            setCheckIns(payload);
          } else if (type === 'PLAYERS_UPDATED' && payload) {
            setPlayers(payload);
          } else if (type === 'TOURNAMENTS_UPDATED' && payload) {
            setTournaments(payload);
          } else if (type === 'ENTRIES_UPDATED' && payload) {
            setEntries(payload);
          } else if (type === 'CASH_TXNS_UPDATED' && payload) {
            setCashTransactions(payload);
          } else if (type === 'EXPENSES_UPDATED' && payload) {
            setExpenses(payload);
          } else if (type === 'GATE_TRANSFERS_UPDATED' && payload) {
            setGateTransfers(payload);
          } else if (type === 'STAFF_UPDATED' && payload) {
            setStaffUsers(payload);
          }
        };
      }
    } catch {
      // Fallback
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.CHIP_REQUESTS) {
          const parsed = JSON.parse(e.newValue);
          setChipRequests(parsed);
        } else if (e.key === STORAGE_KEYS.CHECK_INS) {
          setCheckIns(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.PLAYERS) {
          setPlayers(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.TOURNAMENTS) {
          setTournaments(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ENTRIES) {
          setEntries(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.CASH_TXNS) {
          setCashTransactions(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.EXPENSES) {
          setExpenses(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.GATE_TRANSFERS) {
          setGateTransfers(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.STAFF_USERS) {
          setStaffUsers(JSON.parse(e.newValue));
        }
      } catch {
        // Storage parse fallback
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const lastFetchTimeRef = useRef<number>(0);

  // Hydrate from Supabase & Subscribe to Realtime Changes
  const fetchSupabaseData = useCallback(async (force = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 15000) {
      return; // Throttled: prevents rapid duplicate queries
    }
    lastFetchTimeRef.current = now;
    const client = supabase;

    try {
      const { data: staffData, error: staffErr } = await client.from('staff_users').select('*');
      if (!staffErr && staffData && staffData.length > 0) {
        const mappedStaff: StaffUser[] = staffData.map((s: any) => ({
          id: s.id,
          fullName: s.full_name || 'Staff Member',
          email: s.email,
          password: s.password || s.password_hash || '12345',
          role: s.role || 'cashier',
          status: s.status || 'active',
          createdAt: s.created_at || new Date().toISOString(),
          createdBy: s.created_by,
          lastLoginAt: s.last_login_at,
        }));
        setStaffUsers(mappedStaff);
      }

      const { data: playersData, error: pErr } = await client.from('players').select('*').order('created_at', { ascending: false }).limit(250);
      if (!pErr && playersData) {
        if (playersData.length > 0) {
          let maxExistingNumber = 0;
          playersData.forEach((p: any) => {
            if (typeof p.member_number === 'number' && p.member_number > maxExistingNumber) {
              maxExistingNumber = p.member_number;
            } else if (/^\d+$/.test(String(p.id))) {
              const num = parseInt(String(p.id), 10);
              if (num > maxExistingNumber) maxExistingNumber = num;
            }
          });

          const mappedPlayers: Player[] = playersData.map((p: any) => {
            const idNum = p.govt_id_number || '';
            let aadhaarParsed = '';
            let panParsed = '';
            const panMatch = idNum.match(/PAN:\s*([A-Z0-9]{10})/i);
            if (panMatch) panParsed = panMatch[1].toUpperCase();
            const aadhaarMatch = idNum.match(/Aadhaar:\s*([\d\s]{12,14})/i);
            if (aadhaarMatch) aadhaarParsed = aadhaarMatch[1].trim();

            if (!panParsed && /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(idNum.trim())) {
              panParsed = idNum.trim().toUpperCase();
            }
            if (!aadhaarParsed && /^\d{12}$/.test(idNum.replace(/\s/g, ''))) {
              aadhaarParsed = idNum.trim();
            }

            let memberNumber: number | undefined = undefined;
            if (typeof p.member_number === 'number' && p.member_number > 0) {
              memberNumber = p.member_number;
            } else if (/^\d+$/.test(String(p.id))) {
              memberNumber = parseInt(String(p.id), 10);
            } else {
              maxExistingNumber += 1;
              memberNumber = maxExistingNumber;
              client.from('players').update({ member_number: memberNumber }).eq('id', p.id).then(() => {});
            }

            return {
              id: p.id,
              memberNumber,
              fullName: p.full_name || 'Member Player',
              phone: p.phone || '',
              email: p.email || '',
              membershipTier: p.membership_tier || 'Standard',
              kycStatus: p.kyc_status || 'pending',
              phoneVerified: Boolean(p.phone_verified),
              phoneVerifiedAt: p.phone_verified_at || undefined,
              registeredAt: p.created_at || new Date().toISOString(),
              totalVisits: p.total_visits || 1,
              notes: p.notes,
              kyc: {
                fullName: p.full_name || 'Member Player',
                phone: p.phone || '',
                email: p.email || '',
                phoneVerified: Boolean(p.phone_verified),
                phoneVerifiedAt: p.phone_verified_at || undefined,
                dateOfBirth: p.date_of_birth || '1995-01-01',
                aadhaarNumber: p.aadhaar_number || aadhaarParsed,
                panNumber: p.pan_number || panParsed,
                aadhaarPhotoUrl: p.aadhaar_photo_url,
                aadhaarBackPhotoUrl: p.aadhaar_back_photo_url,
                panPhotoUrl: p.pan_photo_url,
                govtIdType: p.govt_id_type || 'Aadhaar & PAN Card',
                govtIdNumber: p.govt_id_number || 'KYC-PENDING',
                address: p.address || 'Delhi NCR, India',
                emergencyContactName: p.emergency_contact_name || '',
                emergencyContactPhone: p.emergency_contact_phone || '',
                photoUrl: p.photo_url || cartoonAvatarForPlayer(p.id || p.full_name || 'member'),
                agreedToRules: p.agreed_to_rules ?? true,
                submittedAt: p.created_at || new Date().toISOString(),
                verifiedAt: p.verified_at,
                verifiedBy: p.verified_by,
                rejectionReason: p.rejection_reason,
              },
            };
          });

          setPlayers(mappedPlayers);
        } else if (initialPlayers.length > 0) {
          const seedRows = initialPlayers.map(ip => ({
            id: ip.id,
            member_number: ip.memberNumber,
            full_name: ip.fullName,
            phone: ip.phone,
            email: ip.email,
            membership_tier: ip.membershipTier,
            kyc_status: ip.kycStatus,
            date_of_birth: ip.kyc.dateOfBirth || '1995-01-01',
            govt_id_type: 'Aadhaar Card',
            govt_id_number: ip.kyc.govtIdNumber,
            aadhaar_number: ip.kyc.aadhaarNumber || null,
            pan_number: ip.kyc.panNumber || null,
            aadhaar_photo_url: ip.kyc.aadhaarPhotoUrl || null,
            aadhaar_back_photo_url: ip.kyc.aadhaarBackPhotoUrl || null,
            pan_photo_url: ip.kyc.panPhotoUrl || null,
            address: ip.kyc.address,
            emergency_contact_name: ip.kyc.emergencyContactName,
            emergency_contact_phone: ip.kyc.emergencyContactPhone,
            photo_url: ip.kyc.photoUrl,
            agreed_to_rules: true,
            total_visits: ip.totalVisits,
            created_at: ip.registeredAt,
          }));
          client.from('players').insert(seedRows).then(() => {
            console.log('Seeded initial players to Supabase');
          });
        }
      }

      const { data: checkInsData, error: chkErr } = await client.from('daily_check_ins').select('*').order('created_at', { ascending: false }).limit(200);
      if (!chkErr && checkInsData) {
        if (checkInsData.length > 0) {
          const mappedCheckIns: DailyCheckIn[] = checkInsData.map((c: any) => ({
            id: c.id,
            playerId: c.player_id,
            playerName: c.player_name || 'Member Player',
            playerPhone: c.player_phone || '',
            checkInDate: c.check_in_date || getTodayDateString(),
            checkInTime: c.check_in_time || '18:00:00',
            verificationStatus: c.verification_status || 'pending',
            verifiedBy: c.verified_by,
            verifiedAt: c.verified_at,
            rejectionReason: c.rejection_reason,
          }));
          const reconciled = reconcileStalePendingCheckIns(mappedCheckIns);
          setCheckIns(reconciled.checkIns);
          if (reconciled.repaired.length > 0) {
            await Promise.all(reconciled.repaired.map(checkIn =>
              client.from('daily_check_ins').update({
                verification_status: checkIn.verificationStatus,
                verified_by: checkIn.verifiedBy,
                verified_at: checkIn.verifiedAt,
                rejection_reason: checkIn.rejectionReason || null,
              }).eq('id', checkIn.id)
            ));
          }
        } else if (initialCheckIns.length > 0) {
          const seedChkRows = initialCheckIns.map(ic => ({
            id: ic.id,
            player_id: ic.playerId,
            player_name: ic.playerName,
            player_phone: ic.playerPhone,
            check_in_date: ic.checkInDate,
            check_in_time: ic.checkInTime,
            verification_status: ic.verificationStatus,
          }));
          client.from('daily_check_ins').insert(seedChkRows).then(() => {
            console.log('Seeded initial check-ins to Supabase');
          });
        }
      }

      const { data: tournamentsData, error: trnErr } = await client.from('tournaments').select('*').order('created_at', { ascending: false }).limit(50);
      if (!trnErr && tournamentsData) {
        if (tournamentsData.length > 0) {
          const mappedTournaments: Tournament[] = tournamentsData.map((t: any) => ({
            id: t.id,
            name: t.name,
            buyInFee: Number(t.buy_in_fee),
            clubRake: Number(t.club_rake),
            startingChips: Number(t.starting_chips),
            guaranteedPrizePool: Number(t.guaranteed_prize_pool),
            maxSeats: Number(t.max_seats),
            blindLevelsMinutes: Number(t.blind_levels_minutes),
            startTime: t.start_time,
            status: t.status,
            createdAt: t.created_at,
            createdBy: t.created_by || 'Cashier',
          }));
          setTournaments(mappedTournaments);
          saveToStorage(STORAGE_KEYS.TOURNAMENTS, mappedTournaments);
        } else {
          const saved = loadFromStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, []);
          if (saved.length === 0) {
            setTournaments([]);
          }
        }
      }

      const { data: entriesData, error: entriesError } = await client.from('tournament_entries').select('*').order('registered_at', { ascending: false }).limit(250);
      if (entriesError) console.error('Supabase tournament entries fetch error:', entriesError.message);
      if (entriesData) {
        const mappedEntries: TournamentEntry[] = entriesData.map((e: any) => ({
          id: e.id,
          tournamentId: e.tournament_id,
          tournamentName: e.tournament_name,
          playerId: e.player_id,
          playerName: e.player_name,
          playerPhone: e.player_phone,
          buyInAmount: Number(e.buy_in_amount),
          rakeAmount: Number(e.rake_amount),
          paymentMethod: e.payment_method,
          paymentReference: e.payment_reference,
          receiptNumber: e.receipt_number,
          seatNumber: e.seat_number,
          tableNumber: e.table_number,
          entryStatus: e.entry_status,
          cashierName: e.cashier_name,
          registeredAt: e.registered_at,
        }));
        setEntries(mappedEntries);
      }

      const { data: cashData, error: cashError } = await client.from('cash_transactions').select('*').order('timestamp', { ascending: false }).limit(250);
      if (cashError) console.error('Supabase cash transactions fetch error:', cashError.message);
      if (cashData) {
        const mappedCash: CashTransaction[] = cashData.map((t: any) => ({
          id: t.id,
          type: t.type,
          category: t.category,
          amount: Number(t.amount),
          description: t.description,
          paymentMethod: t.payment_method,
          referenceId: t.reference_id,
          playerName: t.player_name,
          cashierName: t.cashier_name,
          timestamp: t.timestamp,
          balanceAfter: Number(t.balance_after),
        }));
        setCashTransactions(mappedCash);
      }

      const { data: expensesData, error: expensesError } = await client.from('expenses').select('*').order('date', { ascending: false }).limit(150);
      if (expensesError) console.error('Supabase expenses fetch error:', expensesError.message);
      if (expensesData) {
        const mappedExpenses: Expense[] = expensesData.map((exp: any) => ({
          id: exp.id,
          category: exp.category,
          amount: Number(exp.amount),
          description: exp.description,
          paidTo: exp.paid_to,
          paymentMethod: exp.payment_method,
          date: exp.date,
          receiptNumber: exp.receipt_number,
          recordedBy: exp.recorded_by,
        }));
        setExpenses(mappedExpenses);
      }

      const { data: auditData, error: auditError } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (auditError) console.error('Supabase audit logs fetch error:', auditError.message);
      if (auditData) {
        const mappedLogs: AuditLog[] = auditData.map((l: any) => ({
          id: l.id,
          portal: l.portal,
          user: l.user_name,
          action: l.action,
          details: l.details,
          timestamp: l.timestamp,
        }));
        setAuditLogs(mappedLogs);
      }

      const { data: chipData, error: chipError } = await client.from('chip_requests').select('*').order('requested_at', { ascending: false }).limit(150);
      if (chipError) console.error('Supabase chip requests fetch error:', chipError.message);
      if (chipData) {
        const mappedChips: ChipRequest[] = chipData.map((c: any) => ({
          id: c.id,
          playerId: c.player_id,
          playerName: c.player_name,
          playerPhone: c.player_phone,
          amount: Number(c.amount),
          chipsQuantity: Number(c.chips_quantity || c.amount),
          tableNumber: c.table_number,
          seatNumber: c.seat_number,
          paymentMethod: c.payment_method,
          status: c.status,
          requestedAt: c.requested_at,
          fulfilledBy: c.fulfilled_by,
          fulfilledAt: c.fulfilled_at,
          receiptNumber: c.receipt_number,
          notes: c.notes,
        }));
        setChipRequests(mappedChips);
      }

      setIsRealtimeConnected(true);
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local storage:', err);
    }
  }, []);

  const syncNow = useCallback(async () => {
    await fetchSupabaseData(true);
    broadcastUpdate('SYNC_ALL');
  }, [fetchSupabaseData, broadcastUpdate]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    fetchSupabaseData();

    // ── Supabase Realtime Channel Subscriptions (Multi-Device Sync) ──
    const realtimeChannel = client
      .channel('club-restraddle-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const p = payload.new;
            const idNum = p.govt_id_number || '';
            let aadhaarParsed = '';
            let panParsed = '';
            const panMatch = idNum.match(/PAN:\s*([A-Z0-9]{10})/i);
            if (panMatch) panParsed = panMatch[1].toUpperCase();
            const aadhaarMatch = idNum.match(/Aadhaar:\s*([\d\s]{12,14})/i);
            if (aadhaarMatch) aadhaarParsed = aadhaarMatch[1].trim();

            if (!panParsed && /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(idNum.trim())) {
              panParsed = idNum.trim().toUpperCase();
            }
            if (!aadhaarParsed && /^\d{12}$/.test(idNum.replace(/\s/g, ''))) {
              aadhaarParsed = idNum.trim();
            }

            const updatedPlayer: Player = {
              id: p.id,
              fullName: p.full_name || 'Member Player',
              phone: p.phone || '',
              email: p.email || '',
              membershipTier: p.membership_tier || 'Standard',
              kycStatus: p.kyc_status || 'pending',
              phoneVerified: Boolean(p.phone_verified),
              phoneVerifiedAt: p.phone_verified_at || undefined,
              registeredAt: p.created_at || new Date().toISOString(),
              totalVisits: p.total_visits || 1,
              notes: p.notes,
              kyc: {
                fullName: p.full_name || 'Member Player',
                phone: p.phone || '',
                email: p.email || '',
                phoneVerified: Boolean(p.phone_verified),
                phoneVerifiedAt: p.phone_verified_at || undefined,
                dateOfBirth: p.date_of_birth || '1995-01-01',
                aadhaarNumber: p.aadhaar_number || aadhaarParsed,
                panNumber: p.pan_number || panParsed,
                aadhaarPhotoUrl: p.aadhaar_photo_url,
                aadhaarBackPhotoUrl: p.aadhaar_back_photo_url,
                panPhotoUrl: p.pan_photo_url,
                govtIdType: p.govt_id_type || 'Aadhaar & PAN Card',
                govtIdNumber: p.govt_id_number || 'KYC-PENDING',
                address: p.address || 'Delhi NCR, India',
                emergencyContactName: p.emergency_contact_name || '',
                emergencyContactPhone: p.emergency_contact_phone || '',
                photoUrl: p.photo_url || cartoonAvatarForPlayer(p.id || p.full_name || 'member'),
                agreedToRules: p.agreed_to_rules ?? true,
                submittedAt: p.created_at || new Date().toISOString(),
                verifiedAt: p.verified_at,
                verifiedBy: p.verified_by,
                rejectionReason: p.rejection_reason,
              },
            };
            setPlayers(prev => {
              const exists = prev.some(existing => existing.id === updatedPlayer.id);
              const dbSeq = typeof p.member_number === 'number' && p.member_number > 0 ? p.member_number : undefined;
              if (exists) {
                return prev.map(existing => (existing.id === updatedPlayer.id
                  ? { ...updatedPlayer, memberNumber: dbSeq ?? existing.memberNumber }
                  : existing));
              }
              const nextMemberNumber = dbSeq ?? (prev.reduce(
                (max, player) => Math.max(max, player.memberNumber || 0),
                0
              ) + 1);
              return [{ ...updatedPlayer, memberNumber: nextMemberNumber }, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_check_ins' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const c = payload.new;
            const updatedCheckIn: DailyCheckIn = {
              id: c.id,
              playerId: c.player_id,
              playerName: c.player_name || 'Member Player',
              playerPhone: c.player_phone || '',
              checkInDate: c.check_in_date || getTodayDateString(),
              checkInTime: c.check_in_time || '18:00:00',
              verificationStatus: c.verification_status || 'pending',
              verifiedBy: c.verified_by,
              verifiedAt: c.verified_at,
              rejectionReason: c.rejection_reason,
            };
            setCheckIns(prev => {
              const exists = prev.some(existing => existing.id === updatedCheckIn.id);
              if (exists) {
                return prev.map(existing => (existing.id === updatedCheckIn.id ? updatedCheckIn : existing));
              }
              return [updatedCheckIn, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setCheckIns(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chip_requests' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const c = payload.new;
            const updatedChip: ChipRequest = {
              id: c.id,
              playerId: c.player_id,
              playerName: c.player_name,
              playerPhone: c.player_phone,
              amount: Number(c.amount),
              chipsQuantity: Number(c.chips_quantity || c.amount),
              tableNumber: c.table_number,
              seatNumber: c.seat_number,
              paymentMethod: c.payment_method,
              status: c.status,
              requestedAt: c.requested_at,
              fulfilledBy: c.fulfilled_by,
              fulfilledAt: c.fulfilled_at,
              receiptNumber: c.receipt_number,
              notes: c.notes,
            };

            if (payload.eventType === 'INSERT' && updatedChip.status === 'pending') {
              playQueueChime();
            }

            setChipRequests(prev => {
              const exists = prev.some(existing => existing.id === updatedChip.id);
              if (exists) {
                return prev.map(existing => (existing.id === updatedChip.id ? updatedChip : existing));
              }
              return [updatedChip, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setChipRequests(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const t = payload.new;
            const updatedTrn: Tournament = {
              id: t.id,
              name: t.name,
              buyInFee: Number(t.buy_in_fee),
              clubRake: Number(t.club_rake),
              startingChips: Number(t.starting_chips),
              guaranteedPrizePool: Number(t.guaranteed_prize_pool),
              maxSeats: Number(t.max_seats),
              blindLevelsMinutes: Number(t.blind_levels_minutes),
              startTime: t.start_time,
              status: t.status,
              createdAt: t.created_at,
              createdBy: t.created_by || 'Cashier',
            };
            setTournaments(prev => {
              const exists = prev.some(x => x.id === updatedTrn.id);
              if (exists) return prev.map(x => (x.id === updatedTrn.id ? updatedTrn : x));
              return [updatedTrn, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setTournaments(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_entries' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const e = payload.new;
            const updatedEntry: TournamentEntry = {
              id: e.id,
              tournamentId: e.tournament_id,
              tournamentName: e.tournament_name,
              playerId: e.player_id,
              playerName: e.player_name,
              playerPhone: e.player_phone,
              buyInAmount: Number(e.buy_in_amount),
              rakeAmount: Number(e.rake_amount),
              paymentMethod: e.payment_method,
              paymentReference: e.payment_reference,
              receiptNumber: e.receipt_number,
              seatNumber: e.seat_number,
              tableNumber: e.table_number,
              entryStatus: e.entry_status,
              cashierName: e.cashier_name,
              registeredAt: e.registered_at,
            };
            setEntries(prev => {
              const exists = prev.some(x => x.id === updatedEntry.id);
              if (exists) return prev.map(x => (x.id === updatedEntry.id ? updatedEntry : x));
              return [updatedEntry, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deletedId = payload.old.id;
            setEntries(prev => {
              const toDelete = prev.find(e => e.id === deletedId);
              if (toDelete?.receiptNumber) {
                setCashTransactions(currTxns => currTxns.filter(t => t.referenceId !== toDelete.receiptNumber && t.referenceId !== toDelete.id));
              }
              return prev.filter(e => e.id !== deletedId);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_transactions' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const t = payload.new;
            const updatedCash: CashTransaction = {
              id: t.id,
              type: t.type,
              category: t.category,
              amount: Number(t.amount),
              description: t.description,
              paymentMethod: t.payment_method,
              referenceId: t.reference_id,
              playerName: t.player_name,
              cashierName: t.cashier_name,
              timestamp: t.timestamp,
              balanceAfter: Number(t.balance_after),
            };
            setCashTransactions(prev => {
              const exists = prev.some(x => x.id === updatedCash.id);
              if (exists) return prev.map(x => (x.id === updatedCash.id ? updatedCash : x));
              return [updatedCash, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deletedId = payload.old.id;
            setCashTransactions(prev => {
              const toDelete = prev.find(t => t.id === deletedId);
              if (toDelete?.referenceId) {
                setEntries(currEntries => currEntries.filter(e => e.receiptNumber !== toDelete.referenceId && e.id !== toDelete.referenceId));
              }
              return prev.filter(t => t.id !== deletedId);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const exp = payload.new;
            const updatedExp: Expense = {
              id: exp.id,
              category: exp.category,
              amount: Number(exp.amount),
              description: exp.description,
              paidTo: exp.paid_to,
              paymentMethod: exp.payment_method,
              date: exp.date,
              receiptNumber: exp.receipt_number,
              recordedBy: exp.recorded_by,
            };
            setExpenses(prev => {
              const exists = prev.some(x => x.id === updatedExp.id);
              if (exists) return prev.map(x => (x.id === updatedExp.id ? updatedExp : x));
              return [updatedExp, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_users' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const s = payload.new;
            const updatedStaff: StaffUser = {
              id: s.id,
              fullName: s.full_name || 'Staff Member',
              email: s.email,
              password: s.password || s.password_hash || '12345',
              role: s.role || 'cashier',
              status: s.status || 'active',
              createdAt: s.created_at || new Date().toISOString(),
              createdBy: s.created_by,
              lastLoginAt: s.last_login_at,
            };
            setStaffUsers(prev => {
              const exists = prev.some(x => x.id === updatedStaff.id);
              if (exists) return prev.map(x => (x.id === updatedStaff.id ? updatedStaff : x));
              return [updatedStaff, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setStaffUsers(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const l = payload.new;
            const updatedLog: AuditLog = {
              id: l.id,
              portal: l.portal,
              user: l.user_name,
              action: l.action,
              details: l.details,
              timestamp: l.timestamp,
            };
            setAuditLogs(prev => {
              const exists = prev.some(x => x.id === updatedLog.id);
              if (exists) return prev;
              return [updatedLog, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setAuditLogs(prev => prev.filter(log => log.id !== payload.old.id));
          }
        }
      )
      .subscribe((status: string) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Instant refresh when tab becomes visible or focused (Zero background polling)
    const handleFocus = () => fetchSupabaseData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSupabaseData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      client.removeChannel(realtimeChannel);
    };
  }, [fetchSupabaseData]);

  const setActiveRole = useCallback((role: UserRole) => {
    setActiveRoleState(role);
    saveToStorage(STORAGE_KEYS.ACTIVE_ROLE, role);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (role === 'player') {
          url.searchParams.delete('portal');
        } else {
          url.searchParams.set('portal', role);
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // browser history fallback
    }
  }, []);

  const setSelectedPlayerId = (id: string) => {
    setSelectedPlayerIdState(id);
  };

  // Staff Login
  const loginStaff = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = staffUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'No staff account found with this email address.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password. Please verify and try again.' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'This staff account has been suspended by the Admin.' };
    }

    const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
    setCurrentStaffUser(updatedUser);
    saveToStorage(STORAGE_KEYS.CURRENT_STAFF, updatedUser);

    const targetRole: UserRole = user.role === 'admin' ? 'admin' : (user.role as UserRole);
    setActiveRoleState(targetRole);
    saveToStorage(STORAGE_KEYS.ACTIVE_ROLE, targetRole);

    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('portal', targetRole);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}

    setStaffUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));

    // Sync last login to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      supabase.from('staff_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
    }

    addAuditLog('Admin', 'Staff Login', `Staff member ${user.fullName} (${user.role.toUpperCase()}) logged in.`);
    return { success: true, user: updatedUser };
  };

  const logoutStaff = () => {
    if (currentStaffUser) {
      addAuditLog('Admin', 'Staff Logout', `Staff member ${currentStaffUser.fullName} (${currentStaffUser.role.toUpperCase()}) logged out.`);
    }
    setCurrentStaffUser(null);
    saveToStorage(STORAGE_KEYS.CURRENT_STAFF, null);
    setActiveRoleState('player');
    saveToStorage(STORAGE_KEYS.ACTIVE_ROLE, 'player');
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('portal');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const createStaffUser = (params: { fullName: string; email: string; password: string; role: 'cashier' | 'security' }) => {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = staffUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newStaff: StaffUser = {
      id: generateId('STF'),
      fullName: params.fullName.trim(),
      email: cleanEmail,
      password: params.password,
      role: params.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: currentStaffUser ? currentStaffUser.fullName : 'Admin',
    };

    setStaffUsers(prev => [newStaff, ...prev]);

    // Insert into Supabase if connected
    if (isSupabaseConfigured && supabase) {
      supabase.from('staff_users').insert({
        id: newStaff.id,
        full_name: newStaff.fullName,
        email: newStaff.email,
        password_hash: newStaff.password,
        role: newStaff.role,
        status: newStaff.status,
        created_by: newStaff.createdBy,
        created_at: newStaff.createdAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase staff create error:', error.message);
      });
    }

    addAuditLog('Admin', 'Staff Account Created', `Created ${params.role.toUpperCase()} account for ${newStaff.fullName} (${newStaff.email}).`);
    return { success: true, user: newStaff };
  };

  const deleteStaffUser = (id: string) => {
    const user = staffUsers.find(u => u.id === id);
    if (!user) return;
    if (user.role === 'admin') {
      alert('Cannot delete the primary Admin account.');
      return;
    }

    setStaffUsers(prev => {
      const next = prev.filter(u => u.id !== id);
      broadcastUpdate('STAFF_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('staff_users').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase staff delete error:', error.message);
      });
    }
    addAuditLog('Admin', 'Staff Account Deleted', `Deleted staff account: ${user.fullName} (${user.role.toUpperCase()}).`);
  };

  const toggleStaffStatus = (id: string) => {
    const user = staffUsers.find(u => u.id === id);
    if (!user || user.role === 'admin') return;

    const newStatus: StaffUser['status'] = user.status === 'active' ? 'suspended' : 'active';
    setStaffUsers(prev => {
      const next = prev.map(u => (u.id === id ? { ...u, status: newStatus } : u));
      broadcastUpdate('STAFF_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('staff_users').update({ status: newStatus }).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase staff status update error:', error.message);
      });
    }

    addAuditLog('Admin', 'Staff Status Changed', `Changed status of ${user.fullName} to ${newStatus}.`);
  };

  const updateStaffUser = (staffId: string, updates: Partial<StaffUser>) => {
    setStaffUsers(prev => {
      const next = prev.map(u => (u.id === staffId ? { ...u, ...updates } : u));
      broadcastUpdate('STAFF_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.password !== undefined) dbUpdates.password_hash = updates.password;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.lastLoginAt !== undefined) dbUpdates.last_login_at = updates.lastLoginAt;
      supabase.from('staff_users').update(dbUpdates).eq('id', staffId).then(({ error }) => {
        if (error) console.error('Supabase staff update error:', error.message);
      });
    }
    addAuditLog('Admin', 'Staff Account Updated', `Updated profile for staff member ${staffId}.`);
  };

  const addAuditLog = (portal: AuditLog['portal'], action: string, details: string) => {
    const newLog: AuditLog = {
      id: generateId('LOG'),
      portal,
      user: currentStaffUser ? `${currentStaffUser.fullName} (${currentStaffUser.role})` : staffName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').insert({
        id: newLog.id,
        portal: newLog.portal,
        user_name: newLog.user,
        action: newLog.action,
        details: newLog.details,
        timestamp: newLog.timestamp,
      }).then(({ error }) => {
        if (error) console.error('Supabase audit log insert error:', error.message);
      });
    }
  };

  // Derived Calculations
  const currentPlayer = useMemo(() => {
    if (!selectedPlayerId) return undefined;
    return players.find(p => p.id === selectedPlayerId);
  }, [players, selectedPlayerId]);

  const today = getTodayDateString();

  const todayCheckIns = useMemo(() => {
    const validPlayerIds = new Set(players.map(p => p.id));
    return checkIns
      .filter(c => validPlayerIds.has(c.playerId))
      .filter(c => c.checkInDate === today || c.verificationStatus === 'pending');
  }, [checkIns, players, today]);

  const totalCashInAmount = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const totalCashOutAmount = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  // 1. Physical Cash Breakdown
  const physicalCashIn = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'in' && (t.paymentMethod === 'Cash' || !t.paymentMethod))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const physicalCashOut = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'out' && (t.paymentMethod === 'Cash' || !t.paymentMethod))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const physicalCashExpenses = useMemo(() => {
    return expenses
      .filter(e => e.paymentMethod === 'Cash' || !e.paymentMethod)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const physicalCashBalance = useMemo(() => {
    return physicalCashIn - physicalCashOut - physicalCashExpenses;
  }, [physicalCashIn, physicalCashOut, physicalCashExpenses]);

  // 2. UPI / Digital Breakdown
  const upiIn = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'in' && t.paymentMethod === 'UPI/Digital')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const upiOut = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'out' && t.paymentMethod === 'UPI/Digital')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const upiExpenses = useMemo(() => {
    return expenses
      .filter(e => e.paymentMethod === 'UPI/Digital')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const upiBalance = useMemo(() => {
    return upiIn - upiOut - upiExpenses;
  }, [upiIn, upiOut, upiExpenses]);

  // 3. Bank Transfer Breakdown
  const bankIn = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'in' && t.paymentMethod === 'Bank Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const bankOut = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'out' && t.paymentMethod === 'Bank Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const bankExpenses = useMemo(() => {
    return expenses
      .filter(e => e.paymentMethod === 'Bank Transfer')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const bankBalance = useMemo(() => {
    return bankIn - bankOut - bankExpenses;
  }, [bankIn, bankOut, bankExpenses]);

  // 4. Card POS Terminal Breakdown
  const cardIn = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'in' && t.paymentMethod === 'Credit/Debit Card')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const cardOut = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'out' && t.paymentMethod === 'Credit/Debit Card')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const cardExpenses = useMemo(() => {
    return expenses
      .filter(e => e.paymentMethod === 'Credit/Debit Card')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const cardBalance = useMemo(() => {
    return cardIn - cardOut - cardExpenses;
  }, [cardIn, cardOut, cardExpenses]);

  // Current physical cash balance in hand (Vault float)
  const currentCashBalance = physicalCashBalance;

  // Total combined liquid treasury across all channels
  const totalLiquidityBalance = useMemo(() => {
    return physicalCashBalance + upiBalance + bankBalance + cardBalance;
  }, [physicalCashBalance, upiBalance, bankBalance, cardBalance]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netTreasuryBalance = useMemo(() => {
    return totalCashInAmount - totalCashOutAmount - totalExpensesAmount;
  }, [totalCashInAmount, totalCashOutAmount, totalExpensesAmount]);

  // ── TODAY-SCOPED COLLECTIONS & BALANCES (FOR CASHIER 10 AM - 10 AM SESSION) ───────
  const todayCashTransactions = useMemo(() => {
    return cashTransactions.filter(t => isTimestampInCurrentSession(t.timestamp, today));
  }, [cashTransactions, today]);

  const todayEntries = useMemo(() => {
    return entries.filter(e => isTimestampInCurrentSession(e.registeredAt, today));
  }, [entries, today]);

  const todayExpenses = useMemo(() => {
    return expenses.filter(e => isTimestampInCurrentSession(e.date, today));
  }, [expenses, today]);

  const todayPhysicalCashIn = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'in' && (t.paymentMethod === 'Cash' || !t.paymentMethod))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayPhysicalCashOut = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'out' && (t.paymentMethod === 'Cash' || !t.paymentMethod))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayPhysicalCashExpenses = useMemo(() => {
    return todayExpenses
      .filter(e => e.paymentMethod === 'Cash' || !e.paymentMethod)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayPhysicalCashBalance = useMemo(() => {
    return todayPhysicalCashIn - todayPhysicalCashOut - todayPhysicalCashExpenses;
  }, [todayPhysicalCashIn, todayPhysicalCashOut, todayPhysicalCashExpenses]);

  const todayUpiIn = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'in' && t.paymentMethod === 'UPI/Digital')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayUpiOut = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'out' && t.paymentMethod === 'UPI/Digital')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayUpiExpenses = useMemo(() => {
    return todayExpenses
      .filter(e => e.paymentMethod === 'UPI/Digital')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayUpiBalance = useMemo(() => {
    return todayUpiIn - todayUpiOut - todayUpiExpenses;
  }, [todayUpiIn, todayUpiOut, todayUpiExpenses]);

  const todayBankIn = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'in' && t.paymentMethod === 'Bank Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayBankOut = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'out' && t.paymentMethod === 'Bank Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayBankExpenses = useMemo(() => {
    return todayExpenses
      .filter(e => e.paymentMethod === 'Bank Transfer')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayBankBalance = useMemo(() => {
    return todayBankIn - todayBankOut - todayBankExpenses;
  }, [todayBankIn, todayBankOut, todayBankExpenses]);

  const todayCardIn = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'in' && t.paymentMethod === 'Credit/Debit Card')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayCardOut = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'out' && t.paymentMethod === 'Credit/Debit Card')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayCardExpenses = useMemo(() => {
    return todayExpenses
      .filter(e => e.paymentMethod === 'Credit/Debit Card')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayCardBalance = useMemo(() => {
    return todayCardIn - todayCardOut - todayCardExpenses;
  }, [todayCardIn, todayCardOut, todayCardExpenses]);

  const todayCashInAmount = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayCashOutAmount = useMemo(() => {
    return todayCashTransactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayCashTransactions]);

  const todayExpensesAmount = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayTotalBalance = useMemo(() => {
    return todayPhysicalCashBalance + todayUpiBalance + todayBankBalance + todayCardBalance;
  }, [todayPhysicalCashBalance, todayUpiBalance, todayBankBalance, todayCardBalance]);

  const pendingChipOrdersCount = useMemo(() => {
    return chipRequests.filter(r => r.status === 'pending').length;
  }, [chipRequests]);

  // ── GATE CASH COLLECTION & HANDOVER METRICS ───────
  const todayApprovedDoorCount = useMemo(() => {
    return todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  }, [todayCheckIns]);

  // Total Door collections across all payment channels
  const todayGateCollected = useMemo(() => {
    return todayApprovedDoorCount * 500;
  }, [todayApprovedDoorCount]);

  // Physical Cash collected at gate (held in Gate Till drawer)
  const todayGateCashCollected = useMemo(() => {
    return todayCheckIns
      .filter(c => c.verificationStatus === 'approved' && (!c.paymentMethod || c.paymentMethod === 'Cash'))
      .length * 500;
  }, [todayCheckIns]);

  // UPI/QR collected at gate (goes directly to Central Club Bank Account)
  const todayGateUpiCollected = useMemo(() => {
    return todayCheckIns
      .filter(c => c.verificationStatus === 'approved' && c.paymentMethod === 'UPI/Digital')
      .length * 500;
  }, [todayCheckIns]);

  // Bank Wire collected at gate (goes directly to Central Club Bank Account)
  const todayGateBankCollected = useMemo(() => {
    return todayCheckIns
      .filter(c => c.verificationStatus === 'approved' && c.paymentMethod === 'Bank Transfer')
      .length * 500;
  }, [todayCheckIns]);

  const todayGateTransfers = useMemo(() => {
    return gateTransfers.filter(t => isTimestampInCurrentSession(t.timestamp, today));
  }, [gateTransfers, today]);

  const todayGateTransferredAmount = useMemo(() => {
    return todayGateTransfers.reduce((sum, t) => sum + t.amount, 0);
  }, [todayGateTransfers]);

  // Physical Cash currently remaining in Gate Till
  const todayGateCashInHand = useMemo(() => {
    return Math.max(0, todayGateCashCollected - todayGateTransferredAmount);
  }, [todayGateCashCollected, todayGateTransferredAmount]);

  const allTimeGateCollected = useMemo(() => {
    return checkIns.filter(c => c.verificationStatus === 'approved').length * 500;
  }, [checkIns]);

  const allTimeGateTransferred = useMemo(() => {
    return gateTransfers.reduce((sum, t) => sum + t.amount, 0);
  }, [gateTransfers]);

  const allTimeGateCashInHand = useMemo(() => {
    const allTimeCashCollected = checkIns
      .filter(c => c.verificationStatus === 'approved' && (!c.paymentMethod || c.paymentMethod === 'Cash'))
      .length * 500;
    return Math.max(0, allTimeCashCollected - allTimeGateTransferred);
  }, [checkIns, allTimeGateTransferred]);

  const hasPlayerCheckedInToday = (playerId: string) => {
    return checkIns.find(c => c.playerId === playerId && c.checkInDate === today);
  };

  // PLAYER ACTIONS
  const registerNewPlayer = (kycData: Omit<PlayerKYC, 'submittedAt'>) => {
    const newId = generateSequentialPlayerId(players);
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toTimeString().split(' ')[0];

    // Guarantee a valid ISO date for PostgreSQL DATE column (YYYY-MM-DD)
    let cleanDob = (kycData.dateOfBirth || '').trim();
    if (!cleanDob || cleanDob.length < 8 || isNaN(new Date(cleanDob).getTime())) {
      cleanDob = '2000-01-01';
    } else {
      try {
        cleanDob = new Date(cleanDob).toISOString().split('T')[0];
      } catch {
        cleanDob = '2000-01-01';
      }
    }

    const aadhaarClean = (kycData.aadhaarNumber || '').trim();
    const panClean = (kycData.panNumber || '').trim();
    const combinedGovtIdNumber = panClean && aadhaarClean
      ? `PAN: ${panClean} | Aadhaar: ${aadhaarClean}`
      : (panClean || aadhaarClean || kycData.govtIdNumber || 'KYC-PENDING').trim();

    const completeKYC: PlayerKYC = {
      fullName: (kycData.fullName || 'Member Player').trim(),
      phone: (kycData.phone || '+91 99999 99999').trim(),
      email: (kycData.email || 'player@club-restraddle.com').trim(),
      dateOfBirth: cleanDob,
      aadhaarNumber: aadhaarClean,
      panNumber: panClean,
      aadhaarPhotoUrl: kycData.aadhaarPhotoUrl,
      aadhaarBackPhotoUrl: kycData.aadhaarBackPhotoUrl,
      panPhotoUrl: kycData.panPhotoUrl,
      govtIdType: 'Aadhaar & PAN Card',
      govtIdNumber: combinedGovtIdNumber,
      address: (kycData.address || 'Delhi NCR, India').trim(),
      emergencyContactName: (kycData.emergencyContactName || '').trim(),
      emergencyContactPhone: (kycData.emergencyContactPhone || '').trim(),
      phoneVerified: kycData.phoneVerified ?? false,
      phoneVerifiedAt: kycData.phoneVerifiedAt,
      photoUrl: kycData.photoUrl?.startsWith('data:image/svg')
        ? kycData.photoUrl
        : cartoonAvatarForPlayer(newId),
      agreedToRules: kycData.agreedToRules ?? true,
      submittedAt: nowIso,
    };

    const newPlayer: Player = {
      id: newId,
      memberNumber: players.reduce((max, player) => Math.max(max, player.memberNumber || 0), 0) + 1,
      fullName: completeKYC.fullName,
      phone: completeKYC.phone,
      email: completeKYC.email,
      membershipTier: 'Standard',
      kycStatus: 'pending',
      phoneVerified: completeKYC.phoneVerified,
      phoneVerifiedAt: completeKYC.phoneVerifiedAt,
      kyc: completeKYC,
      registeredAt: nowIso,
      totalVisits: 1,
    };

    const newCheckIn: DailyCheckIn = {
      id: generateSequentialCheckInId(checkIns),
      playerId: newId,
      playerName: completeKYC.fullName,
      playerPhone: completeKYC.phone,
      checkInDate: today,
      checkInTime: nowTime,
      verificationStatus: 'pending',
    };

    const nextPlayers = [newPlayer, ...players.filter(p => p.id !== newId)];
    const nextCheckIns = [newCheckIn, ...checkIns.filter(c => c.id !== newCheckIn.id)];

    setPlayers(nextPlayers);
    setCheckIns(nextCheckIns);
    setSelectedPlayerIdState(newId);

    saveToStorage(STORAGE_KEYS.PLAYERS, nextPlayers);
    saveToStorage(STORAGE_KEYS.CHECK_INS, nextCheckIns);
    broadcastUpdate('PLAYERS_UPDATED', nextPlayers);
    broadcastUpdate('NEW_CHECK_IN', newCheckIn);
    broadcastUpdate('CHECK_INS_UPDATED', nextCheckIns);

    // Sync to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('players')
        .upsert(playerToDatabaseRow(newPlayer), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase player registration upsert error:', error.message);
          } else {
            console.log('Player registration synced to Supabase:', newPlayer.id);
          }
        });

      supabase
        .from('daily_check_ins')
        .upsert({
          id: newCheckIn.id,
          player_id: newCheckIn.playerId,
          player_name: newCheckIn.playerName,
          player_phone: newCheckIn.playerPhone,
          check_in_date: newCheckIn.checkInDate,
          check_in_time: newCheckIn.checkInTime,
          verification_status: newCheckIn.verificationStatus,
          created_at: nowIso,
        }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase check-in upsert error:', error.message);
          } else {
            console.log('Daily check-in synced to Supabase:', newCheckIn.id);
          }
        });
    }

    addAuditLog(
      'Player',
      'New Player Registration + KYC',
      `Registered member ${completeKYC.fullName} (${newId}) with ${completeKYC.govtIdType}. Daily check-in generated.`
    );

    return { player: newPlayer, checkIn: newCheckIn };
  };

  const lookupMemberByPhone = async (phoneOrIdOrScan: string): Promise<Player | null> => {
    const cleanQuery = phoneOrIdOrScan.trim();
    if (!cleanQuery) return null;
    const cleanDigits = cleanQuery.replace(/\D/g, '');

    // 1. Check local in-memory players state
    const localMatch = players.find(p => {
      const pDigits = p.phone.replace(/\D/g, '');
      return (
        p.id.toLowerCase() === cleanQuery.toLowerCase() ||
        String(p.memberNumber || '') === cleanQuery ||
        (cleanDigits.length >= 4 && pDigits.includes(cleanDigits)) ||
        p.fullName.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        p.email.toLowerCase() === cleanQuery.toLowerCase()
      );
    });

    if (localMatch) {
      setSelectedPlayerId(localMatch.id);
      return localMatch;
    }

    // Check if query is a check-in ID in memory
    const checkInMatch = checkIns.find(c => c.id.toLowerCase() === cleanQuery.toLowerCase());
    if (checkInMatch) {
      const p = players.find(x => x.id === checkInMatch.playerId);
      if (p) {
        setSelectedPlayerId(p.id);
        return p;
      }
    }

    // 2. Query Supabase PostgreSQL live table if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const tenDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
        const orConditions = [
          `id.ilike.%${cleanQuery}%`,
          `phone.ilike.%${cleanQuery}%`,
          `full_name.ilike.%${cleanQuery}%`,
          `email.ilike.%${cleanQuery}%`,
          `govt_id_number.ilike.%${cleanQuery}%`,
        ];
        if (tenDigits.length >= 4 && tenDigits !== cleanQuery) {
          orConditions.push(`phone.ilike.%${tenDigits}%`);
        }

        const { data, error } = await supabase
          .from('players')
          .select('*')
          .or(orConditions.join(','))
          .limit(1);

        if (!error && data && data.length > 0) {
          const p = data[0];
          const mappedPlayer: Player = {
            id: p.id,
            fullName: p.full_name || 'Member Player',
            phone: p.phone || '',
            email: p.email || '',
            membershipTier: p.membership_tier || 'Standard',
            kycStatus: p.kyc_status || 'pending',
            registeredAt: p.created_at || new Date().toISOString(),
            totalVisits: p.total_visits || 1,
            notes: p.notes,
            kyc: {
              fullName: p.full_name || 'Member Player',
              phone: p.phone || '',
              email: p.email || '',
              dateOfBirth: p.date_of_birth || '1995-01-01',
              aadhaarNumber: p.aadhaar_number,
              panNumber: p.pan_number,
              aadhaarPhotoUrl: p.aadhaar_photo_url,
              aadhaarBackPhotoUrl: p.aadhaar_back_photo_url,
              panPhotoUrl: p.pan_photo_url,
              govtIdType: p.govt_id_type || 'Aadhaar Card',
              govtIdNumber: p.govt_id_number || 'KYC-PENDING',
              address: p.address || 'Delhi NCR, India',
              emergencyContactName: p.emergency_contact_name || '',
              emergencyContactPhone: p.emergency_contact_phone || '',
              photoUrl: p.photo_url || cartoonAvatarForPlayer(p.id || p.full_name || 'member'),
              agreedToRules: p.agreed_to_rules ?? true,
              submittedAt: p.created_at || new Date().toISOString(),
              verifiedAt: p.verified_at,
              verifiedBy: p.verified_by,
              rejectionReason: p.rejection_reason,
            },
          };

          setPlayers(prev => {
            if (prev.some(existing => existing.id === mappedPlayer.id)) return prev;
            const nextMemberNumber = prev.reduce(
              (max, player) => Math.max(max, player.memberNumber || 0),
              0
            ) + 1;
            return [{ ...mappedPlayer, memberNumber: nextMemberNumber }, ...prev];
          });
          setSelectedPlayerId(mappedPlayer.id);
          return mappedPlayer;
        }

        // Query daily_check_ins table as fallback
        const { data: chkData } = await supabase
          .from('daily_check_ins')
          .select('*')
          .or(`id.ilike.%${cleanQuery}%,player_id.ilike.%${cleanQuery}%,player_phone.ilike.%${cleanQuery}%`)
          .limit(1);

        if (chkData && chkData.length > 0) {
          const chk = chkData[0];
          const mappedCheckIn: DailyCheckIn = {
            id: chk.id,
            playerId: chk.player_id,
            playerName: chk.player_name || 'Member Player',
            playerPhone: chk.player_phone || '',
            checkInDate: chk.check_in_date || getTodayDateString(),
            checkInTime: chk.check_in_time || '18:00:00',
            verificationStatus: chk.verification_status || 'pending',
            verifiedBy: chk.verified_by,
            verifiedAt: chk.verified_at,
            rejectionReason: chk.rejection_reason,
          };
          setCheckIns(prev => {
            if (prev.some(c => c.id === mappedCheckIn.id)) return prev;
            return [mappedCheckIn, ...prev];
          });

          // Fetch the player for this check-in
          const { data: pData } = await supabase.from('players').select('*').eq('id', chk.player_id).limit(1);
          if (pData && pData.length > 0) {
            const p = pData[0];
            const mappedPlayer: Player = {
              id: p.id,
              fullName: p.full_name || 'Member Player',
              phone: p.phone || '',
              email: p.email || '',
              membershipTier: p.membership_tier || 'Standard',
              kycStatus: p.kyc_status || 'pending',
              registeredAt: p.created_at || new Date().toISOString(),
              totalVisits: p.total_visits || 1,
              notes: p.notes,
              kyc: {
                fullName: p.full_name || 'Member Player',
                phone: p.phone || '',
                email: p.email || '',
                dateOfBirth: p.date_of_birth || '1995-01-01',
                aadhaarNumber: p.aadhaar_number,
                panNumber: p.pan_number,
                aadhaarPhotoUrl: p.aadhaar_photo_url,
                aadhaarBackPhotoUrl: p.aadhaar_back_photo_url,
                panPhotoUrl: p.pan_photo_url,
                govtIdType: p.govt_id_type || 'Aadhaar Card',
                govtIdNumber: p.govt_id_number || 'KYC-PENDING',
                address: p.address || 'Delhi NCR, India',
                emergencyContactName: p.emergency_contact_name || '',
                emergencyContactPhone: p.emergency_contact_phone || '',
                photoUrl: p.photo_url || cartoonAvatarForPlayer(p.id || p.full_name || 'member'),
                agreedToRules: p.agreed_to_rules ?? true,
                submittedAt: p.created_at || new Date().toISOString(),
                verifiedAt: p.verified_at,
                verifiedBy: p.verified_by,
                rejectionReason: p.rejection_reason,
              },
            };

            setPlayers(prev => {
              if (prev.some(existing => existing.id === mappedPlayer.id)) return prev;
              const nextMemberNumber = prev.reduce(
                (max, player) => Math.max(max, player.memberNumber || 0),
                0
              ) + 1;
              return [{ ...mappedPlayer, memberNumber: nextMemberNumber }, ...prev];
            });
            setSelectedPlayerId(mappedPlayer.id);
            return mappedPlayer;
          }
        }
      } catch (err) {
        console.error('Error fetching player by phone/ID from Supabase:', err);
      }
    }

    return null;
  };

  const findMemberByPhone = async (phoneOrIdOrScan: string): Promise<Player | null> => {
    const cleanQuery = phoneOrIdOrScan.trim();
    if (!cleanQuery) return null;
    const cleanDigits = cleanQuery.replace(/\D/g, '');

    // 1. Check local in-memory players
    const localMatch = players.find(p => {
      const pDigits = p.phone.replace(/\D/g, '');
      return (
        p.id.toLowerCase() === cleanQuery.toLowerCase() ||
        (cleanDigits.length >= 4 && pDigits.includes(cleanDigits)) ||
        p.fullName.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        p.email.toLowerCase() === cleanQuery.toLowerCase()
      );
    });

    if (localMatch) return localMatch;

    // Check check-in match
    const checkInMatch = checkIns.find(c => c.id.toLowerCase() === cleanQuery.toLowerCase());
    if (checkInMatch) {
      const p = players.find(x => x.id === checkInMatch.playerId);
      if (p) return p;
    }

    // 2. Query Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const tenDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
        const orConditions = [
          `id.ilike.%${cleanQuery}%`,
          `phone.ilike.%${cleanQuery}%`,
          `full_name.ilike.%${cleanQuery}%`,
          `email.ilike.%${cleanQuery}%`,
        ];
        if (tenDigits.length >= 4 && tenDigits !== cleanQuery) {
          orConditions.push(`phone.ilike.%${tenDigits}%`);
        }

        const { data, error } = await supabase
          .from('players')
          .select('*')
          .or(orConditions.join(','))
          .limit(1);

        if (!error && data && data.length > 0) {
          const p = data[0];
          const mappedPlayer: Player = {
            id: p.id,
            fullName: p.full_name || 'Member Player',
            phone: p.phone || '',
            email: p.email || '',
            membershipTier: p.membership_tier || 'Standard',
            kycStatus: p.kyc_status || 'pending',
            registeredAt: p.created_at || new Date().toISOString(),
            totalVisits: p.total_visits || 1,
            notes: p.notes,
            kyc: {
              fullName: p.full_name || 'Member Player',
              phone: p.phone || '',
              email: p.email || '',
              dateOfBirth: p.date_of_birth || '1995-01-01',
              aadhaarNumber: p.aadhaar_number,
              panNumber: p.pan_number,
              aadhaarPhotoUrl: p.aadhaar_photo_url,
              aadhaarBackPhotoUrl: p.aadhaar_back_photo_url,
              panPhotoUrl: p.pan_photo_url,
              govtIdType: p.govt_id_type || 'Aadhaar & PAN Card',
              govtIdNumber: p.govt_id_number || 'KYC-PENDING',
              address: p.address || 'Delhi NCR, India',
              emergencyContactName: p.emergency_contact_name || '',
              emergencyContactPhone: p.emergency_contact_phone || '',
              photoUrl: p.photo_url || cartoonAvatarForPlayer(p.id || p.full_name || 'member'),
              agreedToRules: p.agreed_to_rules ?? true,
              submittedAt: p.created_at || new Date().toISOString(),
              verifiedAt: p.verified_at,
              verifiedBy: p.verified_by,
              rejectionReason: p.rejection_reason,
            },
          };
          return mappedPlayer;
        }
      } catch (err) {
        console.error('Error in findMemberByPhone Supabase lookup:', err);
      }
    }

    return null;
  };

  const requestBuyChips = (params: {
    playerId: string;
    amount: number;
    tableNumber: string;
    seatNumber: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): ChipRequest => {
    const player = players.find(p => p.id === params.playerId);
    const nowIso = new Date().toISOString();
    const newId = generateSequentialChipId(chipRequests);

    const newRequest: ChipRequest = {
      id: newId,
      playerId: params.playerId,
      playerName: player ? player.fullName : 'Club Player',
      playerPhone: player ? player.phone : '',
      amount: params.amount,
      chipsQuantity: params.amount,
      tableNumber: params.tableNumber || 'Table 1',
      seatNumber: params.seatNumber || 'Seat 1',
      paymentMethod: params.paymentMethod,
      status: 'pending',
      requestedAt: nowIso,
      notes: params.notes,
    };

    setChipRequests(prev => {
      const next = [newRequest, ...prev];
      broadcastUpdate('NEW_CHIP_ORDER', newRequest);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const dbClient = supabase;
      // Ensure player row exists in database before inserting foreign key
      if (player) {
        dbClient.from('players').upsert(playerToDatabaseRow(player), { onConflict: 'id' }).then(({ error: playerError }) => {
          if (playerError) {
            console.error('Failed to sync player before chip request:', playerError.message);
            return;
          }
          dbClient.from('chip_requests').insert({
            id: newRequest.id,
            player_id: newRequest.playerId,
            player_name: newRequest.playerName,
            player_phone: newRequest.playerPhone,
            amount: newRequest.amount,
            chips_quantity: newRequest.chipsQuantity,
            table_number: newRequest.tableNumber,
            seat_number: newRequest.seatNumber,
            payment_method: newRequest.paymentMethod,
            status: newRequest.status,
            requested_at: newRequest.requestedAt,
            notes: newRequest.notes,
          }).then(({ error }) => {
            if (error) {
              console.error('Failed to save chip request to Supabase:', error.message);
            } else {
              console.log('Chip request successfully saved to Supabase:', newRequest.id);
            }
          });
        });
      } else {
        dbClient.from('chip_requests').insert({
          id: newRequest.id,
          player_id: newRequest.playerId,
          player_name: newRequest.playerName,
          player_phone: newRequest.playerPhone,
          amount: newRequest.amount,
          chips_quantity: newRequest.chipsQuantity,
          table_number: newRequest.tableNumber,
          seat_number: newRequest.seatNumber,
          payment_method: newRequest.paymentMethod,
          status: newRequest.status,
          requested_at: newRequest.requestedAt,
          notes: newRequest.notes,
        }).then(({ error }) => {
          if (error) {
            console.error('Failed to save chip request to Supabase:', error.message);
          } else {
            console.log('Chip request successfully saved to Supabase:', newRequest.id);
          }
        });
      }
    }

    addAuditLog(
      'Player',
      'Table Chip Purchase Requested',
      `Player ${newRequest.playerName} requested ₹${newRequest.amount} in chips at ${newRequest.tableNumber}, ${newRequest.seatNumber} (${newRequest.paymentMethod}).`
    );

    return newRequest;
  };

  const performDailyCheckIn = (playerId: string): DailyCheckIn => {
    const existingCheckIn = hasPlayerCheckedInToday(playerId);
    if (existingCheckIn) {
      return existingCheckIn;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found.`);
    }

    const nowTime = new Date().toTimeString().split(' ')[0];

    const newCheckIn: DailyCheckIn = {
      id: generateSequentialCheckInId(checkIns),
      playerId: player.id,
      playerName: player.fullName,
      playerPhone: player.phone,
      checkInDate: today,
      checkInTime: nowTime,
      verificationStatus: 'pending',
    };

    setCheckIns(prev => {
      const next = [newCheckIn, ...prev];
      broadcastUpdate('NEW_CHECK_IN', newCheckIn);
      broadcastUpdate('CHECK_INS_UPDATED', next);
      return next;
    });
    setPlayers(prev => {
      const next = prev.map(p => (p.id === playerId ? { ...p, totalVisits: p.totalVisits + 1 } : p));
      broadcastUpdate('PLAYERS_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const dbClient = supabase;
      dbClient.from('players').upsert({
        ...playerToDatabaseRow(player),
        total_visits: player.totalVisits + 1,
      }, { onConflict: 'id' }).then(({ error: playerError }) => {
        if (playerError) {
          console.error('Supabase player check-in sync error:', playerError.message);
          return;
        }
        dbClient.from('daily_check_ins').insert({
          id: newCheckIn.id,
          player_id: newCheckIn.playerId,
          player_name: newCheckIn.playerName,
          player_phone: newCheckIn.playerPhone,
          check_in_date: newCheckIn.checkInDate,
          check_in_time: newCheckIn.checkInTime,
          verification_status: newCheckIn.verificationStatus,
        }).then(({ error }) => {
          if (error) console.error('Supabase daily_check_ins insert error:', error.message);
          else console.log('Daily check-in saved to database:', newCheckIn.id);
        });
      });
    }

    addAuditLog(
      'Player',
      'Daily Check-in',
      `Daily check-in completed for ${player.fullName} (${player.id}) at ${nowTime}. Awaiting security clearance.`
    );

    return newCheckIn;
  };

  const updatePlayerKYC = (playerId: string, updatedKYC: Partial<PlayerKYC>) => {
    const nowIso = new Date().toISOString();
    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            kycStatus: 'pending' as const,
            kyc: {
              ...p.kyc,
              ...updatedKYC,
              submittedAt: nowIso,
              rejectionReason: undefined,
            },
          };
        }
        return p;
      });
      broadcastUpdate('PLAYERS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.PLAYERS, next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {
        kyc_status: 'pending',
        rejection_reason: null,
      };
      if (updatedKYC.fullName) dbUpdates.full_name = updatedKYC.fullName;
      if (updatedKYC.phone) dbUpdates.phone = updatedKYC.phone;
      if (updatedKYC.email) dbUpdates.email = updatedKYC.email;
      if (updatedKYC.dateOfBirth) dbUpdates.date_of_birth = updatedKYC.dateOfBirth;
      if (updatedKYC.govtIdType) dbUpdates.govt_id_type = updatedKYC.govtIdType;
      if (updatedKYC.govtIdNumber) dbUpdates.govt_id_number = updatedKYC.govtIdNumber;
      if (updatedKYC.aadhaarNumber !== undefined) dbUpdates.aadhaar_number = updatedKYC.aadhaarNumber || null;
      if (updatedKYC.panNumber !== undefined) dbUpdates.pan_number = updatedKYC.panNumber || null;
      if (updatedKYC.aadhaarPhotoUrl !== undefined) dbUpdates.aadhaar_photo_url = updatedKYC.aadhaarPhotoUrl || null;
      if (updatedKYC.aadhaarBackPhotoUrl !== undefined) dbUpdates.aadhaar_back_photo_url = updatedKYC.aadhaarBackPhotoUrl || null;
      if (updatedKYC.panPhotoUrl !== undefined) dbUpdates.pan_photo_url = updatedKYC.panPhotoUrl || null;
      if (updatedKYC.address) dbUpdates.address = updatedKYC.address;
      if (updatedKYC.emergencyContactName) dbUpdates.emergency_contact_name = updatedKYC.emergencyContactName;
      if (updatedKYC.emergencyContactPhone) dbUpdates.emergency_contact_phone = updatedKYC.emergencyContactPhone;
      if (updatedKYC.photoUrl) dbUpdates.photo_url = updatedKYC.photoUrl;

      supabase.from('players').update(dbUpdates).eq('id', playerId).then(({ error }) => {
        if (error) console.error('Supabase updatePlayerKYC error:', error.message);
      });
    }

    addAuditLog('Player', 'KYC Resubmitted', `Player ${playerId} re-submitted KYC verification information.`);
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === playerId) {
          const updated = { ...p, ...updates };
          if (updates.kyc) {
            updated.kyc = { ...p.kyc, ...updates.kyc };
          }
          return updated;
        }
        return p;
      });
      broadcastUpdate('PLAYERS_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const p = updates;
      supabase.from('players').update({
        ...(p.memberNumber !== undefined ? { member_number: p.memberNumber } : {}),
        ...(p.fullName ? { full_name: p.fullName } : {}),
        ...(p.phone ? { phone: p.phone } : {}),
        ...(p.email ? { email: p.email } : {}),
        ...(p.membershipTier ? { membership_tier: p.membershipTier } : {}),
        ...(p.kycStatus ? { kyc_status: p.kycStatus } : {}),
        ...(p.phoneVerified !== undefined ? { phone_verified: p.phoneVerified } : {}),
        ...(p.phoneVerifiedAt !== undefined ? { phone_verified_at: p.phoneVerifiedAt } : {}),
        ...(p.totalVisits !== undefined ? { total_visits: p.totalVisits } : {}),
        ...(p.notes !== undefined ? { notes: p.notes } : {}),
        ...(p.kyc?.phoneVerified !== undefined ? { phone_verified: p.kyc.phoneVerified } : {}),
        ...(p.kyc?.phoneVerifiedAt !== undefined ? { phone_verified_at: p.kyc.phoneVerifiedAt } : {}),
        ...(p.kyc?.dateOfBirth !== undefined ? { date_of_birth: p.kyc.dateOfBirth } : {}),
        ...(p.kyc?.govtIdType !== undefined ? { govt_id_type: p.kyc.govtIdType === 'Aadhaar & PAN Card' ? 'Aadhaar Card' : p.kyc.govtIdType } : {}),
        ...(p.kyc?.govtIdNumber !== undefined ? { govt_id_number: p.kyc.govtIdNumber } : {}),
        ...(p.kyc?.aadhaarNumber !== undefined ? { aadhaar_number: p.kyc.aadhaarNumber || null } : {}),
        ...(p.kyc?.panNumber !== undefined ? { pan_number: p.kyc.panNumber || null } : {}),
        ...(p.kyc?.aadhaarPhotoUrl !== undefined ? { aadhaar_photo_url: p.kyc.aadhaarPhotoUrl || null } : {}),
        ...(p.kyc?.aadhaarBackPhotoUrl !== undefined ? { aadhaar_back_photo_url: p.kyc.aadhaarBackPhotoUrl || null } : {}),
        ...(p.kyc?.panPhotoUrl !== undefined ? { pan_photo_url: p.kyc.panPhotoUrl || null } : {}),
        ...(p.kyc?.address !== undefined ? { address: p.kyc.address } : {}),
        ...(p.kyc?.emergencyContactName !== undefined ? { emergency_contact_name: p.kyc.emergencyContactName || null } : {}),
        ...(p.kyc?.emergencyContactPhone !== undefined ? { emergency_contact_phone: p.kyc.emergencyContactPhone || null } : {}),
        ...(p.kyc?.photoUrl !== undefined ? { photo_url: p.kyc.photoUrl || null } : {}),
        ...(p.kyc?.agreedToRules !== undefined ? { agreed_to_rules: p.kyc.agreedToRules } : {}),
        ...(p.kyc?.verifiedAt !== undefined ? { verified_at: p.kyc.verifiedAt || null } : {}),
        ...(p.kyc?.verifiedBy !== undefined ? { verified_by: p.kyc.verifiedBy || null } : {}),
        ...(p.kyc?.rejectionReason !== undefined ? { rejection_reason: p.kyc.rejectionReason || null } : {}),
      }).eq('id', playerId).then(({ error }) => {
        if (error) console.error('Supabase player update error:', error.message);
      });
    }

    addAuditLog('Admin', 'Player Profile Updated', `Updated member profile for ${playerId}.`);
  };

  const deletePlayer = (playerId: string) => {
    const p = players.find(x => x.id === playerId);
    const pName = p?.fullName?.trim().toLowerCase();
    const pPhone = p?.phone?.trim();
    const playerEntries = entries.filter(entry => entry.playerId === playerId || (pName && entry.playerName?.toLowerCase() === pName));
    const receiptNums = new Set(playerEntries.map(e => e.receiptNumber).filter(Boolean));
    const entryIds = new Set(playerEntries.map(e => e.id));

    setPlayers(prev => {
      const next = prev.filter(x => x.id !== playerId);
      broadcastUpdate('PLAYERS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.PLAYERS, next);
      return next;
    });
    setCheckIns(prev => {
      const next = prev.filter(c => 
        c.playerId !== playerId && 
        c.id !== playerId &&
        (!pName || c.playerName?.toLowerCase() !== pName) &&
        (!pPhone || c.playerPhone !== pPhone)
      );
      broadcastUpdate('CHECK_INS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.CHECK_INS, next);
      return next;
    });
    setEntries(prev => {
      const next = prev.filter(entry => 
        entry.playerId !== playerId &&
        (!pName || entry.playerName?.toLowerCase() !== pName)
      );
      broadcastUpdate('ENTRIES_UPDATED', next);
      saveToStorage(STORAGE_KEYS.ENTRIES, next);
      return next;
    });
    setChipRequests(prev => {
      const next = prev.filter(request => 
        request.playerId !== playerId &&
        (!pName || request.playerName?.toLowerCase() !== pName)
      );
      broadcastUpdate('CHIP_REQUESTS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.CHIP_REQUESTS, next);
      return next;
    });
    setCashTransactions(prev => {
      const next = prev.filter(t => 
        (!pName || t.playerName?.toLowerCase() !== pName) &&
        (!receiptNums.has(t.referenceId || '')) &&
        (!entryIds.has(t.referenceId || '')) &&
        (t.referenceId !== playerId)
      );
      broadcastUpdate('CASH_TXNS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.CASH_TXNS, next);
      return next;
    });
    if (selectedPlayerId === playerId) {
      setSelectedPlayerIdState('');
    }

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      void (async () => {
        await Promise.all([
          client.from('daily_check_ins').delete().eq('player_id', playerId),
          client.from('tournament_entries').delete().eq('player_id', playerId),
          client.from('chip_requests').delete().eq('player_id', playerId),
        ]);
        if (p?.fullName) {
          client.from('daily_check_ins').delete().eq('player_name', p.fullName).then(() => {});
          client.from('tournament_entries').delete().eq('player_name', p.fullName).then(() => {});
          client.from('chip_requests').delete().eq('player_name', p.fullName).then(() => {});
        }
        if (pPhone) {
          client.from('daily_check_ins').delete().eq('player_phone', pPhone).then(() => {});
        }
        Array.from(receiptNums).forEach(rec => {
          client.from('cash_transactions').delete().eq('reference_id', rec).then(() => {});
        });
        client.from('cash_transactions').delete().eq('reference_id', playerId).then(() => {});
        const { error } = await client.from('players').delete().eq('id', playerId);
        if (error) console.error('Supabase player delete error:', error.message);
      })();
    }

    addAuditLog('Admin', 'Player Record Deleted', `Removed player member: ${p ? p.fullName : playerId} (${playerId}).`);
  };

  // CASHIER ACTIONS
  const createTournament = (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'createdBy'>): Tournament => {
    let formattedStartTime: string;
    try {
      formattedStartTime = tournamentData.startTime
        ? new Date(tournamentData.startTime).toISOString()
        : new Date().toISOString();
    } catch {
      formattedStartTime = new Date().toISOString();
    }

    const newTournament: Tournament = {
      ...tournamentData,
      startTime: formattedStartTime,
      id: generateId('TRN'),
      createdAt: new Date().toISOString(),
      createdBy: currentStaffUser ? currentStaffUser.fullName : staffName,
    };

    setTournaments(prev => {
      const next = [newTournament, ...prev.filter(t => t.id !== newTournament.id)];
      broadcastUpdate('TOURNAMENTS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.TOURNAMENTS, next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('tournaments').upsert({
        id: newTournament.id,
        name: newTournament.name,
        buy_in_fee: Number(newTournament.buyInFee),
        club_rake: Number(newTournament.clubRake),
        starting_chips: Number(newTournament.startingChips),
        guaranteed_prize_pool: Number(newTournament.guaranteedPrizePool),
        max_seats: Number(newTournament.maxSeats),
        blind_levels_minutes: Number(newTournament.blindLevelsMinutes),
        start_time: newTournament.startTime,
        status: newTournament.status || 'Registering',
        created_by: newTournament.createdBy,
        created_at: newTournament.createdAt,
      }).then(({ error }) => {
        if (error) {
          console.error('Supabase tournament insert error:', error.message);
        } else {
          console.log('Tournament successfully saved to Supabase:', newTournament.id);
        }
      });
    }

    addAuditLog('Cashier', 'Tournament Created', `Created tournament "${newTournament.name}" (Entry Charge: ₹${newTournament.buyInFee} + ₹${newTournament.clubRake}).`);
    return newTournament;
  };

  const updateTournament = (tournamentId: string, updates: Partial<Tournament>) => {
    setTournaments(prev => {
      const next = prev.map(t => (t.id === tournamentId ? { ...t, ...updates } : t));
      broadcastUpdate('TOURNAMENTS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.TOURNAMENTS, next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.buyInFee !== undefined) dbUpdates.buy_in_fee = Number(updates.buyInFee);
      if (updates.clubRake !== undefined) dbUpdates.club_rake = Number(updates.clubRake);
      if (updates.startingChips !== undefined) dbUpdates.starting_chips = Number(updates.startingChips);
      if (updates.guaranteedPrizePool !== undefined) dbUpdates.guaranteed_prize_pool = Number(updates.guaranteedPrizePool);
      if (updates.maxSeats !== undefined) dbUpdates.max_seats = Number(updates.maxSeats);
      if (updates.blindLevelsMinutes !== undefined) dbUpdates.blind_levels_minutes = Number(updates.blindLevelsMinutes);
      if (updates.startTime !== undefined) {
        try {
          dbUpdates.start_time = new Date(updates.startTime).toISOString();
        } catch {
          dbUpdates.start_time = updates.startTime;
        }
      }
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      supabase.from('tournaments').update(dbUpdates).eq('id', tournamentId).then(({ error }) => {
        if (error) console.error('Supabase tournament update error:', error.message);
      });
    }

    addAuditLog('Cashier', 'Tournament Updated', `Updated tournament details for ${tournamentId}.`);
  };

  const deleteTournament = (tournamentId: string) => {
    const trn = tournaments.find(t => t.id === tournamentId);
    const tournamentEntries = entries.filter(e => e.tournamentId === tournamentId);
    const receiptNums = new Set(tournamentEntries.map(e => e.receiptNumber).filter(Boolean));
    const entryIds = new Set(tournamentEntries.map(e => e.id));
    
    // 1. Remove from local state and storage immediately
    setTournaments(prev => {
      const next = prev.filter(t => t.id !== tournamentId);
      broadcastUpdate('TOURNAMENTS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.TOURNAMENTS, next);
      return next;
    });

    // 2. Remove associated entries from local state
    setEntries(prev => {
      const next = prev.filter(e => e.tournamentId !== tournamentId);
      broadcastUpdate('ENTRIES_UPDATED', next);
      saveToStorage(STORAGE_KEYS.ENTRIES, next);
      return next;
    });

    // 3. Remove associated cash transactions
    if (receiptNums.size > 0 || entryIds.size > 0) {
      setCashTransactions(prev => {
        const next = prev.filter(t => !receiptNums.has(t.referenceId || '') && !entryIds.has(t.referenceId || ''));
        broadcastUpdate('CASH_TXNS_UPDATED', next);
        saveToStorage(STORAGE_KEYS.CASH_TXNS, next);
        return next;
      });
    }

    // 4. Delete from Supabase: child entries & cash transactions first, then tournament
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      Array.from(receiptNums).forEach(rec => {
        client.from('cash_transactions').delete().eq('reference_id', rec).then(() => {});
      });
      client.from('tournament_entries').delete().eq('tournament_id', tournamentId).then(() => {
        client.from('tournaments').delete().eq('id', tournamentId).then(({ error }) => {
          if (error) console.error('Supabase tournament delete error:', error.message);
        });
      });
    }

    addAuditLog('Cashier', 'Tournament Deleted', `Deleted tournament: ${trn ? trn.name : tournamentId}.`);
  };

  const registerPlayerForTournament = (params: {
    tournamentId: string;
    playerId: string;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    tableNumber?: string;
    seatNumber?: string;
  }): TournamentEntry => {
    const tournament = tournaments.find(t => t.id === params.tournamentId);
    const player = players.find(p => p.id === params.playerId);

    if (!tournament) throw new Error('Tournament not found');
    if (!player) throw new Error('Player not found');

    const receiptNum = generateReceiptNumber();
    const nowIso = new Date().toISOString();
    const totalAmount = tournament.buyInFee + tournament.clubRake;

    const newEntry: TournamentEntry = {
      id: generateId('ENT'),
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      playerId: player.id,
      playerName: player.fullName,
      playerPhone: player.phone,
      buyInAmount: tournament.buyInFee,
      rakeAmount: tournament.clubRake,
      paymentMethod: params.paymentMethod,
      paymentReference: params.paymentReference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      receiptNumber: receiptNum,
      seatNumber: params.seatNumber,
      tableNumber: params.tableNumber,
      entryStatus: 'Registered',
      registeredAt: nowIso,
      cashierName: currentStaffUser ? currentStaffUser.fullName : staffName,
    };

    const newBalance = currentCashBalance + totalAmount;

    const cashTxn: CashTransaction = {
      id: generateId('CSH'),
      type: 'in',
      category: 'Tournament Entry',
      amount: totalAmount,
      description: `Entry Charge & Service Charge for ${tournament.name} (${player.fullName})`,
      paymentMethod: params.paymentMethod,
      referenceId: receiptNum,
      playerName: player.fullName,
      cashierName: currentStaffUser ? currentStaffUser.fullName : staffName,
      timestamp: nowIso,
      balanceAfter: newBalance,
    };

    setEntries(prev => {
      const next = [newEntry, ...prev];
      broadcastUpdate('ENTRIES_UPDATED', next);
      return next;
    });
    setCashTransactions(prev => {
      const next = [cashTxn, ...prev];
      broadcastUpdate('CASH_TXNS_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const dbClient = supabase;
      void (async () => {
        const { error: tournamentError } = await dbClient.from('tournaments').upsert({
          id: tournament.id,
          name: tournament.name,
          buy_in_fee: tournament.buyInFee,
          club_rake: tournament.clubRake,
          starting_chips: tournament.startingChips,
          guaranteed_prize_pool: tournament.guaranteedPrizePool,
          max_seats: tournament.maxSeats,
          blind_levels_minutes: tournament.blindLevelsMinutes,
          start_time: tournament.startTime,
          status: tournament.status,
          created_by: tournament.createdBy,
          created_at: tournament.createdAt,
        }, { onConflict: 'id' });
        if (tournamentError) {
          console.error('Supabase tournament registration setup error:', tournamentError.message);
          return;
        }
        const [entryResult, cashResult] = await Promise.all([
          dbClient.from('tournament_entries').insert({
          id: newEntry.id,
          tournament_id: newEntry.tournamentId,
          tournament_name: newEntry.tournamentName,
          player_id: newEntry.playerId,
          player_name: newEntry.playerName,
          player_phone: newEntry.playerPhone,
          buy_in_amount: newEntry.buyInAmount,
          rake_amount: newEntry.rakeAmount,
          payment_method: newEntry.paymentMethod,
          payment_reference: newEntry.paymentReference,
          receipt_number: newEntry.receiptNumber,
          seat_number: newEntry.seatNumber,
          table_number: newEntry.tableNumber,
          entry_status: newEntry.entryStatus,
          cashier_name: newEntry.cashierName,
          registered_at: newEntry.registeredAt,
          }),
          dbClient.from('cash_transactions').insert({
          id: cashTxn.id,
          type: cashTxn.type,
          category: cashTxn.category,
          amount: cashTxn.amount,
          description: cashTxn.description,
          payment_method: cashTxn.paymentMethod,
          reference_id: cashTxn.referenceId,
          player_name: cashTxn.playerName,
          cashier_name: cashTxn.cashierName,
          balance_after: cashTxn.balanceAfter,
          timestamp: cashTxn.timestamp,
          }),
        ]);
        if (entryResult.error || cashResult.error) {
          // A bill and its payment ledger row are one operation. Compensate any
          // partial write so Supabase and every portal cannot disagree.
          if (!entryResult.error) await dbClient.from('tournament_entries').delete().eq('id', newEntry.id);
          if (!cashResult.error) await dbClient.from('cash_transactions').delete().eq('id', cashTxn.id);
          setEntries(prev => prev.filter(entry => entry.id !== newEntry.id));
          setCashTransactions(prev => prev.filter(transaction => transaction.id !== cashTxn.id));
          console.error(
            'Supabase tournament billing transaction rolled back:',
            entryResult.error?.message || cashResult.error?.message,
          );
        }
      })().catch((error: unknown) => {
        console.error('Supabase tournament registration error:', error instanceof Error ? error.message : error);
      });
    }

    addAuditLog(
      'Cashier',
      'Tournament Entry & Billing',
      `Registered ${player.fullName} for ${tournament.name}. Collected ₹${totalAmount} via ${params.paymentMethod} (Receipt: ${receiptNum}).`
    );

    return newEntry;
  };

  const addCashReceived = (params: {
    category: CashCategory;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    playerName?: string;
    referenceId?: string;
    persistToSupabase?: boolean;
  }): CashTransaction => {
    const nowIso = new Date().toISOString();
    const newBalance = currentCashBalance + params.amount;

    const newTxn: CashTransaction = {
      id: generateId('CSH'),
      type: 'in',
      category: params.category,
      amount: params.amount,
      description: params.description,
      paymentMethod: params.paymentMethod,
      playerName: params.playerName,
      referenceId: params.referenceId,
      cashierName: currentStaffUser ? currentStaffUser.fullName : staffName,
      timestamp: nowIso,
      balanceAfter: newBalance,
    };

    setCashTransactions(prev => {
      const next = [newTxn, ...prev];
      broadcastUpdate('CASH_TXNS_UPDATED', next);
      return next;
    });

    if (params.persistToSupabase !== false && isSupabaseConfigured && supabase) {
      supabase.from('cash_transactions').insert({
        id: newTxn.id,
        type: newTxn.type,
        category: newTxn.category,
        amount: newTxn.amount,
        description: newTxn.description,
        payment_method: newTxn.paymentMethod,
        reference_id: newTxn.referenceId,
        player_name: newTxn.playerName,
        cashier_name: newTxn.cashierName,
        balance_after: newTxn.balanceAfter,
        timestamp: newTxn.timestamp,
      }).then(({ error }) => {
        if (error) console.error('Supabase cash received insert error:', error.message);
      });
    }

    addAuditLog(
      'Cashier',
      'Cash Received',
      `Received ₹${params.amount} [${params.category}] - ${params.description} (${params.paymentMethod}).`
    );
    return newTxn;
  };

  const addCashGiven = (params: {
    category: CashCategory;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    playerName?: string;
    referenceId?: string;
  }): CashTransaction => {
    const nowIso = new Date().toISOString();
    const newBalance = currentCashBalance - params.amount;

    const newTxn: CashTransaction = {
      id: generateId('CSH'),
      type: 'out',
      category: params.category,
      amount: params.amount,
      description: params.description,
      paymentMethod: params.paymentMethod,
      playerName: params.playerName,
      referenceId: params.referenceId,
      cashierName: currentStaffUser ? currentStaffUser.fullName : staffName,
      timestamp: nowIso,
      balanceAfter: newBalance,
    };

    setCashTransactions(prev => {
      const next = [newTxn, ...prev];
      broadcastUpdate('CASH_TXNS_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('cash_transactions').insert({
        id: newTxn.id,
        type: newTxn.type,
        category: newTxn.category,
        amount: newTxn.amount,
        description: newTxn.description,
        payment_method: newTxn.paymentMethod,
        reference_id: newTxn.referenceId,
        player_name: newTxn.playerName,
        cashier_name: newTxn.cashierName,
        balance_after: newTxn.balanceAfter,
        timestamp: newTxn.timestamp,
      }).then(({ error }) => {
        if (error) console.error('Supabase cash payout insert error:', error.message);
      });
    }

    addAuditLog(
      'Cashier',
      'Cash Given / Payout',
      `Paid out ₹${params.amount} [${params.category}] - ${params.description} (${params.paymentMethod}).`
    );
    return newTxn;
  };

  const updateTournamentStatus = (tournamentId: string, status: Tournament['status']) => {
    setTournaments(prev => {
      const next = prev.map(t => (t.id === tournamentId ? { ...t, status } : t));
      broadcastUpdate('TOURNAMENTS_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('tournaments').update({ status }).eq('id', tournamentId).then(({ error }) => {
        if (error) console.error('Supabase tournament status update error:', error.message);
      });
    }
    addAuditLog('Cashier', 'Tournament Status Updated', `Updated tournament ${tournamentId} status to ${status}.`);
  };

  const fulfillChipRequest = (requestId: string): ChipRequest | undefined => {
    const req = chipRequests.find(r => r.id === requestId);
    // A stale screen or a double click must never charge the same order twice.
    if (!req || req.status !== 'pending') return;

    const nowIso = new Date().toISOString();
    const staff = currentStaffUser ? currentStaffUser.fullName : staffName;
    const receiptNum = generateReceiptNumber();

    const fulfilledRequest: ChipRequest = {
      ...req,
      status: 'delivered',
      fulfilledBy: staff,
      fulfilledAt: nowIso,
      receiptNumber: receiptNum,
    };

    setChipRequests(prev => {
      const next = prev.map(r => r.id === requestId ? fulfilledRequest : r);
      broadcastUpdate('CHIP_REQUESTS_UPDATED', next);
      return next;
    });

    // Automatically record vault cash received
    const paymentTransaction = addCashReceived({
      category: 'Chip Purchase',
      amount: req.amount,
      description: `Table chips delivered to ${req.playerName} at ${req.tableNumber}, ${req.seatNumber}`,
      paymentMethod: req.paymentMethod,
      playerName: req.playerName,
      referenceId: receiptNum,
      persistToSupabase: false,
    });

    if (isSupabaseConfigured && supabase) {
      const dbClient = supabase;
      void Promise.all([
        dbClient.from('chip_requests').update({
          status: 'delivered',
          fulfilled_by: staff,
          fulfilled_at: nowIso,
          receipt_number: receiptNum,
        }).eq('id', requestId).eq('status', 'pending'),
        dbClient.from('cash_transactions').insert({
          id: paymentTransaction.id,
          type: paymentTransaction.type,
          category: paymentTransaction.category,
          amount: paymentTransaction.amount,
          description: paymentTransaction.description,
          payment_method: paymentTransaction.paymentMethod,
          reference_id: paymentTransaction.referenceId,
          player_name: paymentTransaction.playerName,
          cashier_name: paymentTransaction.cashierName,
          balance_after: paymentTransaction.balanceAfter,
          timestamp: paymentTransaction.timestamp,
        }),
      ]).then(async ([requestResult, cashResult]) => {
        if (requestResult.error || cashResult.error) {
          if (!requestResult.error) {
            await dbClient.from('chip_requests').update({
              status: 'pending',
              fulfilled_by: null,
              fulfilled_at: null,
              receipt_number: null,
            }).eq('id', requestId);
          }
          if (!cashResult.error) await dbClient.from('cash_transactions').delete().eq('id', paymentTransaction.id);
          setCashTransactions(prev => prev.filter(transaction => transaction.id !== paymentTransaction.id));
          setChipRequests(prev => prev.map(request => request.id === requestId ? req : request));
          console.error('Supabase chip fulfillment rolled back:', requestResult.error?.message || cashResult.error?.message);
        }
      });
    }

    addAuditLog(
      'Cashier',
      'Table Chips Delivered',
      `Cashier ${staff} fulfilled and delivered ₹${req.amount} in chips to ${req.playerName} at ${req.tableNumber}, ${req.seatNumber} (Receipt: ${receiptNum}).`
    );
    return fulfilledRequest;
  };

  const cancelChipRequest = (requestId: string, reason?: string) => {
    const req = chipRequests.find(r => r.id === requestId);
    // Delivered and already-cancelled orders are immutable financial records.
    if (!req || req.status !== 'pending') return;

    const staff = currentStaffUser ? currentStaffUser.fullName : staffName;
    setChipRequests(prev => {
      const next = prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'cancelled' as const,
              notes: reason || 'Cancelled by cashier',
            }
          : r
      );
      broadcastUpdate('CHIP_REQUESTS_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('chip_requests').update({
        status: 'cancelled',
        notes: reason || 'Cancelled by cashier',
      }).eq('id', requestId).eq('status', 'pending').then(({ error }) => {
        if (error) console.error('Supabase chip request cancellation error:', error.message);
      });
    }

    addAuditLog(
      'Cashier',
      'Table Chip Order Cancelled',
      `Order ${requestId} for ${req.playerName} cancelled by ${staff}. Reason: ${reason || 'N/A'}`
    );
  };

  // SECURITY ACTIONS
  const approvePlayerEntry = (checkInIdOrPlayerId: string, paymentMethod: PaymentMethod = 'Cash') => {
    const nowIso = new Date().toISOString();
    const staff = currentStaffUser ? currentStaffUser.fullName : staffName;
    const nowTime = new Date().toTimeString().split(' ')[0];
    const todayStr = getTodayDateString();

    // 1. Synchronously resolve matching check-in and player
    const existingCheckIn = checkIns.find(
      c => c.id === checkInIdOrPlayerId || (c.playerId === checkInIdOrPlayerId && c.checkInDate === todayStr)
    ) || checkIns.find(c => c.playerId === checkInIdOrPlayerId);

    const targetPlayerId = existingCheckIn ? existingCheckIn.playerId : checkInIdOrPlayerId;
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    const approvedPlayerName = existingCheckIn?.playerName || targetPlayer?.fullName || 'Club Member';
    const isNewCheckIn = !existingCheckIn;
    const targetCheckInId = existingCheckIn ? existingCheckIn.id : generateSequentialCheckInId(checkIns);

    let updatedCheckIn: DailyCheckIn;
    let nextCheckIns: DailyCheckIn[];

    if (existingCheckIn) {
      updatedCheckIn = {
        ...existingCheckIn,
        verificationStatus: 'approved',
        verifiedBy: staff,
        verifiedAt: nowIso,
        paymentMethod,
        rejectionReason: undefined,
      };
      nextCheckIns = checkIns.map(c =>
        c.playerId === targetPlayerId && (c.verificationStatus === 'pending' || c.id === existingCheckIn.id)
          ? {
              ...c,
              verificationStatus: 'approved' as const,
              verifiedBy: staff,
              verifiedAt: nowIso,
              paymentMethod,
              rejectionReason: undefined,
            }
          : c
      );
    } else {
      updatedCheckIn = {
        id: targetCheckInId,
        playerId: targetPlayerId,
        playerName: approvedPlayerName,
        playerPhone: targetPlayer?.phone || '',
        checkInDate: todayStr,
        checkInTime: nowTime,
        verificationStatus: 'approved',
        verifiedBy: staff,
        verifiedAt: nowIso,
        paymentMethod,
      };
      nextCheckIns = [updatedCheckIn, ...checkIns];
    }

    // If payment method is UPI or Bank, credit the common club treasury balance directly!
    if (paymentMethod === 'UPI/Digital' || paymentMethod === 'Bank Transfer') {
      addCashReceived({
        category: 'Gate Entry Fee Transfer',
        amount: 500,
        description: `Door entry fee collected at Gate via ${paymentMethod} for ${approvedPlayerName}`,
        paymentMethod,
        playerName: approvedPlayerName,
        referenceId: targetCheckInId,
      });
    }

    const nextPlayers = players.map(p => {
      if (p.id === targetPlayerId) {
        return {
          ...p,
          kycStatus: 'verified' as const,
          totalVisits: isNewCheckIn ? p.totalVisits + 1 : p.totalVisits,
          kyc: {
            ...p.kyc,
            verifiedAt: nowIso,
            verifiedBy: staff,
            rejectionReason: undefined,
          },
        };
      }
      return p;
    });

    // 2. Commit states synchronously and immediately
    setCheckIns(nextCheckIns);
    setPlayers(nextPlayers);
    saveToStorage(STORAGE_KEYS.CHECK_INS, nextCheckIns);
    saveToStorage(STORAGE_KEYS.PLAYERS, nextPlayers);

    // 3. Broadcast real-time event to all tabs and player windows
    broadcastUpdate('CHECK_INS_UPDATED', nextCheckIns);
    broadcastUpdate('PLAYERS_UPDATED', nextPlayers);
    broadcastUpdate('ENTRY_STATUS_CHANGED', {
      playerId: targetPlayerId,
      checkInId: targetCheckInId,
      status: 'approved',
      verifiedBy: staff,
      verifiedAt: nowIso,
    });

    // 4. Supabase DB persistence
    if (isSupabaseConfigured && supabase) {
      const dbClient = supabase;
      if (isNewCheckIn) {
        dbClient.from('daily_check_ins').insert({
          id: targetCheckInId,
          player_id: targetPlayerId,
          player_name: approvedPlayerName,
          player_phone: targetPlayer?.phone || '',
          check_in_date: todayStr,
          check_in_time: nowTime,
          verification_status: 'approved',
          verified_by: staff,
          verified_at: nowIso,
        }).then(({ error }) => {
          if (error) console.error('Supabase daily_check_ins insert error:', error.message);
        });
      } else {
        const approvalUpdate = {
          verification_status: 'approved',
          verified_by: staff,
          verified_at: nowIso,
          rejection_reason: null,
        };
        void Promise.all([
          dbClient.from('daily_check_ins').update(approvalUpdate).eq('id', targetCheckInId),
          dbClient.from('daily_check_ins').update(approvalUpdate).eq('player_id', targetPlayerId).eq('verification_status', 'pending'),
        ]).then(results => {
          results.forEach(({ error }) => {
            if (error) console.error('Supabase daily_check_ins update error:', error.message);
          });
        });
      }

      dbClient.from('players').update({
        kyc_status: 'verified',
        verified_at: nowIso,
        verified_by: staff,
        rejection_reason: null,
      }).eq('id', targetPlayerId).then(({ error }) => {
        if (error) console.error('Supabase players update error:', error.message);
      });
    }

    addAuditLog(
      'Security',
      'Entry Approved',
      `Officer approved entry for ${approvedPlayerName} (${targetPlayerId}). Access granted.`
    );
  };

  const rejectPlayerEntry = (checkInIdOrPlayerId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    const staff = currentStaffUser ? currentStaffUser.fullName : staffName;
    const nowTime = new Date().toTimeString().split(' ')[0];
    const todayStr = getTodayDateString();

    const existingCheckIn = checkIns.find(
      c => c.id === checkInIdOrPlayerId || (c.playerId === checkInIdOrPlayerId && c.checkInDate === todayStr)
    ) || checkIns.find(c => c.playerId === checkInIdOrPlayerId);

    const targetPlayerId = existingCheckIn ? existingCheckIn.playerId : checkInIdOrPlayerId;
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    const rejectedPlayerName = existingCheckIn?.playerName || targetPlayer?.fullName || 'Club Member';
    const isNewCheckIn = !existingCheckIn;
    const targetCheckInId = existingCheckIn ? existingCheckIn.id : generateSequentialCheckInId(checkIns);

    let updatedCheckIn: DailyCheckIn;
    let nextCheckIns: DailyCheckIn[];

    if (existingCheckIn) {
      updatedCheckIn = {
        ...existingCheckIn,
        verificationStatus: 'rejected',
        verifiedBy: staff,
        verifiedAt: nowIso,
        rejectionReason: reason,
      };
      nextCheckIns = checkIns.map(c =>
        c.playerId === targetPlayerId && (c.verificationStatus === 'pending' || c.id === existingCheckIn.id)
          ? {
              ...c,
              verificationStatus: 'rejected' as const,
              verifiedBy: staff,
              verifiedAt: nowIso,
              rejectionReason: reason,
            }
          : c
      );
    } else {
      updatedCheckIn = {
        id: targetCheckInId,
        playerId: targetPlayerId,
        playerName: rejectedPlayerName,
        playerPhone: targetPlayer?.phone || '',
        checkInDate: todayStr,
        checkInTime: nowTime,
        verificationStatus: 'rejected',
        verifiedBy: staff,
        verifiedAt: nowIso,
        rejectionReason: reason,
      };
      nextCheckIns = [updatedCheckIn, ...checkIns];
    }

    const nextPlayers = players.map(p => {
      if (p.id === targetPlayerId) {
        return {
          ...p,
          kyc: {
            ...p.kyc,
            rejectionReason: reason,
          },
        };
      }
      return p;
    });

    setCheckIns(nextCheckIns);
    setPlayers(nextPlayers);
    saveToStorage(STORAGE_KEYS.CHECK_INS, nextCheckIns);
    saveToStorage(STORAGE_KEYS.PLAYERS, nextPlayers);

    broadcastUpdate('CHECK_INS_UPDATED', nextCheckIns);
    broadcastUpdate('PLAYERS_UPDATED', nextPlayers);
    broadcastUpdate('ENTRY_STATUS_CHANGED', {
      playerId: targetPlayerId,
      checkInId: targetCheckInId,
      status: 'rejected',
      reason,
      verifiedBy: staff,
      verifiedAt: nowIso,
    });

    if (isSupabaseConfigured && supabase) {
      const dbClient = supabase;
      if (isNewCheckIn) {
        dbClient.from('daily_check_ins').insert({
          id: targetCheckInId,
          player_id: targetPlayerId,
          player_name: rejectedPlayerName,
          player_phone: targetPlayer?.phone || '',
          check_in_date: todayStr,
          check_in_time: nowTime,
          verification_status: 'rejected',
          verified_by: staff,
          verified_at: nowIso,
          rejection_reason: reason,
        }).then(({ error }) => {
          if (error) console.error('Supabase daily_check_ins insert error:', error.message);
        });
      } else {
        const rejectionUpdate = {
          verification_status: 'rejected',
          verified_by: staff,
          verified_at: nowIso,
          rejection_reason: reason,
        };
        void Promise.all([
          dbClient.from('daily_check_ins').update(rejectionUpdate).eq('id', targetCheckInId),
          dbClient.from('daily_check_ins').update(rejectionUpdate).eq('player_id', targetPlayerId).eq('verification_status', 'pending'),
        ]).then(results => {
          results.forEach(({ error }) => {
            if (error) console.error('Supabase daily_check_ins update error:', error.message);
          });
        });
      }

      dbClient.from('players').update({
        rejection_reason: reason,
      }).eq('id', targetPlayerId).then(({ error }) => {
        if (error) console.error('Supabase players update error:', error.message);
      });
    }

    addAuditLog(
      'Security',
      'Entry Rejected',
      `Officer rejected entry for ${rejectedPlayerName} (${targetPlayerId}). Reason: ${reason}`
    );
  };

  const reviewKYC = (playerId: string, status: KYCStatus, reason?: string) => {
    const nowIso = new Date().toISOString();
    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            kycStatus: status,
            kyc: {
              ...p.kyc,
              verifiedAt: status === 'verified' ? nowIso : undefined,
              verifiedBy: status === 'verified' ? (currentStaffUser ? currentStaffUser.fullName : staffName) : undefined,
              rejectionReason: status === 'rejected' ? reason : undefined,
            },
          };
        }
        return p;
      });
      broadcastUpdate('PLAYERS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.PLAYERS, next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('players').update({
        kyc_status: status,
        verified_at: status === 'verified' ? nowIso : null,
        verified_by: status === 'verified' ? (currentStaffUser ? currentStaffUser.fullName : staffName) : null,
        rejection_reason: status === 'rejected' ? reason : null,
      }).eq('id', playerId).then(({ error }) => {
        if (error) console.error('Supabase KYC review error:', error.message);
      });
    }

    addAuditLog(
      'Security',
      `KYC ${status.toUpperCase()}`,
      `Security officer updated KYC status for player ${playerId} to ${status}.${reason ? ` Reason: ${reason}` : ''}`
    );
  };

  // GATE CASH COLLECTION & HANDOVER ACTION
  const transferGateCashToCashier = (params: {
    amount: number;
    receivedByCashier: string;
    paymentMethod?: PaymentMethod;
    notes?: string;
  }): GateCashTransfer => {
    const { amount, receivedByCashier, paymentMethod = 'Cash', notes } = params;
    const nowIso = new Date().toISOString();
    const todayStr = getTodayDateString();
    const staff = currentStaffUser ? currentStaffUser.fullName : staffName;
    const transferId = generateSequentialGateTransferId(gateTransfers);
    const receiptNum = generateReceiptNumber();

    const newTransfer: GateCashTransfer = {
      id: transferId,
      transferDate: todayStr,
      amount: Number(amount),
      paymentMethod,
      handedOverBy: staff,
      receivedBy: receivedByCashier,
      timestamp: nowIso,
      receiptNumber: receiptNum,
      notes: notes?.trim() || undefined,
    };

    const nextTransfers = [newTransfer, ...gateTransfers];
    setGateTransfers(nextTransfers);
    saveToStorage(STORAGE_KEYS.GATE_TRANSFERS, nextTransfers);

    // Automatically deposit into Inside Cashier & Main Cash Ledger
    addCashReceived({
      category: 'Gate Cash Handover',
      amount: Number(amount),
      description: `Gate door entry fees handed over from Security (${staff}) to Inside Cashier (${receivedByCashier})${notes ? ` - ${notes}` : ''}`,
      paymentMethod,
      playerName: `Gate Collection Handover (${staff})`,
      referenceId: transferId,
    });

    addAuditLog(
      'Security',
      'Gate Cash Handover to Inside Cashier',
      `Officer ${staff} handed over ₹${Number(amount).toLocaleString()} (${paymentMethod}) to Inside Cashier ${receivedByCashier}. Receipt #${receiptNum}`
    );

    broadcastUpdate('GATE_TRANSFERS_UPDATED', nextTransfers);
    return newTransfer;
  };

  // ADMIN ACTIONS
  const addExpense = (expenseData: Omit<Expense, 'id' | 'recordedBy'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: generateId('EXP'),
      recordedBy: currentStaffUser ? currentStaffUser.fullName : staffName,
    };

    setExpenses(prev => {
      const next = [newExpense, ...prev];
      broadcastUpdate('EXPENSES_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('expenses').insert({
        id: newExpense.id,
        category: newExpense.category,
        amount: newExpense.amount,
        description: newExpense.description,
        paid_to: newExpense.paidTo,
        payment_method: newExpense.paymentMethod,
        date: newExpense.date,
        receipt_number: newExpense.receiptNumber,
        recorded_by: newExpense.recordedBy,
      }).then(({ error }) => {
        if (error) console.error('Supabase expense insert error:', error.message);
      });
    }

    addAuditLog(
      'Admin',
      'Club Expense Recorded',
      `Recorded expense: ₹${newExpense.amount} for "${newExpense.category}" - ${newExpense.description} (Paid to: ${newExpense.paidTo}).`
    );
    return newExpense;
  };

  const updateExpense = (expenseId: string, updates: Partial<Expense>) => {
    setExpenses(prev => {
      const next = prev.map(e => (e.id === expenseId ? { ...e, ...updates } : e));
      broadcastUpdate('EXPENSES_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.paidTo !== undefined) dbUpdates.paid_to = updates.paidTo;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.receiptNumber !== undefined) dbUpdates.receipt_number = updates.receiptNumber;
      if (updates.recordedBy !== undefined) dbUpdates.recorded_by = updates.recordedBy;
      supabase.from('expenses').update(dbUpdates).eq('id', expenseId).then(({ error }) => {
        if (error) console.error('Supabase expense update error:', error.message);
      });
    }

    addAuditLog('Admin', 'Expense Updated', `Updated expense record ${expenseId}.`);
  };

  const deleteExpense = (expenseId: string) => {
    const exp = expenses.find(e => e.id === expenseId);
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== expenseId);
      broadcastUpdate('EXPENSES_UPDATED', next);
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('expenses').delete().eq('id', expenseId).then(({ error }) => {
        if (error) console.error('Supabase expense delete error:', error.message);
      });
    }

    addAuditLog('Admin', 'Expense Deleted', `Deleted expense: ${exp ? `₹${exp.amount} for ${exp.category}` : expenseId}.`);
  };

  const deleteCashTransaction = (transactionId: string) => {
    const txn = cashTransactions.find(t => t.id === transactionId);
    
    // 1. Remove cash transaction from state and localStorage
    setCashTransactions(prev => {
      const next = prev.filter(t => t.id !== transactionId);
      broadcastUpdate('CASH_TXNS_UPDATED', next);
      saveToStorage(STORAGE_KEYS.CASH_TXNS, next);
      return next;
    });

    // 2. If this cash transaction was linked to a Tournament Entry (via referenceId or receiptNumber),
    // also remove the associated tournament entry so cashier logs and admin views stay 100% in sync!
    if (txn) {
      const matchingEntry = entries.find(e => 
        (txn.referenceId && (e.receiptNumber === txn.referenceId || e.id === txn.referenceId)) ||
        (txn.category === 'Tournament Entry' && e.playerName.toLowerCase() === (txn.playerName || '').toLowerCase() && (e.buyInAmount + e.rakeAmount) === txn.amount)
      );

      if (matchingEntry) {
        setEntries(prev => {
          const next = prev.filter(e => e.id !== matchingEntry.id);
          broadcastUpdate('ENTRIES_UPDATED', next);
          saveToStorage(STORAGE_KEYS.ENTRIES, next);
          return next;
        });
        if (isSupabaseConfigured && supabase) {
          supabase.from('tournament_entries').delete().eq('id', matchingEntry.id).then(({ error }) => {
            if (error) console.error('Supabase tournament entry delete error on cash txn delete:', error.message);
          });
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('cash_transactions').delete().eq('id', transactionId).then(({ error }) => {
        if (error) console.error('Supabase cash transaction delete error:', error.message);
      });
    }

    addAuditLog('Admin', 'Cash Transaction Voided', `Voided/Deleted cash transaction: ${txn ? `₹${txn.amount} (${txn.category})` : transactionId}.`);
  };

  const updateTournamentEntry = (entryId: string, updates: Partial<TournamentEntry>) => {
    setEntries(prev => {
      const next = prev.map(e => (e.id === entryId ? { ...e, ...updates } : e));
      broadcastUpdate('ENTRIES_UPDATED', next);
      saveToStorage(STORAGE_KEYS.ENTRIES, next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.tournamentId !== undefined) dbUpdates.tournament_id = updates.tournamentId;
      if (updates.tournamentName !== undefined) dbUpdates.tournament_name = updates.tournamentName;
      if (updates.playerId !== undefined) dbUpdates.player_id = updates.playerId;
      if (updates.playerName !== undefined) dbUpdates.player_name = updates.playerName;
      if (updates.playerPhone !== undefined) dbUpdates.player_phone = updates.playerPhone;
      if (updates.buyInAmount !== undefined) dbUpdates.buy_in_amount = updates.buyInAmount;
      if (updates.rakeAmount !== undefined) dbUpdates.rake_amount = updates.rakeAmount;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.paymentReference !== undefined) dbUpdates.payment_reference = updates.paymentReference;
      if (updates.receiptNumber !== undefined) dbUpdates.receipt_number = updates.receiptNumber;
      if (updates.seatNumber !== undefined) dbUpdates.seat_number = updates.seatNumber;
      if (updates.tableNumber !== undefined) dbUpdates.table_number = updates.tableNumber;
      if (updates.entryStatus !== undefined) dbUpdates.entry_status = updates.entryStatus;
      if (updates.cashierName !== undefined) dbUpdates.cashier_name = updates.cashierName;
      if (updates.registeredAt !== undefined) dbUpdates.registered_at = updates.registeredAt;
      supabase.from('tournament_entries').update(dbUpdates).eq('id', entryId).then(({ error }) => {
        if (error) console.error('Supabase tournament entry update error:', error.message);
      });
    }
    addAuditLog('Cashier', 'Tournament Entry Updated', `Updated registration entry ${entryId}.`);
  };

  const deleteTournamentEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    
    // 1. Remove from entries
    setEntries(prev => {
      const next = prev.filter(e => e.id !== entryId);
      broadcastUpdate('ENTRIES_UPDATED', next);
      saveToStorage(STORAGE_KEYS.ENTRIES, next);
      return next;
    });

    // 2. Also remove associated cash transaction from cashTransactions & Supabase
    if (entry) {
      const matchingTxn = cashTransactions.find(t =>
        (entry.receiptNumber && t.referenceId === entry.receiptNumber) ||
        (t.referenceId === entry.id) ||
        (t.category === 'Tournament Entry' && (t.playerName || '').toLowerCase() === entry.playerName.toLowerCase() && t.amount === (entry.buyInAmount + entry.rakeAmount))
      );
      if (matchingTxn) {
        setCashTransactions(prev => {
          const next = prev.filter(t => t.id !== matchingTxn.id);
          broadcastUpdate('CASH_TXNS_UPDATED', next);
          saveToStorage(STORAGE_KEYS.CASH_TXNS, next);
          return next;
        });
        if (isSupabaseConfigured && supabase) {
          supabase.from('cash_transactions').delete().eq('id', matchingTxn.id).then(({ error }) => {
            if (error) console.error('Supabase cash transaction delete error on entry delete:', error.message);
          });
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('tournament_entries').delete().eq('id', entryId).then(({ error }) => {
        if (error) console.error('Supabase tournament entry delete error:', error.message);
      });
    }
    addAuditLog('Cashier', 'Tournament Entry Removed', `Removed player entry and voided associated billing record: ${entry ? `${entry.playerName} for ${entry.tournamentName}` : entryId}.`);
  };

  const updateChipRequest = (requestId: string, updates: Partial<ChipRequest>) => {
    setChipRequests(prev => {
      const next = prev.map(r => (r.id === requestId ? { ...r, ...updates } : r));
      broadcastUpdate('CHIP_REQUESTS_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.chipsQuantity !== undefined) dbUpdates.chips_quantity = updates.chipsQuantity;
      if (updates.tableNumber !== undefined) dbUpdates.table_number = updates.tableNumber;
      if (updates.seatNumber !== undefined) dbUpdates.seat_number = updates.seatNumber;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.fulfilledBy !== undefined) dbUpdates.fulfilled_by = updates.fulfilledBy;
      if (updates.fulfilledAt !== undefined) dbUpdates.fulfilled_at = updates.fulfilledAt;
      if (updates.receiptNumber !== undefined) dbUpdates.receipt_number = updates.receiptNumber;
      supabase.from('chip_requests').update(dbUpdates).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase chip request update error:', error.message);
      });
    }
    addAuditLog('Cashier', 'Chip Request Updated', `Updated chip order ${requestId}.`);
  };

  const deleteChipRequest = (requestId: string) => {
    setChipRequests(prev => {
      const next = prev.filter(r => r.id !== requestId);
      broadcastUpdate('CHIP_REQUESTS_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('chip_requests').delete().eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase chip request delete error:', error.message);
      });
    }
    addAuditLog('Cashier', 'Chip Request Deleted', `Deleted chip order ${requestId}.`);
  };

  const updateCashTransaction = (transactionId: string, updates: Partial<CashTransaction>) => {
    setCashTransactions(prev => {
      const next = prev.map(t => (t.id === transactionId ? { ...t, ...updates } : t));
      broadcastUpdate('CASH_TXNS_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.referenceId !== undefined) dbUpdates.reference_id = updates.referenceId;
      if (updates.playerName !== undefined) dbUpdates.player_name = updates.playerName;
      if (updates.cashierName !== undefined) dbUpdates.cashier_name = updates.cashierName;
      if (updates.balanceAfter !== undefined) dbUpdates.balance_after = updates.balanceAfter;
      if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
      supabase.from('cash_transactions').update(dbUpdates).eq('id', transactionId).then(({ error }) => {
        if (error) console.error('Supabase cash transaction update error:', error.message);
      });
    }
    addAuditLog('Admin', 'Cash Transaction Updated', `Updated cash ledger entry ${transactionId}.`);
  };

  const updateCheckIn = (checkInId: string, updates: Partial<DailyCheckIn>) => {
    setCheckIns(prev => {
      const next = prev.map(c => (c.id === checkInId ? { ...c, ...updates } : c));
      broadcastUpdate('CHECK_INS_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      const dbUpdates: any = {};
      if (updates.playerId !== undefined) dbUpdates.player_id = updates.playerId;
      if (updates.playerName !== undefined) dbUpdates.player_name = updates.playerName;
      if (updates.playerPhone !== undefined) dbUpdates.player_phone = updates.playerPhone;
      if (updates.checkInDate !== undefined) dbUpdates.check_in_date = updates.checkInDate;
      if (updates.checkInTime !== undefined) dbUpdates.check_in_time = updates.checkInTime;
      if (updates.verificationStatus !== undefined) dbUpdates.verification_status = updates.verificationStatus;
      if (updates.verifiedBy !== undefined) dbUpdates.verified_by = updates.verifiedBy;
      if (updates.verifiedAt !== undefined) dbUpdates.verified_at = updates.verifiedAt;
      if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;
      supabase.from('daily_check_ins').update(dbUpdates).eq('id', checkInId).then(({ error }) => {
        if (error) console.error('Supabase check-in update error:', error.message);
      });
    }
    addAuditLog('Security', 'Check-In Record Updated', `Updated check-in ${checkInId}.`);
  };

  const deleteCheckIn = (checkInId: string) => {
    const checkIn = checkIns.find(c => c.id === checkInId);
    setCheckIns(prev => {
      const next = prev.filter(c => c.id !== checkInId);
      broadcastUpdate('CHECK_INS_UPDATED', next);
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('daily_check_ins').delete().eq('id', checkInId).then(({ error }) => {
        if (error) console.error('Supabase check-in delete error:', error.message);
      });
    }
    addAuditLog('Security', 'Check-In Record Deleted', `Deleted check-in record: ${checkIn ? `${checkIn.playerName} (${checkIn.checkInDate})` : checkInId}.`);
  };

  const deleteAuditLog = (logId: string) => {
    setAuditLogs(prev => prev.filter(l => l.id !== logId));
    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').delete().eq('id', logId).then(({ error }) => {
        if (error) console.error('Supabase audit log delete error:', error.message);
      });
    }
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').delete().neq('id', '').then(({ error }) => {
        if (error) console.error('Supabase audit log clear error:', error.message);
      });
    }
  };

  const resetToDemoData = () => {
    setStaffUsers(initialStaffUsers);
    setCurrentStaffUser(initialStaffUsers[0]);
    setPlayers(initialPlayers);
    setCheckIns(initialCheckIns);
    setTournaments(initialTournaments);
    setEntries(initialEntries);
    setCashTransactions(initialCashTransactions);
    setExpenses(initialExpenses);
    setAuditLogs(initialAuditLogs);
    setChipRequests(initialChipRequests);
    setSelectedPlayerIdState('');

    saveToStorage(STORAGE_KEYS.STAFF_USERS, initialStaffUsers);
    saveToStorage(STORAGE_KEYS.CURRENT_STAFF, initialStaffUsers[0]);
    saveToStorage(STORAGE_KEYS.PLAYERS, initialPlayers);
    saveToStorage(STORAGE_KEYS.CHECK_INS, initialCheckIns);
    saveToStorage(STORAGE_KEYS.TOURNAMENTS, initialTournaments);
    saveToStorage(STORAGE_KEYS.ENTRIES, initialEntries);
    saveToStorage(STORAGE_KEYS.CASH_TXNS, initialCashTransactions);
    saveToStorage(STORAGE_KEYS.EXPENSES, initialExpenses);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    saveToStorage(STORAGE_KEYS.CHIP_REQUESTS, initialChipRequests);
    saveToStorage(STORAGE_KEYS.SELECTED_PLAYER, '');

    broadcastUpdate('SYNC_ALL');
  };

  return (
    <ClubContext.Provider
      value={{
        activeRole,
        setActiveRole,
        selectedPlayerId,
        setSelectedPlayerId,
        staffName,
        setStaffName,
        isRealtimeConnected,
        syncNow,
        staffUsers,
        currentStaffUser,
        loginStaff,
        logoutStaff,
        createStaffUser,
        updateStaffUser,
        deleteStaffUser,
        toggleStaffStatus,
        players,
        checkIns,
        tournaments,
        entries,
        cashTransactions,
        expenses,
        auditLogs,
        chipRequests,
        currentPlayer,
        todayCheckIns,
        pendingChipOrdersCount,
        currentCashBalance,
        physicalCashBalance,
        upiBalance,
        bankBalance,
        cardBalance,
        totalLiquidityBalance,
        physicalCashIn,
        physicalCashOut,
        physicalCashExpenses,
        upiIn,
        upiOut,
        upiExpenses,
        bankIn,
        bankOut,
        bankExpenses,
        cardIn,
        cardOut,
        cardExpenses,
        totalExpensesAmount,
        totalCashInAmount,
        totalCashOutAmount,
        netTreasuryBalance,
        todayCashTransactions,
        todayEntries,
        todayExpenses,
        todayPhysicalCashBalance,
        todayUpiBalance,
        todayBankBalance,
        todayCardBalance,
        todayTotalBalance,
        todayCashInAmount,
        todayCashOutAmount,
        todayExpensesAmount,
        todayPhysicalCashIn,
        todayPhysicalCashOut,
        todayUpiIn,
        todayUpiOut,
        todayBankIn,
        todayBankOut,
        gateTransfers,
        todayApprovedDoorCount,
        todayGateCollected,
        todayGateCashCollected,
        todayGateUpiCollected,
        todayGateBankCollected,
        todayGateTransfers,
        todayGateTransferredAmount,
        todayGateCashInHand,
        allTimeGateCollected,
        allTimeGateTransferred,
        allTimeGateCashInHand,
        transferGateCashToCashier,
        registerNewPlayer,
        performDailyCheckIn,
        updatePlayer,
        deletePlayer,
        updatePlayerKYC,
        hasPlayerCheckedInToday,
        lookupMemberByPhone,
        findMemberByPhone,
        requestBuyChips,
        createTournament,
        updateTournament,
        deleteTournament,
        registerPlayerForTournament,
        updateTournamentEntry,
        deleteTournamentEntry,
        fulfillChipRequest,
        cancelChipRequest,
        updateChipRequest,
        deleteChipRequest,
        addCashReceived,
        addCashGiven,
        updateCashTransaction,
        deleteCashTransaction,
        updateTournamentStatus,
        approvePlayerEntry,
        rejectPlayerEntry,
        updateCheckIn,
        deleteCheckIn,
        reviewKYC,
        addExpense,
        updateExpense,
        deleteExpense,
        deleteAuditLog,
        clearAuditLogs,
        resetToDemoData,
        addAuditLog,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = (): ClubContextType => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
