import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface DeleteProductRequest {
  id: number;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

// Deletes a product.
export const deleteProduct = api<DeleteProductRequest, DeleteProductResponse>(
  { expose: true, method: "DELETE", path: "/products/:id" },
  async (req) => {
    const result = await productsDB.exec`
      DELETE FROM products WHERE id = ${req.id}
    `;

    return {
      success: true,
      message: "Product deleted successfully"
    };
  }
);
