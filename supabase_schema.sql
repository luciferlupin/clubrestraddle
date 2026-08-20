-- ==============================================================================
-- CLUB RE STRADDLE • POKER CLUB OPERATING SYSTEM DATABASE SCHEMA
-- Target Database: Supabase / PostgreSQL 15+
-- Optimized for High-Speed Realtime Sync, Clean Audit Logging, Full CRUD & Role Access
-- ==============================================================================

-- 1. EXTENSIONS & INITIAL SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and views if re-running
DROP VIEW IF EXISTS v_active_door_queue CASCADE;
DROP VIEW IF EXISTS v_treasury_summary CASCADE;
DROP VIEW IF EXISTS v_tournament_summary CASCADE;
DROP TABLE IF EXISTS chip_requests CASCADE;
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
CREATE INDEX idx_staff_status ON staff_users(status);

-- ------------------------------------------------------------------------------
-- 3. PLAYERS TABLE (KYC & Profile Registry)
-- ------------------------------------------------------------------------------
CREATE TABLE players (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'PLR-1001'
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(120) NOT NULL,
    membership_tier VARCHAR(24) DEFAULT 'Standard' CHECK (membership_tier IN ('Standard', 'Silver', 'Gold', 'VIP', 'High Roller', 'Bronze', 'Diamond')),
    kyc_status VARCHAR(24) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    
    -- KYC Government Identity
    date_of_birth DATE NOT NULL,
    govt_id_type VARCHAR(40) NOT NULL CHECK (govt_id_type IN ('Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', 'National ID', 'State ID', 'Voter ID')),
    govt_id_number VARCHAR(64) NOT NULL,
    address TEXT,
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(32),
    photo_url TEXT,
    agreed_to_rules BOOLEAN DEFAULT TRUE,
    
    -- Verification & Visit Records
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(120),
    rejection_reason TEXT,
    total_visits INTEGER DEFAULT 1,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_phone ON players(phone);
CREATE INDEX idx_players_email ON players(email);
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
    check_in_time VARCHAR(16) NOT NULL, -- e.g. '18:30:15'
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
    entry_status VARCHAR(24) DEFAULT 'Registered' CHECK (entry_status IN ('Registered', 'Seated', 'Eliminated', 'Re-entry', 'Refunded')),
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
-- 10. CHIP ORDERS & TABLE RELOADS TABLE (Real-Time Cashier Vault Requests)
-- ------------------------------------------------------------------------------
CREATE TABLE chip_requests (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'CHP-1001'
    player_id VARCHAR(32) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(120) NOT NULL,
    player_phone VARCHAR(32),
    amount NUMERIC(14, 2) NOT NULL,
    chips_quantity INTEGER NOT NULL,
    table_number VARCHAR(80) NOT NULL,
    seat_number VARCHAR(32) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    status VARCHAR(24) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    fulfilled_by VARCHAR(120),
    fulfilled_at TIMESTAMPTZ,
    receipt_number VARCHAR(48),
    notes TEXT
);

CREATE INDEX idx_chip_requests_status ON chip_requests(status);
CREATE INDEX idx_chip_requests_player ON chip_requests(player_id);

-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_update_tournaments_updated_at
BEFORE UPDATE ON tournaments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 12. REALTIME PUBLICATION ENABLEMENT (Supabase WebSockets)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE staff_users, players, daily_check_ins, tournaments, tournament_entries, cash_transactions, expenses, audit_logs, chip_requests;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES (Full CRUD for Application Tables)
-- ------------------------------------------------------------------------------
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Staff Users" ON staff_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Daily Check-ins" ON daily_check_ins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Tournament Entries" ON tournament_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Cash Transactions" ON cash_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Audit Logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Chip Requests" ON chip_requests FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 14. HELPER REPORTING VIEWS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_door_queue AS
SELECT 
    c.id AS checkin_id,
    c.player_id,
    p.full_name,
    p.phone,
    p.membership_tier,
    p.kyc_status,
    p.govt_id_type,
    p.govt_id_number,
    c.check_in_time,
    c.table_preference,
    c.verification_status
FROM daily_check_ins c
JOIN players p ON c.player_id = p.id
WHERE c.check_in_date = CURRENT_DATE
ORDER BY c.check_in_time DESC;

CREATE OR REPLACE VIEW v_tournament_summary AS
SELECT 
    t.id,
    t.name,
    t.buy_in_fee,
    t.club_rake,
    t.status,
    t.max_seats,
    COUNT(e.id) AS registered_count,
    COALESCE(SUM(e.buy_in_amount), 0) AS total_prize_collected,
    COALESCE(SUM(e.rake_amount), 0) AS total_rake_collected
FROM tournaments t
LEFT JOIN tournament_entries e ON t.id = e.tournament_id
GROUP BY t.id, t.name, t.buy_in_fee, t.club_rake, t.status, t.max_seats;

CREATE OR REPLACE VIEW v_treasury_summary AS
SELECT 
    COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) AS total_cash_in,
    COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) AS total_cash_out,
    COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) AS net_cash_balance,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses
FROM cash_transactions;

-- ------------------------------------------------------------------------------
-- 15. SEED DEFAULT SUPER ADMIN & INITIAL OPERATIONAL DATA (CLUB RE STRADDLE)
-- ------------------------------------------------------------------------------

-- Staff Accounts (Club Owners, Admin, Cashier, Security)
INSERT INTO staff_users (id, full_name, email, password_hash, role, status, created_by, created_at)
VALUES
('STF-OWN-001', 'Shivam Gupta', 'shivamgupta@restraddle.club', '12345', 'admin', 'active', 'System Initializer', NOW()),
('STF-OWN-002', 'Rajbeer Gupta', 'rajbeergupta@restraddle.club', '12345', 'admin', 'active', 'System Initializer', NOW()),
('STF-ADM-003', 'Jai Goel', 'jaigoel2206@gmail.com', '12345', 'admin', 'active', 'Shivam Gupta', NOW()),
('STF-CSH-004', 'Elena Rostova', 'cashier@club-restraddle.com', '12345', 'cashier', 'active', 'Shivam Gupta', NOW()),
('STF-SEC-005', 'Marcus Vance', 'security@club-restraddle.com', '12345', 'security', 'active', 'Shivam Gupta', NOW())
ON CONFLICT (id) DO NOTHING;

-- Initial Club Tournaments (INR)
INSERT INTO tournaments (id, name, buy_in_fee, club_rake, starting_chips, guaranteed_prize_pool, max_seats, blind_levels_minutes, start_time, status, created_by)
VALUES
('TRN-501', '♠ Re Straddle High Roller Championship', 100000.00, 10000.00, 100000, 5000000.00, 50, 30, NOW() + INTERVAL '3 hours', 'Registering', 'Jai Goel'),
('TRN-502', '♦ Midnight Bounty Knockout Series', 25000.00, 2500.00, 40000, 1500000.00, 60, 20, NOW() + INTERVAL '6 hours', 'Registering', 'Jai Goel'),
('TRN-503', '♣ Sunday Deepstack Turbo Showdown', 15000.00, 1500.00, 50000, 1000000.00, 70, 15, NOW() + INTERVAL '1 day', 'Upcoming', 'Jai Goel')
ON CONFLICT (id) DO NOTHING;

-- Initial Seed Cash Float Transaction (Opening Balance)
INSERT INTO cash_transactions (id, type, category, amount, description, payment_method, cashier_name, balance_after, timestamp)
VALUES
('CSH-1001', 'in', 'Float Deposit', 1000000.00, 'Opening vault float for Club Re Straddle tournament desk & cash game floor', 'Cash', 'Jai Goel', 1000000.00, NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- System Audit Log Initializer
INSERT INTO audit_logs (id, portal, user_name, action, details, timestamp)
VALUES
('LOG-SYS-001', 'Admin', 'Jai Goel (Super Admin)', 'Database Initialized', 'Club Re Straddle database initialized with Super Admin (jaigoel2206@gmail.com), cashier desk, security checkpoint, and initial tournament fixtures.', NOW())
ON CONFLICT (id) DO NOTHING;
