import { api } from "encore.dev/api";
import { recipesDB } from "./db";

export interface RecipeIngredient {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  servingSize: number;
  preparationTime?: number;
  cookingTime?: number;
  ingredients: RecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListRecipesResponse {
  recipes: Recipe[];
}

// Retrieves all recipes with their ingredients.
export const list = api<void, ListRecipesResponse>(
  { expose: true, method: "GET", path: "/recipes" },
  async () => {
    const recipes = await recipesDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      serving_size: number;
      preparation_time: number | null;
      cooking_time: number | null;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM recipes ORDER BY name`;

    const recipesWithIngredients: Recipe[] = [];

    for (const recipe of recipes) {
      const ingredients = await recipesDB.queryAll<{
        ingredient_id: number;
        ingredient_name: string;
        quantity: number;
        unit: string;
      }>`
        SELECT ri.ingredient_id, i.name as ingredient_name, ri.quantity, i.unit
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ${recipe.id}
        ORDER BY i.name
      `;

      recipesWithIngredients.push({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description || undefined,
        servingSize: recipe.serving_size,
        preparationTime: recipe.preparation_time || undefined,
        cookingTime: recipe.cooking_time || undefined,
        ingredients: ingredients.map(ing => ({
          ingredientId: ing.ingredient_id,
          ingredientName: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at
      });
    }

    return { recipes: recipesWithIngredients };
  }
);
