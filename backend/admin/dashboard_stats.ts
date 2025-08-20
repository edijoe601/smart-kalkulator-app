import { api } from "encore.dev/api";
import { adminDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface AdminDashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  inactiveSubscriptions: number;
  totalSubscriptions: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  trialUsers: number;
  paidUsers: number;
}

// Retrieves admin dashboard statistics.
export const getAdminDashboardStats = api<void, AdminDashboardStats>(
  { auth: true, expose: true, method: "GET", path: "/admin/dashboard/stats" },
  async () => {
    const auth = getAuthData()!;
    
    if (auth.role !== 'admin') {
      throw new Error("Access denied");
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get user counts
    const totalUsers = await adminDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM tenants
    `;

    const activeSubscriptions = await adminDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE status = 'active' AND ends_at > NOW()
    `;

    const inactiveSubscriptions = await adminDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE status != 'active' OR ends_at <= NOW()
    `;

    const totalSubscriptions = await adminDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM subscriptions
    `;

    const trialUsers = await adminDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM tenants 
      WHERE plan = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at > NOW())
    `;

    const paidUsers = await adminDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM tenants 
      WHERE plan != 'trial'
    `;

    // Get revenue data
    const todayRevenue = await adminDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE status = 'paid' AND DATE(paid_at) = DATE(NOW())
    `;

    const yesterdayRevenue = await adminDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE status = 'paid' AND DATE(paid_at) = DATE(NOW() - INTERVAL '1 day')
    `;

    const monthRevenue = await adminDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE status = 'paid' AND paid_at >= DATE_TRUNC('month', NOW())
    `;

    const totalRevenue = await adminDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE status = 'paid'
    `;

    return {
      totalUsers: totalUsers?.count || 0,
      activeSubscriptions: activeSubscriptions?.count || 0,
      inactiveSubscriptions: inactiveSubscriptions?.count || 0,
      totalSubscriptions: totalSubscriptions?.count || 0,
      todayRevenue: todayRevenue?.total || 0,
      yesterdayRevenue: yesterdayRevenue?.total || 0,
      monthRevenue: monthRevenue?.total || 0,
      totalRevenue: totalRevenue?.total || 0,
      trialUsers: trialUsers?.count || 0,
      paidUsers: paidUsers?.count || 0
    };
  }
);
