CREATE TABLE expense_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  expense_date DATE NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cash_flows (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'income' or 'expense'
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  transaction_date DATE NOT NULL,
  reference_id BIGINT,
  reference_type TEXT, -- 'sales_transaction', 'expense', 'catalog_order'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO expense_categories (name, description) VALUES
('Bahan Baku', 'Pembelian bahan baku dan inventory'),
('Operasional', 'Biaya operasional harian'),
('Marketing', 'Biaya promosi dan marketing'),
('Transportasi', 'Biaya pengiriman dan transportasi'),
('Utilitas', 'Listrik, air, internet, dll'),
('Gaji & Upah', 'Gaji karyawan dan upah'),
('Sewa', 'Sewa tempat usaha'),
('Lain-lain', 'Pengeluaran lainnya');
