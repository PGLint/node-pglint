#!/usr/bin/env node
import { pglint } from "./index";

const USAGE = `\
Usage:

    npx pglint [--token <token>] [--project <project>] [--connection <database>]

<token>: your authentication token from PGLint.com; alternatively supply via the PGLINT_TOKEN environmental variable.

<project>: the name of your project on PGLint.com; alternatively supply via the PGLINT_PROJECT environmental variable.

<database>: connection string to your PostgreSQL database. If you have PostgreSQL installed locally using trust authentication, your database name may suffice. Otherwise a standard PostgreSQL connection URI (e.g. \`postgres://user:password@host:port/dbname\`) should be supplied. Alternatively supply via the DATABASE_URL environmental variable.
`;

async function main() {
  // Rudimentary CLI parser to avoid adding another dependency
  const args = process.argv.slice(2);
  let token: string | undefined = undefined;
  let project: string | undefined = undefined;
  let database: string | undefined = undefined;
  let next: string | null = null;
  for (const arg of args) {
    if (arg === "--project") {
      next = "project";
    } else if (arg === "--token") {
      next = "token";
    } else if (arg === "--connection") {
      next = "database";
    } else {
      if (next === "project") {
        if (project !== undefined) {
          throw Object.assign(
            new Error("--project was specified multiple times"),
            { usage: true }
          );
        }
        project = arg;
        next = null;
      } else if (next === "token") {
        if (token !== undefined) {
          throw Object.assign(
            new Error("--token was specified multiple times"),
            { usage: true }
          );
        }
        token = arg;
        next = null;
      } else if (next === "database") {
        if (database !== undefined) {
          throw Object.assign(
            new Error("--database was specified multiple times"),
            { usage: true }
          );
        }
        database = arg;
        next = null;
      } else {
        throw Object.assign(
          new Error(`Option '${arg}' is not a recognized command-line flag.`),
          { usage: true }
        );
      }
    }
  }
  if (token === undefined) {
    token = process.env.PGLINT_TOKEN;
  }
  if (project === undefined) {
    project = process.env.PGLINT_PROJECT;
  }
  if (database === undefined) {
    database = process.env.PGLINT_DATABASE_URL || process.env.DATABASE_URL;
  }
  if (!token) {
    throw Object.assign(
      new Error(
        "You must specify a token, either via --token or the PGLINT_TOKEN environmental variable."
      ),
      { usage: true }
    );
  }
  if (!project) {
    throw Object.assign(
      new Error(
        "You must specify a project, either via --project or the PGLINT_PROJECT environmental variable."
      ),
      { usage: true }
    );
  }
  if (!database) {
    throw Object.assign(
      new Error(
        "You must specify a database connection string, either via the CLI argument or the DATABASE_URL environmental variable."
      ),
      { usage: true }
    );
  }
  await pglint({
    connectionString: database,
    token,
    project,
  });
}

main().catch((e) => {
  console.error(e.message);
  if (e["usage"]) {
    console.log(USAGE);
  }
  process.exit(1);
});
