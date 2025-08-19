import { api } from "encore.dev/api";
import { recipesDB } from "./db";

export interface ExportRecipesResponse {
  data: string;
  filename: string;
}

// Exports recipes to CSV format.
export const exportRecipes = api<void, ExportRecipesResponse>(
  { expose: true, method: "GET", path: "/recipes/export" },
  async () => {
    const recipes = await recipesDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      serving_size: number;
      preparation_time: number | null;
      cooking_time: number | null;
      created_at: Date;
    }>`SELECT * FROM recipes ORDER BY name`;

    // Create CSV content
    const headers = [
      'ID',
      'Nama Resep',
      'Deskripsi',
      'Porsi',
      'Waktu Persiapan (menit)',
      'Waktu Memasak (menit)',
      'Bahan-bahan',
      'Tanggal Dibuat'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const recipe of recipes) {
      // Get ingredients for this recipe
      const ingredients = await recipesDB.queryAll<{
        ingredient_name: string;
        quantity: number;
        unit: string;
      }>`
        SELECT i.name as ingredient_name, ri.quantity, i.unit
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ${recipe.id}
        ORDER BY i.name
      `;

      const ingredientsList = ingredients.map(ing => 
        `${ing.quantity} ${ing.unit} ${ing.ingredient_name}`
      ).join('; ');

      const row = [
        recipe.id,
        `"${recipe.name}"`,
        recipe.description ? `"${recipe.description}"` : '',
        recipe.serving_size,
        recipe.preparation_time || '',
        recipe.cooking_time || '',
        `"${ingredientsList}"`,
        new Date(recipe.created_at).toLocaleDateString('id-ID')
      ];
      csvContent += row.join(',') + '\n';
    }

    const filename = `resep-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename
    };
  }
);
