import { api } from "encore.dev/api";
import { shoppingDB } from "./db";

export interface ExportNeedsResponse {
  data: string;
  filename: string;
}

// Exports shopping needs to CSV format.
export const exportNeeds = api<void, ExportNeedsResponse>(
  { expose: true, method: "GET", path: "/shopping/needs/export" },
  async () => {
    const needs = await shoppingDB.queryAll<{
      ingredient_name: string;
      current_stock: number;
      required_stock: number;
      shortage: number;
      unit: string;
      cost_per_unit: number;
      total_cost: number;
      priority: string;
      status: string;
      created_at: Date;
    }>`SELECT * FROM shopping_needs ORDER BY priority DESC, total_cost DESC`;

    // Create CSV content
    const headers = [
      'Bahan Baku',
      'Stok Saat Ini',
      'Stok Dibutuhkan',
      'Kekurangan',
      'Satuan',
      'Harga per Satuan',
      'Total Biaya',
      'Prioritas',
      'Status',
      'Tanggal'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const need of needs) {
      const row = [
        `"${need.ingredient_name}"`,
        need.current_stock,
        need.required_stock,
        need.shortage,
        need.unit,
        need.cost_per_unit,
        need.total_cost,
        need.priority,
        need.status,
        new Date(need.created_at).toLocaleDateString('id-ID')
      ];
      csvContent += row.join(',') + '\n';
    }

    const filename = `kebutuhan-belanja-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename
    };
  }
);
