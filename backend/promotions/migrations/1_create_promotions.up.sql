CREATE TABLE promotions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value DOUBLE PRECISION NOT NULL,
  min_purchase DOUBLE PRECISION,
  max_discount DOUBLE PRECISION,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit INTEGER,
  current_usage INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
