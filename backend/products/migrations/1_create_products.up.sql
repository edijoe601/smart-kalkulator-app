CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  recipe_id BIGINT,
  cost_price DOUBLE PRECISION NOT NULL,
  selling_price DOUBLE PRECISION NOT NULL,
  profit_margin DOUBLE PRECISION NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
