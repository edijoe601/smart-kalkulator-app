import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const promotionsDB = new SQLDatabase("promotions", {
  migrations: "./migrations",
});
