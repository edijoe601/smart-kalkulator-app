import { api } from "encore.dev/api";
import { channelsDB } from "./db";
import { SalesChannel } from "./list_channels";

export interface CreateChannelRequest {
  name: string;
  type: string;
  description?: string;
  commissionRate?: number;
}

// Creates a new sales channel.
export const createChannel = api<CreateChannelRequest, SalesChannel>(
  { expose: true, method: "POST", path: "/channels" },
  async (req) => {
    const row = await channelsDB.queryRow<{
      id: number;
      name: string;
      type: string;
      description: string | null;
      commission_rate: number;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO sales_channels (name, type, description, commission_rate)
      VALUES (${req.name}, ${req.type}, ${req.description || null}, ${req.commissionRate || 0})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create channel");
    }

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description || undefined,
      commissionRate: row.commission_rate,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
);
