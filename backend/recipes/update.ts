import { api, APIError } from "encore.dev/api";
import { recipesDB } from "./db";
import { Recipe, RecipeIngredient } from "./list";

export interface UpdateRecipeIngredient {
  ingredientId: number;
  quantity: number;
}

export interface UpdateRecipeRequest {
  id: number;
  name?: string;
  description?: string;
  servingSize?: number;
  preparationTime?: number;
  cookingTime?: number;
  ingredients?: UpdateRecipeIngredient[];
}

// Updates an existing recipe.
export const update = api<UpdateRecipeRequest, Recipe>(
  { expose: true, method: "PUT", path: "/recipes/:id" },
  async (req) => {
    const tx = await recipesDB.begin();
    
    try {
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
      if (req.servingSize !== undefined) {
        updates.push(`serving_size = $${paramIndex++}`);
        values.push(req.servingSize);
      }
      if (req.preparationTime !== undefined) {
        updates.push(`preparation_time = $${paramIndex++}`);
        values.push(req.preparationTime || null);
      }
      if (req.cookingTime !== undefined) {
        updates.push(`cooking_time = $${paramIndex++}`);
        values.push(req.cookingTime || null);
      }

      updates.push(`updated_at = NOW()`);

      const query = `
        UPDATE recipes 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      values.push(req.id);

      const recipeRow = await tx.rawQueryRow<{
        id: number;
        name: string;
        description: string | null;
        serving_size: number;
        preparation_time: number | null;
        cooking_time: number | null;
        created_at: Date;
        updated_at: Date;
      }>(query, ...values);

      if (!recipeRow) {
        throw APIError.notFound("Recipe not found");
      }

      // Update ingredients if provided
      if (req.ingredients !== undefined) {
        // Delete existing ingredients
        await tx.exec`DELETE FROM recipe_ingredients WHERE recipe_id = ${req.id}`;

        // Insert new ingredients
        for (const ingredient of req.ingredients) {
          await tx.exec`
            INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
            VALUES (${req.id}, ${ingredient.ingredientId}, ${ingredient.quantity})
          `;
        }
      }

      // Get updated ingredients
      const ingredients = await tx.queryAll<{
        ingredient_id: number;
        ingredient_name: string;
        quantity: number;
        unit: string;
      }>`
        SELECT ri.ingredient_id, i.name as ingredient_name, ri.quantity, i.unit
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ${req.id}
        ORDER BY i.name
      `;

      await tx.commit();

      return {
        id: recipeRow.id,
        name: recipeRow.name,
        description: recipeRow.description || undefined,
        servingSize: recipeRow.serving_size,
        preparationTime: recipeRow.preparation_time || undefined,
        cookingTime: recipeRow.cooking_time || undefined,
        ingredients: ingredients.map(ing => ({
          ingredientId: ing.ingredient_id,
          ingredientName: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        createdAt: recipeRow.created_at,
        updatedAt: recipeRow.updated_at
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
