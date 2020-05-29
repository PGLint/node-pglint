import { Pool } from "pg";
import { INTROSPECTION_QUERY } from "./introspectionQuery";
import { gzipSync } from "zlib";
import fetch from "node-fetch";
import FormData from "form-data";
import { exec } from "child_process";

const PGLINT_BASE_URL = process.env.PGLINT_BASE_URL || "https://pglint.com";

interface PGLintOptions {
  connectionString?: string;
  pgPool?: Pool;
  project: string;
  token?: string;
  gitBranch?: string;
  gitHash?: string;
}

async function upload(
  introspection: any,
  token: string,
  project: string,
  { gitBranch, gitHash }: { gitBranch: string | null; gitHash: string | null }
) {
  const json = JSON.stringify(introspection);
  const compressed = gzipSync(json, { level: 9 });

  const form = new FormData();
  form.append("data", compressed, {
    contentType: "application/gzip",
    filename: "pglint_introspection.json",
  });

  const response = await fetch(
    `${PGLINT_BASE_URL}/api/upload?project=${encodeURIComponent(project)}` +
      (gitBranch ? `&git_branch=${encodeURIComponent(gitBranch)}` : "") +
      (gitHash ? `&git_hash=${encodeURIComponent(gitHash)}` : ""),
    {
      method: "POST",
      body: form,
      headers: {
        ...form.getHeaders(),
        authorization: `Bearer ${token}`,
      },
      redirect: "follow",
      follow: 10,
      timeout: 30000,
    }
  );
  const text = await response.text();
  if (!response.ok) {
    console.error(text);
    throw new Error(`Request failed with status '${response.status}'`);
  }
  if (text[0] === "{") {
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(json.error);
    }
  }
  const colonIndex = text.indexOf(":");
  if (colonIndex >= 0) {
    const status = text.substr(0, colonIndex);
    console.log(text);
    return { status, text };
  } else {
    console.error(text);
    throw new Error("Could not process result from server.");
  }
}

async function tryRun(cmd: string): Promise<string | null> {
  try {
    return await new Promise((resolve, reject) => {
      exec(cmd, {}, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  } catch (e) {
    return null;
  }
}

export async function pglint(options: PGLintOptions) {
  const token = options.token || process.env.PGLINT_TOKEN;
  if (!token) {
    throw new Error(
      "You must specify a token, either explicitly or via the 'PGLINT_TOKEN' envvar."
    );
  }
  const project = options.project;
  if (!project) {
    throw new Error("You must specify a project.");
  }

  const gitBranch =
    options.gitBranch || (await tryRun("git rev-parse --abbrev-ref HEAD"));
  const gitHash =
    options.gitHash || (await tryRun("git rev-parse --verify HEAD"));

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
    await upload(results, token, project, { gitBranch, gitHash });
  } else {
    throw new Error(
      "Failed to retrieve introspection results from the database."
    );
  }
}
