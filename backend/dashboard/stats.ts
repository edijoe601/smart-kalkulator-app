import { api } from "encore.dev/api";

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalIngredients: number;
  totalRecipes: number;
}

// Retrieves dashboard statistics.
export const getStats = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/dashboard/stats" },
  async () => {
    // Mock data for now - in real app this would query the database
    return {
      totalRevenue: 55810,
      totalTransactions: 6,
      totalIngredients: 10,
      totalRecipes: 6
    };
  }
);
