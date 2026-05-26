import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy init via Proxy. Eager `neon(process.env.DATABASE_URL!)` at module load
// breaks Vercel Preview builds (env vars aren't injected during prerender).
type DB = ReturnType<typeof drizzle<typeof schema>>;
let _db: DB | undefined;
function getDb(): DB {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as DB, {
  get(_, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});

export { schema };
