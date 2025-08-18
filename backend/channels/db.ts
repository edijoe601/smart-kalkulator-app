import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const channelsDB = new SQLDatabase("channels", {
  migrations: "./migrations",
});
