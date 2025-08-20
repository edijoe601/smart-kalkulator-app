CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  plan TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  billing_cycle TEXT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id),
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE landing_page_settings (
  id BIGSERIAL PRIMARY KEY,
  hero_title TEXT NOT NULL DEFAULT 'Smart Kalkulator - Solusi POS UKM Terdepan',
  hero_subtitle TEXT NOT NULL DEFAULT 'Kelola bisnis UKM Anda dengan sistem POS terintegrasi, katalog online, dan analisis bisnis yang powerful',
  hero_cta_text TEXT NOT NULL DEFAULT 'Mulai Trial Gratis',
  features_title TEXT NOT NULL DEFAULT 'Fitur Lengkap untuk Bisnis UKM',
  pricing_title TEXT NOT NULL DEFAULT 'Paket Berlangganan',
  trial_days INTEGER NOT NULL DEFAULT 14,
  monthly_price DOUBLE PRECISION NOT NULL DEFAULT 99000,
  yearly_price DOUBLE PRECISION NOT NULL DEFAULT 990000,
  contact_email TEXT NOT NULL DEFAULT 'support@smartkalkulator.com',
  contact_phone TEXT NOT NULL DEFAULT '081234567890',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default landing page settings
INSERT INTO landing_page_settings (id) VALUES (1);

CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
