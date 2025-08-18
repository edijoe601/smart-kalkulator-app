import { api } from "encore.dev/api";
import { productsDB } from "./db";
import { Product } from "./list";

export interface CreateProductRequest {
  name: string;
  description?: string;
  recipeId?: number;
  costPrice: number;
  sellingPrice: number;
  category?: string;
  isActive?: boolean;
}

// Creates a new product.
export const create = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (req) => {
    const profitMargin = ((req.sellingPrice - req.costPrice) / req.sellingPrice) * 100;

    const row = await productsDB.queryRow<{
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
    }>`
      INSERT INTO products (name, description, recipe_id, cost_price, selling_price, profit_margin, category, is_active)
      VALUES (${req.name}, ${req.description || null}, ${req.recipeId || null}, ${req.costPrice}, ${req.sellingPrice}, ${profitMargin}, ${req.category || null}, ${req.isActive !== false})
      RETURNING p.*, r.name as recipe_name
      FROM products p
      LEFT JOIN recipes r ON p.recipe_id = r.id
      WHERE p.id = (SELECT currval('products_id_seq'))
    `;

    if (!row) {
      throw new Error("Failed to create product");
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
