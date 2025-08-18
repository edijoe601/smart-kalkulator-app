import { api } from "encore.dev/api";
import { ingredientsDB } from "./db";
import { Ingredient } from "./list";

export interface CreateIngredientRequest {
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity?: number;
  supplier?: string;
}

// Creates a new ingredient.
export const create = api<CreateIngredientRequest, Ingredient>(
  { expose: true, method: "POST", path: "/ingredients" },
  async (req) => {
    const row = await ingredientsDB.queryRow<{
      id: number;
      name: string;
      unit: string;
      cost_per_unit: number;
      stock_quantity: number;
      supplier: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO ingredients (name, unit, cost_per_unit, stock_quantity, supplier)
      VALUES (${req.name}, ${req.unit}, ${req.costPerUnit}, ${req.stockQuantity || 0}, ${req.supplier || null})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create ingredient");
    }

    return {
      id: row.id,
      name: row.name,
      unit: row.unit,
      costPerUnit: row.cost_per_unit,
      stockQuantity: row.stock_quantity,
      supplier: row.supplier || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
);
