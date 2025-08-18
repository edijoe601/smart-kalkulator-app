import { api } from "encore.dev/api";
import { productsDB } from "./db";

export interface Product {
  id: number;
  name: string;
  description?: string;
  recipeId?: number;
  recipeName?: string;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsResponse {
  products: Product[];
}

// Retrieves all products.
export const list = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async () => {
    const rows = await productsDB.queryAll<{
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
      SELECT p.*, r.name as recipe_name
      FROM products p
      LEFT JOIN recipes r ON p.recipe_id = r.id
      ORDER BY p.name
    `;

    const products: Product[] = rows.map(row => ({
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
    }));

    return { products };
  }
);
