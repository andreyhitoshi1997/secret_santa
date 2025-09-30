import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST!,
  password: process.env.DB_PASSWORD!,
  user: process.env.DB_USER!,
  database: process.env.DB_SCHEMA!,
});

export const db = drizzle({ client: pool });
