import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const productsDB = new SQLDatabase("products", {
  migrations: "./migrations",
});
