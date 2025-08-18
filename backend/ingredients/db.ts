import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const ingredientsDB = new SQLDatabase("ingredients", {
  migrations: "./migrations",
});
