// db.ts
import postgres, { type Sql, type TransactionSql } from "postgres";
import "dotenv/config";

/**
 * Database connection configuration
 */
interface DatabaseConfig {
	connectionString: string;
	ssl?: boolean | "require" | "prefer";
	max?: number;
	idleTimeout?: number;
	connectTimeout?: number;
	debug?: boolean;
}

/**
 * Default database configuration
 */
const DEFAULT_CONFIG = {
	ssl: "require" as const,
	max: 10,
	idleTimeout: 20,
	connectTimeout: 10,
	debug: process.env.NODE_ENV === "development",
};

/**
 * Validates database configuration
 */
function validateConfig(): string {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error(
			"DATABASE_URL environment variable is required but not set"
		);
	}

	// Basic validation for postgres connection string format
	if (!connectionString.startsWith("postgres://") && !connectionString.startsWith("postgresql://")) {
		throw new Error(
			"DATABASE_URL must be a valid PostgreSQL connection string"
		);
	}

	return connectionString;
}

/**
 * Creates a production-ready Postgres connection pool
 */
function createConnection(config?: Partial<DatabaseConfig>): Sql {
	const connectionString = validateConfig();

	const finalConfig = {
		...DEFAULT_CONFIG,
		...config,
	};

	return postgres(connectionString, {
		ssl: finalConfig.ssl,
		max: finalConfig.max,
		idle_timeout: finalConfig.idleTimeout,
		connect_timeout: finalConfig.connectTimeout,
		debug: finalConfig.debug,
		// Transform undefined to null for PostgreSQL
		transform: {
			undefined: null,
		},
		// Handle connection errors
		onnotice: () => { }, // Suppress notices in production
		connection: {
			application_name: process.env.APP_NAME || "neon-app",
		},
	});
}

/**
 * Main database connection instance
 */
export const sql = createConnection();

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(): Promise<{
	healthy: boolean;
	message: string;
	latency?: number;
}> {
	try {
		const start = Date.now();
		await sql`SELECT 1`;
		const latency = Date.now() - start;

		return {
			healthy: true,
			message: "Database connection is healthy",
			latency,
		};
	} catch (error) {
		return {
			healthy: false,
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Gracefully close database connections
 * Call this on application shutdown
 */
export async function closeDatabaseConnection(): Promise<void> {
	try {
		await sql.end({ timeout: 5 });
		console.log("Database connections closed gracefully");
	} catch (error) {
		console.error("Error closing database connections:", error);
		throw error;
	}
}

/**
 * Transaction helper
 * Automatically handles rollback on errors
 */
export async function transaction<T>(
	callback: (sql: TransactionSql<{}>) => T | Promise<T>
): Promise<T> {
	return sql.begin(callback) as unknown as T;
}

/**
 * Query helper with error handling and logging
 */
export async function query<T = any>(
	queryFn: () => Promise<T>,
	context?: string
): Promise<{ data: T | null; error: Error | null }> {
	try {
		const data = await queryFn();
		return { data, error: null };
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));

		if (context) {
			console.error(`Database query error [${context}]:`, err.message);
		} else {
			console.error("Database query error:", err.message);
		}

		return { data: null, error: err };
	}
}

/**
 * Export types for use in other files
 */
export type { Sql };

// Handle graceful shutdown
if (typeof process !== "undefined") {
	const shutdown = async () => {
		await closeDatabaseConnection();
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}