import { api } from "encore.dev/api";
import { shoppingDB } from "./db";
import { ingredientsDB } from "../ingredients/db";
import { recipesDB } from "../recipes/db";

export interface CalculateNeedsRequest {
  recipes?: Array<{
    recipeId: number;
    quantity: number;
  }>;
  minStockDays?: number;
}

export interface ShoppingNeed {
  id: number;
  ingredientId: number;
  ingredientName: string;
  currentStock: number;
  requiredStock: number;
  shortage: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  priority: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculateNeedsResponse {
  needs: ShoppingNeed[];
  totalCost: number;
}

// Calculates shopping needs based on current stock and recipe requirements.
export const calculateNeeds = api<CalculateNeedsRequest, CalculateNeedsResponse>(
  { expose: true, method: "POST", path: "/shopping/calculate-needs" },
  async (req) => {
    const minStockDays = req.minStockDays || 7;
    
    // Get all ingredients with current stock
    const ingredients = await ingredientsDB.queryAll<{
      id: number;
      name: string;
      unit: string;
      cost_per_unit: number;
      stock_quantity: number;
    }>`SELECT id, name, unit, cost_per_unit, stock_quantity FROM ingredients`;

    const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]));
    const requiredIngredients = new Map<number, number>();

    // Calculate requirements from recipes if provided
    if (req.recipes && req.recipes.length > 0) {
      for (const recipeReq of req.recipes) {
        const recipeIngredients = await recipesDB.queryAll<{
          ingredient_id: number;
          quantity: number;
        }>`
          SELECT ingredient_id, quantity 
          FROM recipe_ingredients 
          WHERE recipe_id = ${recipeReq.recipeId}
        `;

        for (const recipeIng of recipeIngredients) {
          const totalRequired = recipeIng.quantity * recipeReq.quantity;
          const current = requiredIngredients.get(recipeIng.ingredient_id) || 0;
          requiredIngredients.set(recipeIng.ingredient_id, current + totalRequired);
        }
      }
    }

    // Clear existing shopping needs
    await shoppingDB.exec`DELETE FROM shopping_needs`;

    const needs: ShoppingNeed[] = [];
    let totalCost = 0;

    for (const ingredient of ingredients) {
      const requiredForRecipes = requiredIngredients.get(ingredient.id) || 0;
      const minStockRequired = ingredient.stock_quantity * (minStockDays / 30); // Assume 30 days average usage
      const totalRequired = Math.max(requiredForRecipes, minStockRequired);
      
      if (ingredient.stock_quantity < totalRequired) {
        const shortage = totalRequired - ingredient.stock_quantity;
        const cost = shortage * ingredient.cost_per_unit;
        
        let priority = 'medium';
        if (ingredient.stock_quantity <= 0) {
          priority = 'high';
        } else if (shortage > totalRequired * 0.5) {
          priority = 'high';
        } else if (shortage < totalRequired * 0.2) {
          priority = 'low';
        }

        const needRow = await shoppingDB.queryRow<{
          id: number;
          ingredient_id: number;
          ingredient_name: string;
          current_stock: number;
          required_stock: number;
          shortage: number;
          unit: string;
          cost_per_unit: number;
          total_cost: number;
          priority: string;
          status: string;
          notes: string | null;
          created_at: Date;
          updated_at: Date;
        }>`
          INSERT INTO shopping_needs (
            ingredient_id, ingredient_name, current_stock, required_stock, 
            shortage, unit, cost_per_unit, total_cost, priority
          )
          VALUES (
            ${ingredient.id}, ${ingredient.name}, ${ingredient.stock_quantity}, 
            ${totalRequired}, ${shortage}, ${ingredient.unit}, 
            ${ingredient.cost_per_unit}, ${cost}, ${priority}
          )
          RETURNING *
        `;

        if (needRow) {
          needs.push({
            id: needRow.id,
            ingredientId: needRow.ingredient_id,
            ingredientName: needRow.ingredient_name,
            currentStock: needRow.current_stock,
            requiredStock: needRow.required_stock,
            shortage: needRow.shortage,
            unit: needRow.unit,
            costPerUnit: needRow.cost_per_unit,
            totalCost: needRow.total_cost,
            priority: needRow.priority,
            status: needRow.status,
            notes: needRow.notes || undefined,
            createdAt: needRow.created_at,
            updatedAt: needRow.updated_at
          });

          totalCost += cost;
        }
      }
    }

    return { needs, totalCost };
  }
);
