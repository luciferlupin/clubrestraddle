-- ==============================================================================
-- CLUB SHOWDOWN • POKER CLUB MANAGEMENT DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Optimized for Low Storage, High Performance & Role-Based Authentication
-- ==============================================================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-running
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS cash_transactions CASCADE;
DROP TABLE IF EXISTS tournament_entries CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS daily_check_ins CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;

-- ------------------------------------------------------------------------------
-- 2. STAFF USERS TABLE (Authentication & Role Provisioning)
-- ------------------------------------------------------------------------------
CREATE TABLE staff_users (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'STF-ADM-001'
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(24) NOT NULL CHECK (role IN ('admin', 'cashier', 'security')),
    status VARCHAR(24) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    
    created_by VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_email ON staff_users(email);
CREATE INDEX idx_staff_role ON staff_users(role);

-- ------------------------------------------------------------------------------
-- 3. PLAYERS TABLE (KYC & Profile Registry)
-- ------------------------------------------------------------------------------
CREATE TABLE players (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'PLR-1001'
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(120) NOT NULL,
    membership_tier VARCHAR(24) DEFAULT 'Standard' CHECK (membership_tier IN ('Standard', 'Silver', 'Gold', 'VIP', 'High Roller')),
    kyc_status VARCHAR(24) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    
    -- KYC Details
    date_of_birth DATE NOT NULL,
    govt_id_type VARCHAR(40) NOT NULL CHECK (govt_id_type IN ('Passport', 'Driving License', 'National ID', 'State ID', 'Voter ID')),
    govt_id_number VARCHAR(64) NOT NULL,
    address TEXT,
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(32),
    photo_url TEXT,
    agreed_to_rules BOOLEAN DEFAULT TRUE,
    
    -- Verification Metadata
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(120),
    rejection_reason TEXT,
    total_visits INTEGER DEFAULT 1,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_phone ON players(phone);
CREATE INDEX idx_players_kyc_status ON players(kyc_status);
CREATE INDEX idx_players_tier ON players(membership_tier);

-- ------------------------------------------------------------------------------
-- 4. DAILY CHECK-INS TABLE (Attendance & Door Clearance)
-- ------------------------------------------------------------------------------
CREATE TABLE daily_check_ins (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'CHK-2026-001'
    player_id VARCHAR(32) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(120) NOT NULL,
    player_phone VARCHAR(32) NOT NULL,
    check_in_date DATE DEFAULT CURRENT_DATE,
    check_in_time VARCHAR(16) NOT NULL, -- e.g. '08:30:15'
    verification_status VARCHAR(24) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    
    table_preference VARCHAR(80),
    verified_by VARCHAR(120),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_check_ins_date ON daily_check_ins(check_in_date);
CREATE INDEX idx_check_ins_player_id ON daily_check_ins(player_id);
CREATE INDEX idx_check_ins_status ON daily_check_ins(verification_status);

-- ------------------------------------------------------------------------------
-- 5. TOURNAMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE tournaments (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'TRN-501'
    name VARCHAR(140) NOT NULL,
    buy_in_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    club_rake NUMERIC(10, 2) NOT NULL DEFAULT 0,
    starting_chips INTEGER NOT NULL DEFAULT 30000,
    guaranteed_prize_pool NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_seats INTEGER NOT NULL DEFAULT 60,
    blind_levels_minutes INTEGER NOT NULL DEFAULT 20,
    start_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(24) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Registering', 'Running', 'Completed', 'Cancelled')),
    
    created_by VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_time ON tournaments(start_time);

-- ------------------------------------------------------------------------------
-- 6. TOURNAMENT ENTRIES & BILLING RECORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE tournament_entries (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'ENT-901'
    tournament_id VARCHAR(32) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_name VARCHAR(140) NOT NULL,
    player_id VARCHAR(32) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(120) NOT NULL,
    player_phone VARCHAR(32) NOT NULL,
    
    buy_in_amount NUMERIC(10, 2) NOT NULL,
    rake_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit/Debit Card', 'Chips', 'UPI/Digital')),
    payment_reference VARCHAR(80) NOT NULL,
    receipt_number VARCHAR(64) UNIQUE NOT NULL,
    
    seat_number VARCHAR(32),
    table_number VARCHAR(32),
    entry_status VARCHAR(24) DEFAULT 'Registered' CHECK (entry_status IN ('Registered', 'Seated', 'Eliminated', 'Re-entry')),
    cashier_name VARCHAR(120) NOT NULL,
    
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entries_tournament_id ON tournament_entries(tournament_id);
CREATE INDEX idx_entries_player_id ON tournament_entries(player_id);
CREATE INDEX idx_entries_receipt_num ON tournament_entries(receipt_number);

-- ------------------------------------------------------------------------------
-- 7. CASH TRANSACTIONS TABLE (Treasury & Vault Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE cash_transactions (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'CSH-701'
    type VARCHAR(8) NOT NULL CHECK (type IN ('in', 'out')),
    category VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(32) DEFAULT 'Cash',
    reference_id VARCHAR(80),
    player_name VARCHAR(120),
    cashier_name VARCHAR(120) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_txns_type ON cash_transactions(type);
CREATE INDEX idx_cash_txns_timestamp ON cash_transactions(timestamp DESC);

-- ------------------------------------------------------------------------------
-- 8. OPERATING EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE expenses (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'EXP-301'
    category VARCHAR(64) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    paid_to VARCHAR(120) NOT NULL,
    payment_method VARCHAR(32) DEFAULT 'Cash',
    date DATE DEFAULT CURRENT_DATE,
    receipt_number VARCHAR(64),
    recorded_by VARCHAR(120) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ------------------------------------------------------------------------------
-- 9. AUDIT LOGS TABLE (Cross-Portal Activity Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'LOG-001'
    portal VARCHAR(24) NOT NULL CHECK (portal IN ('Player', 'Cashier', 'Security', 'Admin')),
    user_name VARCHAR(120) NOT NULL,
    action VARCHAR(120) NOT NULL,
    details TEXT NOT NULL,
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_portal ON audit_logs(portal);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Staff Users" ON staff_users FOR ALL USING (true);
CREATE POLICY "Public Access Players" ON players FOR ALL USING (true);
CREATE POLICY "Public Access Daily Check-ins" ON daily_check_ins FOR ALL USING (true);
CREATE POLICY "Public Access Tournaments" ON tournaments FOR ALL USING (true);
CREATE POLICY "Public Access Tournament Entries" ON tournament_entries FOR ALL USING (true);
CREATE POLICY "Public Access Cash Transactions" ON cash_transactions FOR ALL USING (true);
CREATE POLICY "Public Access Expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Public Access Audit Logs" ON audit_logs FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 11. SEED DEFAULT SUPER ADMIN ACCOUNT (NO MOCK DEMO DATA)
-- ------------------------------------------------------------------------------
INSERT INTO staff_users (id, full_name, email, password_hash, role, status, created_by, created_at)
VALUES
('STF-ADM-001', 'Jai Goel', 'jaigoel2206@gmail.com', '12345', 'admin', 'active', 'System Initializer', NOW());

INSERT INTO audit_logs (id, portal, user_name, action, details, timestamp)
VALUES
('LOG-SYS-001', 'Admin', 'Jai Goel (Super Admin)', 'Database Initialized', 'Poker Club OS database initialized with Super Admin (jaigoel2206@gmail.com). Ready for clean club operations.', NOW());
