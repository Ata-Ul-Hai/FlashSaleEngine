import { Pool } from "pg";

const pool = await new Pool({
    connectionstring: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

pool.on("error", (err) => {
    console.error("🔥 Unexpected error on idle database client", err);
    process.exit(-1);
})

export default pool;