# Production-Ready Neon Database Utilities

A robust, type-safe PostgreSQL database utility library for Neon DB with comprehensive error handling, connection pooling, and RESTful API routes.

## Features

✅ **Production-Ready**: Proper error handling, validation, and logging  
✅ **Type-Safe**: Full TypeScript support with interfaces  
✅ **Connection Pooling**: Optimized for Neon's serverless architecture  
✅ **Graceful Shutdown**: Handles process termination cleanly  
✅ **Health Checks**: Built-in database health monitoring  
✅ **Transactions**: Helper functions for safe transactions  
✅ **CORS Support**: Ready for cross-origin requests  
✅ **RESTful API**: Complete CRUD operations with validation  
✅ **Batch Operations**: Transaction-based batch inserts

## Installation

```bash
bun install postgres dotenv
```

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PORT=3000
NODE_ENV=production
APP_NAME=my-app
```

## Database Setup

Run the migration to set up your schema:

```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

Or use your preferred migration tool.

## Quick Start

### 1. Basic Server Setup

```typescript
import { handleApi } from "./routes";
import { checkDatabaseHealth } from "./db";

const server = Bun.serve({
  port: 3000,
  fetch: handleApi,
});

// Check database on startup
const health = await checkDatabaseHealth();
console.log(health.healthy ? "✅ DB Connected" : "❌ DB Failed");
```

### 2. Using Database Utilities

```typescript
import { sql, query, transaction } from "./db";

// Direct query
const items = await sql`SELECT * FROM playing_with_neon`;

// Query with error handling
const { data, error } = await query(
  async () => sql`SELECT * FROM users WHERE id = ${userId}`,
  "fetch-user"
);

if (error) {
  console.error("Failed to fetch user:", error);
  return;
}

// Transaction example
await transaction(async (tx) => {
  await tx`INSERT INTO orders (user_id) VALUES (${userId})`;
  await tx`UPDATE users SET order_count = order_count + 1 WHERE id = ${userId}`;
});
```

### 3. Custom Routes

```typescript
import { 
  parseBody, 
  createApiResponse, 
  createErrorResponse,
  ValidationError 
} from "./routes";

export async function customHandler(req: Request): Promise<Response> {
  try {
    const body = await parseBody(req);
    
    // Your logic here
    const result = await processData(body);
    
    return createApiResponse(result, 200);
  } catch (error) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error, 400);
    }
    return createErrorResponse(error, 500);
  }
}
```

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Items CRUD

#### List All Items
```bash
GET /api/items
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Item 1",
      "value": "Value 1",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Single Item
```bash
GET /api/items/1
```

#### Create Item
```bash
POST /api/items
Content-Type: application/json

{
  "name": "New Item",
  "value": "Some value"
}
```

#### Update Item (Full)
```bash
PUT /api/items/1
Content-Type: application/json

{
  "name": "Updated Item",
  "value": "Updated value"
}
```

#### Update Item (Partial)
```bash
PATCH /api/items/1
Content-Type: application/json

{
  "name": "Only update name"
}
```

#### Delete Item
```bash
DELETE /api/items/1
```

## Advanced Usage

### Custom Validation

```typescript
import { ValidationError } from "./routes";

function validateEmail(email: string): void {
  if (!email.includes("@")) {
    throw new ValidationError("Invalid email format");
  }
}
```

### Batch Operations

```typescript
import { batchCreateItems } from "./routes";

const newItems = [
  { name: "Item 1", value: "Value 1" },
  { name: "Item 2", value: "Value 2" },
];

const created = await batchCreateItems(newItems);
```

### Custom Error Handling

```typescript
import { createErrorResponse, NotFoundError } from "./routes";

if (!user) {
  throw new NotFoundError("User not found");
}
```

### Database Health Monitoring

```typescript
import { checkDatabaseHealth } from "./db";

setInterval(async () => {
  const health = await checkDatabaseHealth();
  if (!health.healthy) {
    console.error("Database unhealthy:", health.message);
    // Send alert, restart, etc.
  }
}, 60000); // Check every minute
```

## Adapting for Your Project

### 1. Change Table Name

Replace `playing_with_neon` throughout the code with your table name:

```typescript
// In routes.ts
const rows = await sql`SELECT * FROM your_table_name ORDER BY id`;
```

### 2. Update Item Interface

```typescript
// In routes.ts
interface YourModel {
  id?: number;
  // Add your fields
  email: string;
  username: string;
  created_at?: Date;
}
```

### 3. Add Custom Validation

```typescript
function validateYourModel(data: Partial<YourModel>): void {
  if (!data.email) {
    throw new ValidationError("Email is required");
  }
  if (!data.username || data.username.length < 3) {
    throw new ValidationError("Username must be at least 3 characters");
  }
}
```

### 4. Add Authentication Middleware

```typescript
async function authenticate(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  
  // Verify token and return user ID
  return verifyToken(token);
}

// Use in routes
if (req.method === "POST") {
  const userId = await authenticate(req);
  if (!userId) {
    return createErrorResponse("Unauthorized", 401);
  }
  // Continue with authenticated request
}
```

## Best Practices

1. **Always use parameterized queries** - SQL injection protection is built-in
2. **Use transactions for related operations** - Ensures data consistency
3. **Validate input data** - Never trust user input
4. **Handle errors appropriately** - Return proper HTTP status codes
5. **Monitor database health** - Set up alerts for connection issues
6. **Use connection pooling** - Already configured for optimal performance
7. **Close connections on shutdown** - Handled automatically

## Error Handling

All errors are caught and returned in a consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - Deleted (no content)
- `400` - Validation error
- `404` - Not found
- `500` - Server error

## Testing

```typescript
// Example test with Bun
import { describe, test, expect } from "bun:test";
import { handleApi } from "./routes";

describe("API Routes", () => {
  test("GET /api/items returns array", async () => {
    const req = new Request("http://localhost/api/items");
    const res = await handleApi(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## Performance Tips

1. **Use indexes** - Already set up in the migration
2. **Limit result sets** - Add pagination for large datasets
3. **Use SELECT specific columns** - Instead of SELECT *
4. **Connection pooling** - Already optimized for Neon
5. **Cache frequently accessed data** - Consider adding Redis

## Migration to Other Projects

This code is designed to be reusable. To use in a new project:

1. Copy `db.ts` and `routes.ts`
2. Update the table name and schema
3. Modify the `Item` interface for your data model
4. Update validation functions
5. Add your custom endpoints
6. Configure environment variables

## License

MIT

## Support

For issues or questions, check:
- [Neon Documentation](https://neon.tech/docs)
- [Postgres.js Documentation](https://github.com/porsager/postgres)