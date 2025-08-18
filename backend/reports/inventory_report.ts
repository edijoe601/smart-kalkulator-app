import { api } from "encore.dev/api";
import { ingredientsDB } from "../ingredients/db";
import { productsDB } from "../products/db";

export interface InventoryReportData {
  totalIngredients: number;
  totalProducts: number;
  lowStockIngredients: Array<{
    id: number;
    name: string;
    currentStock: number;
    unit: string;
    costPerUnit: number;
  }>;
  topValueIngredients: Array<{
    id: number;
    name: string;
    stockValue: number;
    unit: string;
  }>;
  activeProducts: number;
  inactiveProducts: number;
}

// Generates inventory report.
export const getInventoryReport = api<void, InventoryReportData>(
  { expose: true, method: "GET", path: "/reports/inventory" },
  async () => {
    // Get ingredients data
    const ingredients = await ingredientsDB.queryAll<{
      id: number;
      name: string;
      unit: string;
      cost_per_unit: number;
      stock_quantity: number;
    }>`SELECT id, name, unit, cost_per_unit, stock_quantity FROM ingredients`;

    // Get products data
    const products = await productsDB.queryAll<{
      is_active: boolean;
    }>`SELECT is_active FROM products`;

    const totalIngredients = ingredients.length;
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const inactiveProducts = products.filter(p => !p.is_active).length;

    // Low stock ingredients (less than 10 units)
    const lowStockIngredients = ingredients
      .filter(i => i.stock_quantity < 10)
      .map(i => ({
        id: i.id,
        name: i.name,
        currentStock: i.stock_quantity,
        unit: i.unit,
        costPerUnit: i.cost_per_unit
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    // Top value ingredients
    const topValueIngredients = ingredients
      .map(i => ({
        id: i.id,
        name: i.name,
        stockValue: i.stock_quantity * i.cost_per_unit,
        unit: i.unit
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 10);

    return {
      totalIngredients,
      totalProducts,
      lowStockIngredients,
      topValueIngredients,
      activeProducts,
      inactiveProducts
    };
  }
);
