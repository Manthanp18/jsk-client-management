-- Trade Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    invested_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0, -- e.g., 25.00 for 25%
    total_profit DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Running total of all P&L
    total_withdrawals DECIMAL(15, 2) NOT NULL DEFAULT 0,
    commission_due DECIMAL(15, 2) NOT NULL DEFAULT 0,
    commission_received DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily PNL Table
CREATE TABLE daily_pnl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    pnl_amount DECIMAL(15, 2) NOT NULL, -- Can be positive or negative
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date) -- One entry per client per day
);

-- Withdrawals Table
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    withdrawal_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission Payments Table
CREATE TABLE commission_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_daily_pnl_client_date ON daily_pnl(client_id, date DESC);
CREATE INDEX idx_withdrawals_client_date ON withdrawals(client_id, withdrawal_date DESC);
CREATE INDEX idx_commission_payments_client_date ON commission_payments(client_id, payment_date DESC);
CREATE INDEX idx_clients_active ON clients(is_active);

-- View for weekly reports
CREATE OR REPLACE VIEW weekly_reports AS
SELECT
    dp.client_id,
    c.name as client_name,
    DATE_TRUNC('week', dp.date + INTERVAL '1 day')::date - INTERVAL '1 day' AS week_start, -- Monday
    (DATE_TRUNC('week', dp.date + INTERVAL '1 day')::date + INTERVAL '4 days')::date AS week_end, -- Friday
    SUM(dp.pnl_amount) as weekly_pnl,
    COUNT(*) as trading_days
FROM daily_pnl dp
JOIN clients c ON c.id = dp.client_id
WHERE EXTRACT(DOW FROM dp.date) BETWEEN 1 AND 5 -- Monday to Friday only
GROUP BY dp.client_id, c.name, DATE_TRUNC('week', dp.date + INTERVAL '1 day')::date
ORDER BY week_start DESC, c.name;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_pnl_updated_at BEFORE UPDATE ON daily_pnl
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_pnl ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all operations for authenticated users)
-- You can customize these based on your auth requirements

CREATE POLICY "Allow all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON daily_pnl
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON withdrawals
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON commission_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Sample data (optional, for testing)
-- Uncomment to insert sample client
-- INSERT INTO clients (name, email, invested_amount, commission_percentage)
-- VALUES ('John Doe', 'john@example.com', 100000, 25.00);
