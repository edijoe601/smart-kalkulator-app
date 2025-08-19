import { api } from "encore.dev/api";
import { ingredientsDB } from "./db";

export interface ExportIngredientsResponse {
  data: string;
  filename: string;
}

// Exports ingredients to CSV format.
export const exportIngredients = api<void, ExportIngredientsResponse>(
  { expose: true, method: "GET", path: "/ingredients/export" },
  async () => {
    const ingredients = await ingredientsDB.queryAll<{
      id: number;
      name: string;
      unit: string;
      cost_per_unit: number;
      stock_quantity: number;
      supplier: string | null;
      created_at: Date;
    }>`SELECT * FROM ingredients ORDER BY name`;

    // Create CSV content
    const headers = [
      'ID',
      'Nama Bahan',
      'Satuan',
      'Harga per Satuan',
      'Stok',
      'Supplier',
      'Tanggal Dibuat'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const ingredient of ingredients) {
      const row = [
        ingredient.id,
        `"${ingredient.name}"`,
        ingredient.unit,
        ingredient.cost_per_unit,
        ingredient.stock_quantity,
        ingredient.supplier ? `"${ingredient.supplier}"` : '',
        new Date(ingredient.created_at).toLocaleDateString('id-ID')
      ];
      csvContent += row.join(',') + '\n';
    }

    const filename = `bahan-baku-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename
    };
  }
);
