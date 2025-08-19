import { api, APIError } from "encore.dev/api";
import { recipesDB } from "./db";

export interface DeleteRecipeRequest {
  id: number;
}

export interface DeleteRecipeResponse {
  success: boolean;
  message: string;
}

// Deletes a recipe and its ingredients.
export const deleteRecipe = api<DeleteRecipeRequest, DeleteRecipeResponse>(
  { expose: true, method: "DELETE", path: "/recipes/:id" },
  async (req) => {
    const tx = await recipesDB.begin();
    
    try {
      // Delete recipe ingredients first (due to foreign key constraint)
      await tx.exec`DELETE FROM recipe_ingredients WHERE recipe_id = ${req.id}`;
      
      // Delete the recipe
      await tx.exec`DELETE FROM recipes WHERE id = ${req.id}`;
      
      await tx.commit();

      return {
        success: true,
        message: "Recipe deleted successfully"
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
