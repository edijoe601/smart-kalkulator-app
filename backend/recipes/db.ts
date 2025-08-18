import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const recipesDB = new SQLDatabase("recipes", {
  migrations: "./migrations",
});
