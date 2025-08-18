import { api } from "encore.dev/api";
import { targetsDB } from "./db";
import { SalesTarget } from "./list_targets";

export interface CreateTargetRequest {
  name: string;
  description?: string;
  targetAmount: number;
  targetPeriod: string;
  startDate: Date;
  endDate: Date;
}

// Creates a new sales target.
export const createTarget = api<CreateTargetRequest, SalesTarget>(
  { expose: true, method: "POST", path: "/targets" },
  async (req) => {
    const row = await targetsDB.queryRow<{
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
    }>`
      INSERT INTO sales_targets (name, description, target_amount, target_period, start_date, end_date)
      VALUES (${req.name}, ${req.description || null}, ${req.targetAmount}, ${req.targetPeriod}, ${req.startDate}, ${req.endDate})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create target");
    }

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
  }
);
