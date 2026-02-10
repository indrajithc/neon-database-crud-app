// db.ts
import postgres from "postgres";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
	throw new Error("DATABASE_URL missing");
}

/**
 * Neon-safe pooled connection
 * - SSL required
 * - pooled
 * - works with Bun
 */
export const sql = postgres(connectionString, {
	ssl: "require",
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
});
