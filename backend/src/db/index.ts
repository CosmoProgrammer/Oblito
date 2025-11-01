import { drizzle } from "drizzle-orm/node-postgres";
import "dotenv/config";
import { Pool } from "pg";

import { schema } from "./schema/index.js";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export default db;