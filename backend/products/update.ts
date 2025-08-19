import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";
import { Product } from "./list";

export interface UpdateProductRequest {
  id: number;
  name?: string;
  description?: string;
  recipeId?: number;
  costPrice?: number;
  sellingPrice?: number;
  category?: string;
  isActive?: boolean;
}

// Updates an existing product.
export const update = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/products/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(req.name);
    }
    if (req.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(req.description || null);
    }
    if (req.recipeId !== undefined) {
      updates.push(`recipe_id = $${paramIndex++}`);
      values.push(req.recipeId || null);
    }
    if (req.costPrice !== undefined) {
      updates.push(`cost_price = $${paramIndex++}`);
      values.push(req.costPrice);
    }
    if (req.sellingPrice !== undefined) {
      updates.push(`selling_price = $${paramIndex++}`);
      values.push(req.sellingPrice);
    }
    if (req.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(req.category || null);
    }
    if (req.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(req.isActive);
    }

    // Recalculate profit margin if prices are updated
    if (req.costPrice !== undefined || req.sellingPrice !== undefined) {
      // Get current values if only one price is being updated
      const current = await productsDB.queryRow<{
        cost_price: number;
        selling_price: number;
      }>`SELECT cost_price, selling_price FROM products WHERE id = ${req.id}`;

      if (current) {
        const costPrice = req.costPrice !== undefined ? req.costPrice : current.cost_price;
        const sellingPrice = req.sellingPrice !== undefined ? req.sellingPrice : current.selling_price;
        const profitMargin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
        
        updates.push(`profit_margin = $${paramIndex++}`);
        values.push(profitMargin);
      }
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING p.*, r.name as recipe_name
      FROM products p
      LEFT JOIN recipes r ON p.recipe_id = r.id
      WHERE p.id = $${paramIndex}
    `;

    values.push(req.id);

    const row = await productsDB.rawQueryRow<{
      id: number;
      name: string;
      description: string | null;
      recipe_id: number | null;
      recipe_name: string | null;
      cost_price: number;
      selling_price: number;
      profit_margin: number;
      category: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw APIError.notFound("Product not found");
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      recipeId: row.recipe_id || undefined,
      recipeName: row.recipe_name || undefined,
      costPrice: row.cost_price,
      sellingPrice: row.selling_price,
      profitMargin: row.profit_margin,
      category: row.category || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
);
