import { api } from "encore.dev/api";
import { ingredientsDB } from "./db";

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListIngredientsResponse {
  ingredients: Ingredient[];
}

// Retrieves all ingredients.
export const list = api<void, ListIngredientsResponse>(
  { expose: true, method: "GET", path: "/ingredients" },
  async () => {
    const rows = await ingredientsDB.queryAll<{
      id: number;
      name: string;
      unit: string;
      cost_per_unit: number;
      stock_quantity: number;
      supplier: string | null;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM ingredients ORDER BY name`;

    const ingredients: Ingredient[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
      costPerUnit: row.cost_per_unit,
      stockQuantity: row.stock_quantity,
      supplier: row.supplier || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { ingredients };
  }
);
