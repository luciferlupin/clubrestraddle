import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
  StaffRole,
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
} from '../data/seedData';
import {
  generateId,
  generateReceiptNumber,
  getTodayDateString,
} from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface ClubContextType {
  // Navigation & Session
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  selectedPlayerId: string;
  setSelectedPlayerId: (id: string) => void;
  staffName: string;
  setStaffName: (name: string) => void;

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

  // Derived Values
  currentPlayer: Player | undefined;
  todayCheckIns: DailyCheckIn[];
  currentCashBalance: number;
  totalExpensesAmount: number;
  totalCashInAmount: number;
  totalCashOutAmount: number;
  netTreasuryBalance: number;

  // Player Actions
  registerNewPlayer: (kycData: Omit<PlayerKYC, 'submittedAt'>, tablePreference?: string) => { player: Player; checkIn: DailyCheckIn };
  performDailyCheckIn: (playerId: string, tablePreference?: string) => DailyCheckIn;
  updatePlayerKYC: (playerId: string, updatedKYC: Partial<PlayerKYC>) => void;
  hasPlayerCheckedInToday: (playerId: string) => DailyCheckIn | undefined;

  // Cashier Actions
  createTournament: (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'createdBy'>) => Tournament;
  registerPlayerForTournament: (params: {
    tournamentId: string;
    playerId: string;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    tableNumber?: string;
    seatNumber?: string;
  }) => TournamentEntry;
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
  updateTournamentStatus: (tournamentId: string, status: Tournament['status']) => void;

  // Security Actions
  approvePlayerEntry: (checkInId: string) => void;
  rejectPlayerEntry: (checkInId: string, reason: string) => void;
  reviewKYC: (playerId: string, status: KYCStatus, reason?: string) => void;

  // Admin Actions
  addExpense: (expenseData: Omit<Expense, 'id' | 'recordedBy'>) => Expense;
  resetToDemoData: () => void;
  addAuditLog: (portal: AuditLog['portal'], action: string, details: string) => void;
}

const STORAGE_KEYS = {
  STAFF_USERS: 'clubshowdown_staff_users_v2',
  CURRENT_STAFF: 'clubshowdown_current_staff_v2',
  PLAYERS: 'clubshowdown_players_v2',
  CHECK_INS: 'clubshowdown_checkins_v2',
  TOURNAMENTS: 'clubshowdown_tournaments_v2',
  ENTRIES: 'clubshowdown_entries_v2',
  CASH_TXNS: 'clubshowdown_cash_txns_v2',
  EXPENSES: 'clubshowdown_expenses_v2',
  AUDIT_LOGS: 'clubshowdown_audit_logs_v2',
  ACTIVE_ROLE: 'clubshowdown_active_role_v2',
  SELECTED_PLAYER: 'clubshowdown_selected_player_v2',
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
  const [activeRole, setActiveRoleState] = useState<UserRole>(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVE_ROLE, 'player')
  );

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() =>
    loadFromStorage(STORAGE_KEYS.STAFF_USERS, initialStaffUsers)
  );

  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(() =>
    loadFromStorage(STORAGE_KEYS.CURRENT_STAFF, null)
  );

  const [selectedPlayerId, setSelectedPlayerIdState] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.SELECTED_PLAYER, '')
  );

  const [staffName, setStaffName] = useState<string>(() => {
    const savedStaff = loadFromStorage<StaffUser | null>(STORAGE_KEYS.CURRENT_STAFF, null);
    return savedStaff ? `${savedStaff.fullName} (${savedStaff.role.toUpperCase()})` : 'Staff Officer';
  });

  const [players, setPlayers] = useState<Player[]>(() =>
    loadFromStorage(STORAGE_KEYS.PLAYERS, initialPlayers)
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

  // Hydrate from Supabase if connected
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    const fetchSupabaseData = async () => {
      try {
        const { data: staffData } = await client.from('staff_users').select('*');
        if (staffData && staffData.length > 0) {
          const mappedStaff: StaffUser[] = staffData.map((s: any) => ({
            id: s.id,
            fullName: s.full_name,
            email: s.email,
            password: s.password || s.password_hash || '12345',
            role: s.role,
            status: s.status || 'active',
            createdAt: s.created_at,
            createdBy: s.created_by,
            lastLoginAt: s.last_login_at,
          }));
          setStaffUsers(mappedStaff);
        }

        const { data: playersData } = await client.from('players').select('*');
        if (playersData && playersData.length > 0) {
          const mappedPlayers: Player[] = playersData.map((p: any) => ({
            id: p.id,
            fullName: p.full_name,
            phone: p.phone,
            email: p.email,
            membershipTier: p.membership_tier,
            kycStatus: p.kyc_status,
            registeredAt: p.created_at,
            totalVisits: p.total_visits || 1,
            notes: p.notes,
            kyc: {
              fullName: p.full_name,
              phone: p.phone,
              email: p.email,
              dateOfBirth: p.date_of_birth,
              govtIdType: p.govt_id_type,
              govtIdNumber: p.govt_id_number,
              address: p.address,
              emergencyContactName: p.emergency_contact_name,
              emergencyContactPhone: p.emergency_contact_phone,
              photoUrl: p.photo_url,
              agreedToRules: p.agreed_to_rules,
              submittedAt: p.created_at,
              verifiedAt: p.verified_at,
              verifiedBy: p.verified_by,
              rejectionReason: p.rejection_reason,
            },
          }));
          setPlayers(mappedPlayers);
          if (!selectedPlayerId && mappedPlayers.length > 0) {
            setSelectedPlayerIdState(mappedPlayers[0].id);
          }
        }

        const { data: checkInsData } = await client.from('daily_check_ins').select('*');
        if (checkInsData && checkInsData.length > 0) {
          const mappedCheckIns: DailyCheckIn[] = checkInsData.map((c: any) => ({
            id: c.id,
            playerId: c.player_id,
            playerName: c.player_name,
            playerPhone: c.player_phone,
            checkInDate: c.check_in_date,
            checkInTime: c.check_in_time,
            verificationStatus: c.verification_status,
            verifiedBy: c.verified_by,
            verifiedAt: c.verified_at,
            rejectionReason: c.rejection_reason,
            tablePreference: c.table_preference,
          }));
          setCheckIns(mappedCheckIns);
        }

        const { data: tournamentsData } = await client.from('tournaments').select('*');
        if (tournamentsData && tournamentsData.length > 0) {
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
        }

        const { data: entriesData } = await client.from('tournament_entries').select('*');
        if (entriesData && entriesData.length > 0) {
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

        const { data: cashData } = await client.from('cash_transactions').select('*').order('timestamp', { ascending: false });
        if (cashData && cashData.length > 0) {
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

        const { data: expensesData } = await client.from('expenses').select('*').order('date', { ascending: false });
        if (expensesData && expensesData.length > 0) {
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
      } catch (err) {
        console.warn('Supabase fetch error, fallback to local storage:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
  };

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

    setStaffUsers(prev => prev.filter(u => u.id !== id));
    if (isSupabaseConfigured && supabase) {
      supabase.from('staff_users').delete().eq('id', id);
    }
    addAuditLog('Admin', 'Staff Account Deleted', `Deleted staff account: ${user.fullName} (${user.role.toUpperCase()}).`);
  };

  const toggleStaffStatus = (id: string) => {
    const user = staffUsers.find(u => u.id === id);
    if (!user || user.role === 'admin') return;

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setStaffUsers(prev => prev.map(u => (u.id === id ? { ...u, status: newStatus } : u)));

    if (isSupabaseConfigured && supabase) {
      supabase.from('staff_users').update({ status: newStatus }).eq('id', id);
    }

    addAuditLog('Admin', 'Staff Status Changed', `Changed status of ${user.fullName} to ${newStatus}.`);
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
      });
    }
  };

  // Derived Calculations
  const currentPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId) || players[0];
  }, [players, selectedPlayerId]);

  const today = getTodayDateString();

  const todayCheckIns = useMemo(() => {
    return checkIns.filter(c => c.checkInDate === today);
  }, [checkIns, today]);

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

  const currentCashBalance = useMemo(() => {
    return totalCashInAmount - totalCashOutAmount;
  }, [totalCashInAmount, totalCashOutAmount]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netTreasuryBalance = useMemo(() => {
    return currentCashBalance - totalExpensesAmount;
  }, [currentCashBalance, totalExpensesAmount]);

  const hasPlayerCheckedInToday = (playerId: string) => {
    return checkIns.find(c => c.playerId === playerId && c.checkInDate === today);
  };

  // PLAYER ACTIONS
  const registerNewPlayer = (kycData: Omit<PlayerKYC, 'submittedAt'>, tablePreference?: string) => {
    const newId = generateId('PLR');
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toTimeString().split(' ')[0];

    const completeKYC: PlayerKYC = {
      ...kycData,
      submittedAt: nowIso,
    };

    const newPlayer: Player = {
      id: newId,
      fullName: kycData.fullName,
      phone: kycData.phone,
      email: kycData.email,
      membershipTier: 'Standard',
      kycStatus: 'pending',
      kyc: completeKYC,
      registeredAt: nowIso,
      totalVisits: 1,
    };

    const newCheckIn: DailyCheckIn = {
      id: generateId('CHK'),
      playerId: newId,
      playerName: kycData.fullName,
      playerPhone: kycData.phone,
      checkInDate: today,
      checkInTime: nowTime,
      verificationStatus: 'pending',
      tablePreference: tablePreference || 'Open Seating',
    };

    setPlayers(prev => [newPlayer, ...prev]);
    setCheckIns(prev => [newCheckIn, ...prev]);
    setSelectedPlayerIdState(newId);

    // Sync to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      supabase.from('players').insert({
        id: newPlayer.id,
        full_name: newPlayer.fullName,
        phone: newPlayer.phone,
        email: newPlayer.email,
        membership_tier: newPlayer.membershipTier,
        kyc_status: newPlayer.kycStatus,
        date_of_birth: completeKYC.dateOfBirth,
        govt_id_type: completeKYC.govtIdType,
        govt_id_number: completeKYC.govtIdNumber,
        address: completeKYC.address,
        emergency_contact_name: completeKYC.emergencyContactName,
        emergency_contact_phone: completeKYC.emergencyContactPhone,
        photo_url: completeKYC.photoUrl,
        agreed_to_rules: completeKYC.agreedToRules,
        total_visits: 1,
        created_at: nowIso,
      });

      supabase.from('daily_check_ins').insert({
        id: newCheckIn.id,
        player_id: newCheckIn.playerId,
        player_name: newCheckIn.playerName,
        player_phone: newCheckIn.playerPhone,
        check_in_date: newCheckIn.checkInDate,
        check_in_time: newCheckIn.checkInTime,
        verification_status: newCheckIn.verificationStatus,
        table_preference: newCheckIn.tablePreference,
      });
    }

    addAuditLog(
      'Player',
      'New Player Registration + KYC',
      `Registered member ${kycData.fullName} (${newId}) with ${kycData.govtIdType}. Daily check-in generated.`
    );

    return { player: newPlayer, checkIn: newCheckIn };
  };

  const performDailyCheckIn = (playerId: string, tablePreference?: string): DailyCheckIn => {
    const existingCheckIn = hasPlayerCheckedInToday(playerId);
    if (existingCheckIn) {
      return existingCheckIn;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found.`);
    }

    const nowIso = new Date().toISOString();
    const nowTime = new Date().toTimeString().split(' ')[0];

    const newCheckIn: DailyCheckIn = {
      id: generateId('CHK'),
      playerId: player.id,
      playerName: player.fullName,
      playerPhone: player.phone,
      checkInDate: today,
      checkInTime: nowTime,
      verificationStatus: 'pending',
      tablePreference: tablePreference || 'Cash / Tournament Table',
    };

    setCheckIns(prev => [newCheckIn, ...prev]);
    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, totalVisits: p.totalVisits + 1 } : p))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('daily_check_ins').insert({
        id: newCheckIn.id,
        player_id: newCheckIn.playerId,
        player_name: newCheckIn.playerName,
        player_phone: newCheckIn.playerPhone,
        check_in_date: newCheckIn.checkInDate,
        check_in_time: newCheckIn.checkInTime,
        verification_status: newCheckIn.verificationStatus,
        table_preference: newCheckIn.tablePreference,
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
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            kycStatus: 'pending',
            kyc: {
              ...p.kyc,
              ...updatedKYC,
              submittedAt: new Date().toISOString(),
              rejectionReason: undefined,
            },
          };
        }
        return p;
      })
    );
    addAuditLog('Player', 'KYC Resubmitted', `Player ${playerId} re-submitted KYC verification information.`);
  };

  // CASHIER ACTIONS
  const createTournament = (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'createdBy'>): Tournament => {
    const newTournament: Tournament = {
      ...tournamentData,
      id: generateId('TRN'),
      createdAt: new Date().toISOString(),
      createdBy: currentStaffUser ? currentStaffUser.fullName : staffName,
    };

    setTournaments(prev => [newTournament, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('tournaments').insert({
        id: newTournament.id,
        name: newTournament.name,
        buy_in_fee: newTournament.buyInFee,
        club_rake: newTournament.clubRake,
        starting_chips: newTournament.startingChips,
        guaranteed_prize_pool: newTournament.guaranteedPrizePool,
        max_seats: newTournament.maxSeats,
        blind_levels_minutes: newTournament.blindLevelsMinutes,
        start_time: newTournament.startTime,
        status: newTournament.status,
        created_by: newTournament.createdBy,
        created_at: newTournament.createdAt,
      });
    }

    addAuditLog('Cashier', 'Tournament Created', `Created tournament "${newTournament.name}" (Buy-in: $${newTournament.buyInFee} + $${newTournament.clubRake}).`);
    return newTournament;
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
      seatNumber: params.seatNumber || `Seat ${Math.floor(1 + Math.random() * 9)}`,
      tableNumber: params.tableNumber || `Table ${Math.floor(1 + Math.random() * 5)}`,
      entryStatus: 'Registered',
      registeredAt: nowIso,
      cashierName: currentStaffUser ? currentStaffUser.fullName : staffName,
    };

    const newBalance = currentCashBalance + totalAmount;

    const cashTxn: CashTransaction = {
      id: generateId('CSH'),
      type: 'in',
      category: 'Tournament Buy-in',
      amount: totalAmount,
      description: `Buy-in & Rake for ${tournament.name} (${player.fullName})`,
      paymentMethod: params.paymentMethod,
      referenceId: receiptNum,
      playerName: player.fullName,
      cashierName: currentStaffUser ? currentStaffUser.fullName : staffName,
      timestamp: nowIso,
      balanceAfter: newBalance,
    };

    setEntries(prev => [newEntry, ...prev]);
    setCashTransactions(prev => [cashTxn, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('tournament_entries').insert({
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
      });

      supabase.from('cash_transactions').insert({
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
      });
    }

    addAuditLog(
      'Cashier',
      'Tournament Entry & Billing',
      `Registered ${player.fullName} for ${tournament.name}. Collected $${totalAmount} via ${params.paymentMethod} (Receipt: ${receiptNum}).`
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

    setCashTransactions(prev => [newTxn, ...prev]);

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
      });
    }

    addAuditLog(
      'Cashier',
      'Cash Received',
      `Received $${params.amount} [${params.category}] - ${params.description} (${params.paymentMethod}).`
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

    setCashTransactions(prev => [newTxn, ...prev]);

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
      });
    }

    addAuditLog(
      'Cashier',
      'Cash Given / Payout',
      `Paid out $${params.amount} [${params.category}] - ${params.description} (${params.paymentMethod}).`
    );
    return newTxn;
  };

  const updateTournamentStatus = (tournamentId: string, status: Tournament['status']) => {
    setTournaments(prev =>
      prev.map(t => (t.id === tournamentId ? { ...t, status } : t))
    );
    if (isSupabaseConfigured && supabase) {
      supabase.from('tournaments').update({ status }).eq('id', tournamentId);
    }
    addAuditLog('Cashier', 'Tournament Status Updated', `Updated tournament ${tournamentId} status to ${status}.`);
  };

  // SECURITY ACTIONS
  const approvePlayerEntry = (checkInId: string) => {
    const nowIso = new Date().toISOString();
    let approvedPlayerName = '';
    let targetPlayerId = '';

    setCheckIns(prev =>
      prev.map(c => {
        if (c.id === checkInId) {
          approvedPlayerName = c.playerName;
          targetPlayerId = c.playerId;
          return {
            ...c,
            verificationStatus: 'approved',
            verifiedBy: currentStaffUser ? currentStaffUser.fullName : staffName,
            verifiedAt: nowIso,
            rejectionReason: undefined,
          };
        }
        return c;
      })
    );

    if (targetPlayerId) {
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === targetPlayerId && p.kycStatus === 'pending') {
            return {
              ...p,
              kycStatus: 'verified',
              kyc: {
                ...p.kyc,
                verifiedAt: nowIso,
                verifiedBy: currentStaffUser ? currentStaffUser.fullName : staffName,
              },
            };
          }
          return p;
        })
      );
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('daily_check_ins').update({
        verification_status: 'approved',
        verified_by: currentStaffUser ? currentStaffUser.fullName : staffName,
        verified_at: nowIso,
      }).eq('id', checkInId);

      if (targetPlayerId) {
        supabase.from('players').update({
          kyc_status: 'verified',
          verified_at: nowIso,
          verified_by: currentStaffUser ? currentStaffUser.fullName : staffName,
        }).eq('id', targetPlayerId);
      }
    }

    addAuditLog(
      'Security',
      'Entry Approved',
      `Officer approved entry for ${approvedPlayerName} (Check-in: ${checkInId}). Physical club access granted.`
    );
  };

  const rejectPlayerEntry = (checkInId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    let rejectedPlayerName = '';

    setCheckIns(prev =>
      prev.map(c => {
        if (c.id === checkInId) {
          rejectedPlayerName = c.playerName;
          return {
            ...c,
            verificationStatus: 'rejected',
            verifiedBy: currentStaffUser ? currentStaffUser.fullName : staffName,
            verifiedAt: nowIso,
            rejectionReason: reason,
          };
        }
        return c;
      })
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('daily_check_ins').update({
        verification_status: 'rejected',
        verified_by: currentStaffUser ? currentStaffUser.fullName : staffName,
        verified_at: nowIso,
        rejection_reason: reason,
      }).eq('id', checkInId);
    }

    addAuditLog(
      'Security',
      'Entry Rejected',
      `Officer rejected entry for ${rejectedPlayerName} (Check-in: ${checkInId}). Reason: ${reason}`
    );
  };

  const reviewKYC = (playerId: string, status: KYCStatus, reason?: string) => {
    const nowIso = new Date().toISOString();
    setPlayers(prev =>
      prev.map(p => {
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
      })
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('players').update({
        kyc_status: status,
        verified_at: status === 'verified' ? nowIso : null,
        verified_by: status === 'verified' ? (currentStaffUser ? currentStaffUser.fullName : staffName) : null,
        rejection_reason: status === 'rejected' ? reason : null,
      }).eq('id', playerId);
    }

    addAuditLog(
      'Security',
      `KYC ${status.toUpperCase()}`,
      `Security officer updated KYC status for player ${playerId} to ${status}.${reason ? ` Reason: ${reason}` : ''}`
    );
  };

  // ADMIN ACTIONS
  const addExpense = (expenseData: Omit<Expense, 'id' | 'recordedBy'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: generateId('EXP'),
      recordedBy: currentStaffUser ? currentStaffUser.fullName : staffName,
    };

    setExpenses(prev => [newExpense, ...prev]);

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
      });
    }

    addAuditLog(
      'Admin',
      'Club Expense Recorded',
      `Recorded expense: $${newExpense.amount} for "${newExpense.category}" - ${newExpense.description} (Paid to: ${newExpense.paidTo}).`
    );
    return newExpense;
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
    saveToStorage(STORAGE_KEYS.SELECTED_PLAYER, '');
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
        staffUsers,
        currentStaffUser,
        loginStaff,
        logoutStaff,
        createStaffUser,
        deleteStaffUser,
        toggleStaffStatus,
        players,
        checkIns,
        tournaments,
        entries,
        cashTransactions,
        expenses,
        auditLogs,
        currentPlayer,
        todayCheckIns,
        currentCashBalance,
        totalExpensesAmount,
        totalCashInAmount,
        totalCashOutAmount,
        netTreasuryBalance,
        registerNewPlayer,
        performDailyCheckIn,
        updatePlayerKYC,
        hasPlayerCheckedInToday,
        createTournament,
        registerPlayerForTournament,
        addCashReceived,
        addCashGiven,
        updateTournamentStatus,
        approvePlayerEntry,
        rejectPlayerEntry,
        reviewKYC,
        addExpense,
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
