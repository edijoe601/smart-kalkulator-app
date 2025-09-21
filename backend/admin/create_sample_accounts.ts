import { api } from "encore.dev/api";
import { adminDB } from "./db";

export interface CreateSampleAccountsRequest {
  force?: boolean;
}

export interface SampleAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  password?: string;
}

export interface CreateSampleAccountsResponse {
  accounts: SampleAccount[];
  message: string;
}

export const createSampleAccounts = api(
  { method: "POST", path: "/admin/create-sample-accounts", expose: true },
  async (req: CreateSampleAccountsRequest): Promise<CreateSampleAccountsResponse> => {
    const { force = false } = req;

    // Check if sample accounts already exist
    const existingAdmin = await adminDB.queryRow`
      SELECT id FROM admin_users WHERE email = 'admin@smartkalkulator.com'
    `;

    const existingTenant = await adminDB.queryRow`
      SELECT id FROM tenants WHERE email = 'demo@example.com'
    `;

    if ((existingAdmin || existingTenant) && !force) {
      throw new Error("Sample accounts already exist. Use force=true to recreate.");
    }

    const accounts: SampleAccount[] = [];

    // Create sample admin account
    const adminId = "admin_sample_001";
    
    if (existingAdmin && force) {
      await adminDB.exec`
        DELETE FROM admin_users WHERE email = 'admin@smartkalkulator.com'
      `;
    }

    await adminDB.exec`
      INSERT INTO admin_users (id, email, name, role, is_active)
      VALUES (${adminId}, 'admin@smartkalkulator.com', 'Admin Sample', 'super_admin', true)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;

    accounts.push({
      id: adminId,
      email: "admin@smartkalkulator.com",
      name: "Admin Sample",
      role: "super_admin",
      password: "admin123"
    });

    // Create sample tenant/user account
    const tenantId = "tenant_demo_001";
    
    if (existingTenant && force) {
      await adminDB.exec`
        DELETE FROM tenants WHERE email = 'demo@example.com'
      `;
    }

    await adminDB.exec`
      INSERT INTO tenants (id, name, email, phone, plan, status, trial_ends_at)
      VALUES (
        ${tenantId}, 
        'Demo Toko Sembako', 
        'demo@example.com', 
        '081234567890',
        'trial',
        'active',
        NOW() + INTERVAL '30 days'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        plan = EXCLUDED.plan,
        status = EXCLUDED.status,
        trial_ends_at = EXCLUDED.trial_ends_at,
        updated_at = NOW()
    `;

    accounts.push({
      id: tenantId,
      email: "demo@example.com",
      name: "Demo Toko Sembako",
      role: "tenant_owner",
      tenantId: tenantId,
      password: "demo123"
    });

    // Create additional sample user for the tenant
    const userId = "user_demo_001";
    
    accounts.push({
      id: userId,
      email: "kasir@example.com",
      name: "Kasir Demo",
      role: "user",
      tenantId: tenantId,
      password: "kasir123"
    });

    return {
      accounts,
      message: "Sample accounts created successfully. These are demo credentials for testing purposes."
    };
  }
);