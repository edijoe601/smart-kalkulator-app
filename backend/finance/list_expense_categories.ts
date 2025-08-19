import { api } from "encore.dev/api";
import { financeDB } from "./db";

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListExpenseCategoriesResponse {
  categories: ExpenseCategory[];
}

// Retrieves all expense categories.
export const listExpenseCategories = api<void, ListExpenseCategoriesResponse>(
  { expose: true, method: "GET", path: "/finance/expense-categories" },
  async () => {
    const categories = await financeDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM expense_categories ORDER BY name`;

    return {
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        isActive: cat.is_active,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at
      }))
    };
  }
);
