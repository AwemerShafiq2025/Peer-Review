import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let client: SqlClient | undefined;

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  client ??= neon(databaseUrl);

  return client;
}

export const sql = new Proxy(
  ((strings: TemplateStringsArray, ...values: unknown[]) => getClient()(strings, ...values)) as SqlClient,
  {
    get(_target, prop) {
      const value = getClient()[prop as keyof SqlClient];

      return typeof value === "function" ? value.bind(getClient()) : value;
    },
  }
);

export default sql;
