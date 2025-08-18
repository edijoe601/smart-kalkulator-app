CREATE TABLE catalog_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name TEXT NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
  min_order_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE catalog_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  subtotal DOUBLE PRECISION NOT NULL,
  delivery_fee DOUBLE PRECISION NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE catalog_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES catalog_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total_price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, type, account_number, account_name, instructions) VALUES
('Transfer Bank BCA', 'bank_transfer', '1234567890', 'Toko ABC', 'Transfer ke rekening BCA a.n. Toko ABC'),
('Transfer Bank Mandiri', 'bank_transfer', '0987654321', 'Toko ABC', 'Transfer ke rekening Mandiri a.n. Toko ABC'),
('GoPay', 'e_wallet', '081234567890', 'Toko ABC', 'Transfer ke GoPay nomor 081234567890'),
('OVO', 'e_wallet', '081234567890', 'Toko ABC', 'Transfer ke OVO nomor 081234567890'),
('DANA', 'e_wallet', '081234567890', 'Toko ABC', 'Transfer ke DANA nomor 081234567890'),
('Cash on Delivery', 'cod', NULL, NULL, 'Bayar tunai saat barang diterima');

-- Insert default catalog settings
INSERT INTO catalog_settings (store_name, store_description, store_address, store_phone, delivery_fee, min_order_amount) VALUES
('Smart Kalkulator Store', 'Toko online untuk produk UKM berkualitas', 'Jl. Contoh No. 123, Jakarta', '081234567890', 10000, 50000);
