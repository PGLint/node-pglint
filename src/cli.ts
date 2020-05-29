#!/usr/bin/env node
import { pglint } from "./index";

const USAGE = `\
Usage:

    npx pglint <token> <project> <database>

<token>: your authentication token from PGLint.com

<project>: the name of your project on PGLint.com

<database>: connection string to your PostgreSQL database. If you have PostgreSQL installed locally using trust authentication, your database name may suffice. Otherwise a standard PostgreSQL connection URI (e.g. \`postgres://user:password@host:port/dbname\`) should be supplied.
`;

async function main() {
  const args = process.argv.slice(2);
  const [token, project, connectionString] = args;
  if (args.length !== 3 || !token || !project) {
    console.log(USAGE);
    process.exit(1);
  }
  await pglint({
    connectionString,
    token,
    project,
  });
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
