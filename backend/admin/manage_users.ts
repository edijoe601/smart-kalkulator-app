import { api, APIError } from "encore.dev/api";
import { adminDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantRequest {
  name: string;
  email: string;
  phone?: string;
  plan: string;
}

export interface UpdateTenantRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  plan?: string;
  status?: string;
}

export interface ListTenantsResponse {
  tenants: Tenant[];
}

// Retrieves all tenants.
export const listTenants = api<void, ListTenantsResponse>(
  { auth: true, expose: true, method: "GET", path: "/admin/tenants" },
  async () => {
    const auth = getAuthData()!;
    
    if (auth.role !== 'admin') {
      throw APIError.permissionDenied("Access denied");
    }

    const tenants = await adminDB.queryAll<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      plan: string;
      status: string;
      trial_ends_at: Date | null;
      subscription_ends_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM tenants ORDER BY created_at DESC`;

    return {
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone || undefined,
        plan: t.plan,
        status: t.status,
        trialEndsAt: t.trial_ends_at || undefined,
        subscriptionEndsAt: t.subscription_ends_at || undefined,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }))
    };
  }
);

// Creates a new tenant.
export const createTenant = api<CreateTenantRequest, Tenant>(
  { auth: true, expose: true, method: "POST", path: "/admin/tenants" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== 'admin') {
      throw APIError.permissionDenied("Access denied");
    }

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const trialEndsAt = req.plan === 'trial' ? 
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null;

    const tenant = await adminDB.queryRow<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      plan: string;
      status: string;
      trial_ends_at: Date | null;
      subscription_ends_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO tenants (id, name, email, phone, plan, trial_ends_at)
      VALUES (${tenantId}, ${req.name}, ${req.email}, ${req.phone || null}, ${req.plan}, ${trialEndsAt})
      RETURNING *
    `;

    if (!tenant) {
      throw new Error("Failed to create tenant");
    }

    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || undefined,
      plan: tenant.plan,
      status: tenant.status,
      trialEndsAt: tenant.trial_ends_at || undefined,
      subscriptionEndsAt: tenant.subscription_ends_at || undefined,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at
    };
  }
);

// Updates a tenant.
export const updateTenant = api<UpdateTenantRequest, Tenant>(
  { auth: true, expose: true, method: "PUT", path: "/admin/tenants/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== 'admin') {
      throw APIError.permissionDenied("Access denied");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(req.name);
    }
    if (req.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(req.email);
    }
    if (req.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(req.phone || null);
    }
    if (req.plan !== undefined) {
      updates.push(`plan = $${paramIndex++}`);
      values.push(req.plan);
    }
    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(req.status);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE tenants 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    values.push(req.id);

    const tenant = await adminDB.rawQueryRow<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      plan: string;
      status: string;
      trial_ends_at: Date | null;
      subscription_ends_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!tenant) {
      throw APIError.notFound("Tenant not found");
    }

    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || undefined,
      plan: tenant.plan,
      status: tenant.status,
      trialEndsAt: tenant.trial_ends_at || undefined,
      subscriptionEndsAt: tenant.subscription_ends_at || undefined,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at
    };
  }
);

// Deletes a tenant.
export const deleteTenant = api<{ id: string }, { success: boolean }>(
  { auth: true, expose: true, method: "DELETE", path: "/admin/tenants/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== 'admin') {
      throw APIError.permissionDenied("Access denied");
    }

    await adminDB.exec`DELETE FROM tenants WHERE id = ${req.id}`;

    return { success: true };
  }
);
