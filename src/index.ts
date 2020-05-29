import { Pool } from "pg";
import { INTROSPECTION_QUERY } from "./introspectionQuery";

interface PGLintOptions {
  connectionString?: string;
  pgPool?: Pool;
  project: string;
  token?: string;
}

export async function pglint(options: PGLintOptions) {
  const token = options.token || process.env.PGLINT_TOKEN;
  if (!token) {
    throw new Error(
      "You must specify a token, either explicitly or via the 'PGLINT_TOKEN' envvar."
    );
  }
  const pool = options.pgPool
    ? options.pgPool
    : new Pool({
        connectionString: options.connectionString,
      });
  if (!options.pgPool) {
    pool.on("error", (e: Error) => {
      console.error("PostgreSQL connection error occurred:");
      console.error(e.message);
      process.exit(1);
    });
  }
  let results: any = null;
  try {
    const {
      rows: [row],
    } = await pool.query(INTROSPECTION_QUERY);
    results = row.introspection;
  } finally {
    pool.end();
  }

  if (results) {
    // Upload them
    console.dir(results);
  } else {
    throw new Error(
      "Failed to retrieve introspection results from the database."
    );
  }
}
