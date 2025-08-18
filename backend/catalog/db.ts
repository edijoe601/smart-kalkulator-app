import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const catalogDB = new SQLDatabase("catalog", {
  migrations: "./migrations",
});
