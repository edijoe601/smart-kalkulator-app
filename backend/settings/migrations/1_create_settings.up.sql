CREATE TABLE store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name TEXT NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  store_website TEXT,
  business_type TEXT,
  tax_number TEXT,
  currency TEXT DEFAULT 'IDR',
  timezone TEXT DEFAULT 'Asia/Jakarta',
  receipt_header TEXT,
  receipt_footer TEXT,
  receipt_width INTEGER DEFAULT 58,
  auto_print_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO store_settings (
  store_name, store_description, store_address, store_phone, 
  receipt_header, receipt_footer
) VALUES (
  'Smart Kalkulator Store', 
  'Toko UKM dengan sistem manajemen terintegrasi',
  'Jl. Contoh No. 123, Jakarta',
  '081234567890',
  'Terima kasih telah berbelanja',
  'Barang yang sudah dibeli tidak dapat dikembalikan'
);
