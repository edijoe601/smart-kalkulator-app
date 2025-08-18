import { api } from "encore.dev/api";
import { promotionsDB } from "./db";

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: string;
  discountType: string;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  currentUsage: number;
  isActive: boolean;
  channel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPromotionsResponse {
  promotions: Promotion[];
}

// Retrieves all promotions.
export const listPromotions = api<void, ListPromotionsResponse>(
  { expose: true, method: "GET", path: "/promotions" },
  async () => {
    const rows = await promotionsDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      type: string;
      discount_type: string;
      discount_value: number;
      min_purchase: number | null;
      max_discount: number | null;
      start_date: Date;
      end_date: Date;
      usage_limit: number | null;
      current_usage: number;
      is_active: boolean;
      channel: string | null;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM promotions ORDER BY created_at DESC`;

    const promotions: Promotion[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      type: row.type,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      minPurchase: row.min_purchase || undefined,
      maxDiscount: row.max_discount || undefined,
      startDate: row.start_date,
      endDate: row.end_date,
      usageLimit: row.usage_limit || undefined,
      currentUsage: row.current_usage,
      isActive: row.is_active,
      channel: row.channel || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { promotions };
  }
);
