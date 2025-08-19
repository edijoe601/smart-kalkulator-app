import { api, APIError } from "encore.dev/api";
import { ingredientsDB } from "./db";
import { Ingredient } from "./list";

export interface UpdateIngredientRequest {
  id: number;
  name?: string;
  unit?: string;
  costPerUnit?: number;
  stockQuantity?: number;
  supplier?: string;
}

// Updates an existing ingredient.
export const update = api<UpdateIngredientRequest, Ingredient>(
  { expose: true, method: "PUT", path: "/ingredients/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(req.name);
    }
    if (req.unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(req.unit);
    }
    if (req.costPerUnit !== undefined) {
      updates.push(`cost_per_unit = $${paramIndex++}`);
      values.push(req.costPerUnit);
    }
    if (req.stockQuantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      values.push(req.stockQuantity);
    }
    if (req.supplier !== undefined) {
      updates.push(`supplier = $${paramIndex++}`);
      values.push(req.supplier || null);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE ingredients 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    values.push(req.id);

    const row = await ingredientsDB.rawQueryRow<{
      id: number;
      name: string;
      unit: string;
      cost_per_unit: number;
      stock_quantity: number;
      supplier: string | null;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw APIError.notFound("Ingredient not found");
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
