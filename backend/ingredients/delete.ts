import { api, APIError } from "encore.dev/api";
import { ingredientsDB } from "./db";

export interface DeleteIngredientRequest {
  id: number;
}

export interface DeleteIngredientResponse {
  success: boolean;
  message: string;
}

// Deletes an ingredient.
export const deleteIngredient = api<DeleteIngredientRequest, DeleteIngredientResponse>(
  { expose: true, method: "DELETE", path: "/ingredients/:id" },
  async (req) => {
    const result = await ingredientsDB.exec`
      DELETE FROM ingredients WHERE id = ${req.id}
    `;

    return {
      success: true,
      message: "Ingredient deleted successfully"
    };
  }
);
