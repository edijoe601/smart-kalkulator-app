import { api } from "encore.dev/api";
import { shoppingDB } from "./db";

export interface CreateShoppingListRequest {
  name: string;
  description?: string;
  needIds: number[];
}

export interface ShoppingList {
  id: number;
  name: string;
  description?: string;
  totalItems: number;
  totalCost: number;
  status: string;
  items: Array<{
    id: number;
    ingredientId: number;
    ingredientName: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
    isPurchased: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a shopping list from selected needs.
export const createShoppingList = api<CreateShoppingListRequest, ShoppingList>(
  { expose: true, method: "POST", path: "/shopping/lists" },
  async (req) => {
    const tx = await shoppingDB.begin();
    
    try {
      // Get selected needs
      const needs = await tx.queryAll<{
        ingredient_id: number;
        ingredient_name: string;
        shortage: number;
        unit: string;
        cost_per_unit: number;
        total_cost: number;
      }>`
        SELECT ingredient_id, ingredient_name, shortage, unit, cost_per_unit, total_cost
        FROM shopping_needs 
        WHERE id = ANY(${req.needIds})
      `;

      const totalItems = needs.length;
      const totalCost = needs.reduce((sum, need) => sum + need.total_cost, 0);

      // Create shopping list
      const listRow = await tx.queryRow<{
        id: number;
        name: string;
        description: string | null;
        total_items: number;
        total_cost: number;
        status: string;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO shopping_lists (name, description, total_items, total_cost)
        VALUES (${req.name}, ${req.description || null}, ${totalItems}, ${totalCost})
        RETURNING *
      `;

      if (!listRow) {
        throw new Error("Failed to create shopping list");
      }

      // Add items to shopping list
      const items = [];
      for (const need of needs) {
        const itemRow = await tx.queryRow<{
          id: number;
          ingredient_id: number;
          ingredient_name: string;
          quantity: number;
          unit: string;
          cost_per_unit: number;
          total_cost: number;
          is_purchased: boolean;
        }>`
          INSERT INTO shopping_list_items (
            shopping_list_id, ingredient_id, ingredient_name, quantity, 
            unit, cost_per_unit, total_cost
          )
          VALUES (
            ${listRow.id}, ${need.ingredient_id}, ${need.ingredient_name}, 
            ${need.shortage}, ${need.unit}, ${need.cost_per_unit}, ${need.total_cost}
          )
          RETURNING *
        `;

        if (itemRow) {
          items.push({
            id: itemRow.id,
            ingredientId: itemRow.ingredient_id,
            ingredientName: itemRow.ingredient_name,
            quantity: itemRow.quantity,
            unit: itemRow.unit,
            costPerUnit: itemRow.cost_per_unit,
            totalCost: itemRow.total_cost,
            isPurchased: itemRow.is_purchased
          });
        }
      }

      // Mark needs as processed
      await tx.exec`
        UPDATE shopping_needs 
        SET status = 'in_list' 
        WHERE id = ANY(${req.needIds})
      `;

      await tx.commit();

      return {
        id: listRow.id,
        name: listRow.name,
        description: listRow.description || undefined,
        totalItems: listRow.total_items,
        totalCost: listRow.total_cost,
        status: listRow.status,
        items,
        createdAt: listRow.created_at,
        updatedAt: listRow.updated_at
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
