import { api } from "encore.dev/api";
import { adminDB } from "./db";

export interface SampleAccountInfo {
  type: "admin" | "tenant" | "user";
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  status?: string;
  plan?: string;
  trialEndsAt?: Date;
}

export interface ListSampleAccountsResponse {
  accounts: SampleAccountInfo[];
  instructions: string[];
}

export const listSampleAccounts = api(
  { method: "GET", path: "/admin/sample-accounts", expose: true },
  async (): Promise<ListSampleAccountsResponse> => {
    const accounts: SampleAccountInfo[] = [];

    // Get admin accounts
    const adminAccounts = await adminDB.query`
      SELECT id, email, name, role, is_active
      FROM admin_users
      WHERE email IN ('admin@smartkalkulator.com')
    `;

    for await (const admin of adminAccounts) {
      accounts.push({
        type: "admin",
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.is_active ? "active" : "inactive"
      });
    }

    // Get tenant accounts
    const tenantAccounts = await adminDB.query`
      SELECT id, name, email, phone, plan, status, trial_ends_at
      FROM tenants
      WHERE email IN ('demo@example.com')
    `;

    for await (const tenant of tenantAccounts) {
      accounts.push({
        type: "tenant",
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        role: "tenant_owner",
        tenantId: tenant.id,
        status: tenant.status,
        plan: tenant.plan,
        trialEndsAt: tenant.trial_ends_at
      });
    }

    // Add sample user info (not stored in DB but should be configured in Clerk)
    accounts.push({
      type: "user",
      id: "user_demo_001",
      email: "kasir@example.com",
      name: "Kasir Demo",
      role: "user",
      tenantId: "tenant_demo_001"
    });

    const instructions = [
      "SAMPLE ACCOUNT CREDENTIALS:",
      "",
      "1. ADMIN ACCOUNT:",
      "   Email: admin@smartkalkulator.com",
      "   Password: admin123",
      "   Role: Super Admin",
      "   Access: Full system administration",
      "",
      "2. TENANT OWNER ACCOUNT:",
      "   Email: demo@example.com", 
      "   Password: demo123",
      "   Role: Tenant Owner",
      "   Business: Demo Toko Sembako",
      "   Access: Full business management",
      "",
      "3. CASHIER/USER ACCOUNT:",
      "   Email: kasir@example.com",
      "   Password: kasir123", 
      "   Role: User/Cashier",
      "   Business: Demo Toko Sembako",
      "   Access: POS, basic operations",
      "",
      "NOTE: These accounts need to be configured in Clerk with the specified emails and metadata.",
      "The admin and tenant records are stored in the database, but user authentication is handled by Clerk."
    ];

    return {
      accounts,
      instructions
    };
  }
);