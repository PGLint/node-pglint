# Node client for PGLint.com

Usage:

```
npx pglint [--token <token>] [--project <project>] [--connection <database>]
```

The following CLI arguments are required:

- `token`: your authentication token from PGLint.com; alternatively supply via
  the `PGLINT_TOKEN` environmental variable.
- `project`: the name of your project on PGLint.com; alternatively supply via
  the `PGLINT_PROJECT` environmental variable.
- `database`: connection string to your PostgreSQL database (see below);
  alternatively supply via the `DATABASE_URL` environmental variable.

The command will exit with success (`0` exit code) if introspection is
successful, the upload is successful, the results from your database analysis
are retrieved within the allotted timeout (30 seconds, normally much faster),
and the analysis results show no errors. In all other cases the command will
exit with a non-zero status code indicating failure.

This command is suitable for use in your CI workflow.

## PostgreSQL connection string

If you have PostgreSQL installed locally using trust authentication, your
database name may suffice. Otherwise a standard PostgreSQL connection URI (e.g.
`postgres://user:password@host:port/dbname`) should be supplied.

You can read more about connection strings here:

- https://www.npmjs.com/package/pg-connection-string
- https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
