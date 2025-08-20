-- Add tenant support to sales tables
ALTER TABLE sales_transactions ADD COLUMN tenant_id TEXT;
ALTER TABLE sales_targets ADD COLUMN tenant_id TEXT;

-- Add indexes for better performance
CREATE INDEX idx_sales_transactions_tenant_id ON sales_transactions(tenant_id);
CREATE INDEX idx_sales_transactions_created_at ON sales_transactions(created_at);
CREATE INDEX idx_sales_targets_tenant_id ON sales_targets(tenant_id);
