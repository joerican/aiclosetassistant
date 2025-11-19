# Cloudflare D1 Database Reference

**Last Updated**: 2025-11-19 03:59 EST
**Database**: closet-db (ID: 6b5601ee-c870-422c-8818-2d4420f1c6f3)

## What is D1?

D1 is Cloudflare's serverless SQL database built on SQLite. Key features:
- **SQLite SQL semantics** - Full SQL compatibility
- **Serverless** - No infrastructure management
- **Built-in disaster recovery** - Time Travel backups (30 days)
- **Worker integration** - Direct access from Workers/Pages
- **Free tier available**

## Design Philosophy

- Optimized for **many small databases** (up to 10GB each)
- Perfect for multi-tenant architectures
- Pricing based on queries and storage only

## Binding Setup

### wrangler.jsonc
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "closet-db",
      "database_id": "6b5601ee-c870-422c-8818-2d4420f1c6f3"
    }
  ]
}
```

### TypeScript Types
```typescript
// cloudflare-env.d.ts
interface CloudflareEnv {
  DB: D1Database;
}
```

## Accessing from Route Handlers

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { env } = await getCloudflareContext();
  const db = env.DB;

  // Query the database
  const result = await db.prepare('SELECT * FROM users').all();
  return Response.json(result);
}
```

## Query Methods

### all() - Get all rows
```typescript
const { results } = await env.DB
  .prepare('SELECT * FROM clothing_items')
  .all();

// Returns: { success: true, results: [...], meta: {...} }
```

### first() - Get single row
```typescript
const item = await env.DB
  .prepare('SELECT * FROM clothing_items WHERE id = ?')
  .bind(itemId)
  .first();

// Returns: { id: '...', category: '...', ... } or null
```

### raw() - Get raw array format
```typescript
const raw = await env.DB
  .prepare('SELECT id, name FROM users')
  .raw();

// Returns: [['id1', 'name1'], ['id2', 'name2']]
```

### run() - Execute without results
```typescript
const result = await env.DB
  .prepare('INSERT INTO users (id, name) VALUES (?, ?)')
  .bind(userId, userName)
  .run();

// Returns: { success: true, meta: { changes: 1, last_row_id: ... } }
```

## Prepared Statements with bind()

**Always use bind() for user input** to prevent SQL injection:

```typescript
// ✅ GOOD - Using bind()
const result = await env.DB
  .prepare('SELECT * FROM items WHERE category = ?')
  .bind(userCategory)
  .all();

// ❌ BAD - String concatenation (SQL injection risk!)
const bad = await env.DB
  .prepare(`SELECT * FROM items WHERE category = '${userCategory}'`)
  .all();
```

## Batch Operations

Execute multiple statements together:

```typescript
const batch = await env.DB.batch([
  env.DB.prepare('INSERT INTO items (id, name) VALUES (?, ?)').bind('1', 'Shirt'),
  env.DB.prepare('INSERT INTO items (id, name) VALUES (?, ?)').bind('2', 'Pants'),
  env.DB.prepare('UPDATE users SET last_activity = ? WHERE id = ?').bind(Date.now(), userId),
]);

// Returns array of results: [result1, result2, result3]
```

## TypeScript Generic Types

Type your query results:

```typescript
type ClothingItem = {
  id: string;
  category: string;
  color: string;
  brand: string;
};

const { results } = await env.DB
  .prepare('SELECT * FROM clothing_items')
  .all<ClothingItem>();

// results is now ClothingItem[]
```

## Type Conversion

JavaScript → SQLite:
- `null` → `NULL`
- `Number` → `REAL` or `INTEGER`
- `String` → `TEXT`
- `Boolean` → `INTEGER` (0 or 1)
- `undefined` → **Error!** (D1_TYPE_ERROR)

## Common Patterns

### Insert and Get ID
```typescript
const result = await env.DB
  .prepare('INSERT INTO items (name) VALUES (?)')
  .bind(itemName)
  .run();

const newId = result.meta.last_row_id;
```

### Conditional Query
```typescript
const query = category
  ? 'SELECT * FROM items WHERE category = ?'
  : 'SELECT * FROM items';

const stmt = env.DB.prepare(query);

const { results } = category
  ? await stmt.bind(category).all()
  : await stmt.all();
```

### Count Query
```typescript
const count = await env.DB
  .prepare('SELECT COUNT(*) as total FROM items')
  .first<{ total: number }>();

console.log(count?.total); // number
```

## Error Handling

```typescript
try {
  const result = await env.DB
    .prepare('SELECT * FROM items')
    .all();

  if (!result.success) {
    throw new Error('Query failed');
  }

  return Response.json(result.results);
} catch (error) {
  console.error('D1 Error:', error);
  return Response.json(
    { error: 'Database error' },
    { status: 500 }
  );
}
```

## Our Database Schema

See `lib/db/schema.sql` for complete schema.

**Key Tables:**
- `users` - User accounts
- `clothing_items` - Clothing items with metadata
- `outfits` - Saved outfit combinations
- `wear_history` - Tracking when items were worn

## Limitations

- **Max database size**: 10 GB per database
- **Max query time**: 30 seconds
- **SQLite version**: Based on latest stable SQLite
- **No stored procedures**: Use Workers for logic
- **No triggers**: Implement in application code

## Time Travel Backups

Restore database to any minute within last 30 days:

```bash
wrangler d1 time-travel restore closet-db --timestamp=2025-11-18T12:00:00Z
```

## References

- Official Docs: https://developers.cloudflare.com/d1/
- Client API: https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/
- SQL Reference: https://developers.cloudflare.com/d1/reference/sql-api/
