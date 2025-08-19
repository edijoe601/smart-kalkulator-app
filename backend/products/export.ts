import { api } from "encore.dev/api";
import { productsDB } from "./db";

export interface ExportProductsResponse {
  data: string;
  filename: string;
}

// Exports products to CSV format.
export const exportProducts = api<void, ExportProductsResponse>(
  { expose: true, method: "GET", path: "/products/export" },
  async () => {
    const products = await productsDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      recipe_name: string | null;
      cost_price: number;
      selling_price: number;
      profit_margin: number;
      category: string | null;
      is_active: boolean;
      created_at: Date;
    }>`
      SELECT p.*, r.name as recipe_name
      FROM products p
      LEFT JOIN recipes r ON p.recipe_id = r.id
      ORDER BY p.name
    `;

    // Create CSV content
    const headers = [
      'ID',
      'Nama Produk',
      'Deskripsi',
      'Resep',
      'HPP',
      'Harga Jual',
      'Margin (%)',
      'Kategori',
      'Status',
      'Tanggal Dibuat'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const product of products) {
      const row = [
        product.id,
        `"${product.name}"`,
        product.description ? `"${product.description}"` : '',
        product.recipe_name ? `"${product.recipe_name}"` : '',
        product.cost_price,
        product.selling_price,
        product.profit_margin.toFixed(2),
        product.category ? `"${product.category}"` : '',
        product.is_active ? 'Aktif' : 'Nonaktif',
        new Date(product.created_at).toLocaleDateString('id-ID')
      ];
      csvContent += row.join(',') + '\n';
    }

    const filename = `produk-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename
    };
  }
);
