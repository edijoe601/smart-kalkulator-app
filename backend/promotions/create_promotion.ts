import { api } from "encore.dev/api";
import { promotionsDB } from "./db";
import { Promotion } from "./list_promotions";

export interface CreatePromotionRequest {
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
  channel?: string;
}

// Creates a new promotion.
export const createPromotion = api<CreatePromotionRequest, Promotion>(
  { expose: true, method: "POST", path: "/promotions" },
  async (req) => {
    const row = await promotionsDB.queryRow<{
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
    }>`
      INSERT INTO promotions (
        name, description, type, discount_type, discount_value, 
        min_purchase, max_discount, start_date, end_date, usage_limit, channel
      )
      VALUES (
        ${req.name}, ${req.description || null}, ${req.type}, ${req.discountType}, ${req.discountValue},
        ${req.minPurchase || null}, ${req.maxDiscount || null}, ${req.startDate}, ${req.endDate}, 
        ${req.usageLimit || null}, ${req.channel || null}
      )
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create promotion");
    }

    return {
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
    };
  }
);
