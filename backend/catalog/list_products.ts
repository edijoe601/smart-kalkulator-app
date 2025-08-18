import { api } from "encore.dev/api";
import { productsDB } from "../products/db";

export interface CatalogProduct {
  id: number;
  name: string;
  description?: string;
  category?: string;
  sellingPrice: number;
  isActive: boolean;
  imageUrl?: string;
}

export interface ListCatalogProductsResponse {
  products: CatalogProduct[];
}

// Retrieves all active products for catalog.
export const listProducts = api<void, ListCatalogProductsResponse>(
  { expose: true, method: "GET", path: "/catalog/products" },
  async () => {
    const rows = await productsDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      category: string | null;
      selling_price: number;
      is_active: boolean;
    }>`
      SELECT id, name, description, category, selling_price, is_active
      FROM products
      WHERE is_active = true
      ORDER BY name
    `;

    const products: CatalogProduct[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      category: row.category || undefined,
      sellingPrice: row.selling_price,
      isActive: row.is_active
    }));

    return { products };
  }
);
