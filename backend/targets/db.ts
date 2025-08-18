import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const targetsDB = new SQLDatabase("targets", {
  migrations: "./migrations",
});
