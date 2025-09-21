-- Add payment methods table
CREATE TABLE payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank_transfer', 'e_wallet', 'card', 'other')),
  account_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, type, display_order, is_active) VALUES
('Cash', 'cash', 1, true),
('Bank Transfer - BCA', 'bank_transfer', 2, true),
('Bank Transfer - Mandiri', 'bank_transfer', 3, true),
('Bank Transfer - BRI', 'bank_transfer', 4, true),
('Bank Transfer - BNI', 'bank_transfer', 5, true),
('GoPay', 'e_wallet', 6, true),
('OVO', 'e_wallet', 7, true),
('DANA', 'e_wallet', 8, true),
('ShopeePay', 'e_wallet', 9, true),
('Kartu Debit', 'card', 10, true),
('Kartu Kredit', 'card', 11, true);

-- Add payment settings to store_settings table
ALTER TABLE store_settings ADD COLUMN default_payment_method TEXT DEFAULT 'Cash';
ALTER TABLE store_settings ADD COLUMN require_customer_info BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN allow_partial_payment BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN max_cash_amount DECIMAL(15,2) DEFAULT 10000000;
ALTER TABLE store_settings ADD COLUMN min_card_amount DECIMAL(15,2) DEFAULT 10000;

-- Update default settings with payment preferences
UPDATE store_settings SET 
  default_payment_method = 'Cash',
  require_customer_info = false,
  allow_partial_payment = false,
  max_cash_amount = 10000000,
  min_card_amount = 10000
WHERE id = 1;