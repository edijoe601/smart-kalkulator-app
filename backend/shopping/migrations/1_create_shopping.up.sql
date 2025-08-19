CREATE TABLE shopping_needs (
  id BIGSERIAL PRIMARY KEY,
  ingredient_id BIGINT NOT NULL,
  ingredient_name TEXT NOT NULL,
  current_stock DOUBLE PRECISION NOT NULL,
  required_stock DOUBLE PRECISION NOT NULL,
  shortage DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit DOUBLE PRECISION NOT NULL,
  total_cost DOUBLE PRECISION NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shopping_lists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_items INTEGER NOT NULL DEFAULT 0,
  total_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shopping_list_items (
  id BIGSERIAL PRIMARY KEY,
  shopping_list_id BIGINT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit DOUBLE PRECISION NOT NULL,
  total_cost DOUBLE PRECISION NOT NULL,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
