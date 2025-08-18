import { api } from "encore.dev/api";
import { recipesDB } from "./db";
import { Recipe } from "./list";

export interface CreateRecipeIngredient {
  ingredientId: number;
  quantity: number;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  servingSize: number;
  preparationTime?: number;
  cookingTime?: number;
  ingredients: CreateRecipeIngredient[];
}

// Creates a new recipe with ingredients.
export const create = api<CreateRecipeRequest, Recipe>(
  { expose: true, method: "POST", path: "/recipes" },
  async (req) => {
    const tx = await recipesDB.begin();
    
    try {
      const recipeRow = await tx.queryRow<{
        id: number;
        name: string;
        description: string | null;
        serving_size: number;
        preparation_time: number | null;
        cooking_time: number | null;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO recipes (name, description, serving_size, preparation_time, cooking_time)
        VALUES (${req.name}, ${req.description || null}, ${req.servingSize}, ${req.preparationTime || null}, ${req.cookingTime || null})
        RETURNING *
      `;

      if (!recipeRow) {
        throw new Error("Failed to create recipe");
      }

      for (const ingredient of req.ingredients) {
        await tx.exec`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
          VALUES (${recipeRow.id}, ${ingredient.ingredientId}, ${ingredient.quantity})
        `;
      }

      const ingredients = await tx.queryAll<{
        ingredient_id: number;
        ingredient_name: string;
        quantity: number;
        unit: string;
      }>`
        SELECT ri.ingredient_id, i.name as ingredient_name, ri.quantity, i.unit
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ${recipeRow.id}
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
