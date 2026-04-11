import fs from "node:fs";
import path from "node:path";

import initSqlJs from "sql.js";

type QueryValue = string | number | null;

export interface DatabaseClient {
  provider: "sqljs" | "postgres";
  execute(sql: string, params?: QueryValue[]): Promise<void>;
  query<T>(sql: string, params?: QueryValue[]): Promise<T[]>;
  scalar<T>(sql: string, params?: QueryValue[]): Promise<T | null>;
  execScript(sql: string): Promise<void>;
  persist(): Promise<void>;
}

const dataDir = path.join(process.cwd(), "server", "data");
const dbPath = path.join(dataDir, "app.sqlite");

let dbClientPromise: Promise<DatabaseClient> | null = null;

function splitSqlStatements(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function toPostgresSql(sql: string) {
  let parameterIndex = 0;

  return sql.replace(/\?/g, () => {
    parameterIndex += 1;
    return `$${parameterIndex}`;
  });
}

async function createSqlJsClient(): Promise<DatabaseClient> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
  });

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const database = fs.existsSync(dbPath) ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();
  const runQuery = async <T>(sql: string, params: QueryValue[] = []) => {
    const statement = database.prepare(sql, params);
    const rows: T[] = [];

    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }

    statement.free();
    return rows;
  };

  return {
    provider: "sqljs",
    async execute(sql: string, params: QueryValue[] = []) {
      database.run(sql, params);
    },
    query: runQuery,
    async scalar<T>(sql: string, params: QueryValue[] = []) {
      const [row] = await runQuery<Record<string, T>>(sql, params);
      if (!row) {
        return null;
      }

      const [firstValue] = Object.values(row);
      return (firstValue ?? null) as T | null;
    },
    async execScript(sql: string) {
      for (const statement of splitSqlStatements(sql)) {
        database.run(statement);
      }
    },
    async persist() {
      const data = database.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    }
  };
}

async function createPostgresClient(): Promise<DatabaseClient> {
  const { Pool } = await import("pg");
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? {
          rejectUnauthorized: false
        }
      : undefined
  });

  return {
    provider: "postgres",
    async execute(sql: string, params: QueryValue[] = []) {
      await pool.query(toPostgresSql(sql), params);
    },
    async query<T>(sql: string, params: QueryValue[] = []) {
      const result = await pool.query(toPostgresSql(sql), params);
      return result.rows as T[];
    },
    async scalar<T>(sql: string, params: QueryValue[] = []) {
      const result = await pool.query(toPostgresSql(sql), params);
      const firstRow = result.rows[0] as Record<string, T> | undefined;

      if (!firstRow) {
        return null;
      }

      const [firstValue] = Object.values(firstRow);
      return (firstValue ?? null) as T | null;
    },
    async execScript(sql: string) {
      for (const statement of splitSqlStatements(sql)) {
        await pool.query(statement);
      }
    },
    async persist() {}
  };
}

export async function getDb() {
  if (!dbClientPromise) {
    dbClientPromise = process.env.DATABASE_URL ? createPostgresClient() : createSqlJsClient();
  }

  return dbClientPromise;
}

export async function persistDb() {
  const db = await getDb();
  await db.persist();
}
