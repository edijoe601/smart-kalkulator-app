import { api } from "encore.dev/api";
import { shoppingDB } from "./db";
import { ShoppingNeed } from "./calculate_needs";

export interface ListNeedsResponse {
  needs: ShoppingNeed[];
  totalCost: number;
}

// Retrieves all shopping needs.
export const listNeeds = api<void, ListNeedsResponse>(
  { expose: true, method: "GET", path: "/shopping/needs" },
  async () => {
    const needs = await shoppingDB.queryAll<{
      id: number;
      ingredient_id: number;
      ingredient_name: string;
      current_stock: number;
      required_stock: number;
      shortage: number;
      unit: string;
      cost_per_unit: number;
      total_cost: number;
      priority: string;
      status: string;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM shopping_needs ORDER BY priority DESC, total_cost DESC`;

    const totalCost = needs.reduce((sum, need) => sum + need.total_cost, 0);

    return {
      needs: needs.map(need => ({
        id: need.id,
        ingredientId: need.ingredient_id,
        ingredientName: need.ingredient_name,
        currentStock: need.current_stock,
        requiredStock: need.required_stock,
        shortage: need.shortage,
        unit: need.unit,
        costPerUnit: need.cost_per_unit,
        totalCost: need.total_cost,
        priority: need.priority,
        status: need.status,
        notes: need.notes || undefined,
        createdAt: need.created_at,
        updatedAt: need.updated_at
      })),
      totalCost
    };
  }
);
