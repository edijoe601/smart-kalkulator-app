import { api } from "encore.dev/api";
import { targetsDB } from "./db";

export interface SalesTarget {
  id: number;
  name: string;
  description?: string;
  targetAmount: number;
  targetPeriod: string;
  startDate: Date;
  endDate: Date;
  currentAmount: number;
  isActive: boolean;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTargetsResponse {
  targets: SalesTarget[];
}

// Retrieves all sales targets.
export const listTargets = api<void, ListTargetsResponse>(
  { expose: true, method: "GET", path: "/targets" },
  async () => {
    const rows = await targetsDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      target_amount: number;
      target_period: string;
      start_date: Date;
      end_date: Date;
      current_amount: number;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM sales_targets ORDER BY created_at DESC`;

    const targets: SalesTarget[] = rows.map(row => {
      const progress = row.target_amount > 0 ? (row.current_amount / row.target_amount) * 100 : 0;
      
      return {
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        targetAmount: row.target_amount,
        targetPeriod: row.target_period,
        startDate: row.start_date,
        endDate: row.end_date,
        currentAmount: row.current_amount,
        isActive: row.is_active,
        progress: Math.min(progress, 100),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return { targets };
  }
);
