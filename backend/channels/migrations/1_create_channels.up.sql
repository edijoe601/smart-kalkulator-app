CREATE TABLE sales_channels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  commission_rate DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sales channels
INSERT INTO sales_channels (name, type, description, commission_rate) VALUES
('Toko Offline', 'offline', 'Penjualan langsung di toko fisik', 0),
('Katalog Online', 'online', 'Penjualan melalui katalog online', 0),
('Shopee', 'marketplace', 'Marketplace Shopee', 2.5),
('Tokopedia', 'marketplace', 'Marketplace Tokopedia', 2.5),
('Lazada', 'marketplace', 'Marketplace Lazada', 3.0),
('Bukalapak', 'marketplace', 'Marketplace Bukalapak', 2.0),
('WhatsApp Business', 'social', 'Penjualan melalui WhatsApp', 0),
('Instagram', 'social', 'Penjualan melalui Instagram', 0),
('Facebook', 'social', 'Penjualan melalui Facebook', 0);
