import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const settingsDB = new SQLDatabase("settings", {
  migrations: "./migrations",
});
