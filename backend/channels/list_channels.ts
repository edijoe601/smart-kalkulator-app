import { api } from "encore.dev/api";
import { channelsDB } from "./db";

export interface SalesChannel {
  id: number;
  name: string;
  type: string;
  description?: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListChannelsResponse {
  channels: SalesChannel[];
}

// Retrieves all sales channels.
export const listChannels = api<void, ListChannelsResponse>(
  { expose: true, method: "GET", path: "/channels" },
  async () => {
    const rows = await channelsDB.queryAll<{
      id: number;
      name: string;
      type: string;
      description: string | null;
      commission_rate: number;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM sales_channels ORDER BY type, name`;

    const channels: SalesChannel[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description || undefined,
      commissionRate: row.commission_rate,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { channels };
  }
);
