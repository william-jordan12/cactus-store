/**
 * A minimal pg-compatible query client backed by plain `fetch` to Neon's
 * SQL-over-HTTP endpoint (`/sql`). No database driver library is used, so it
 * works inside Vercel's serverless sandbox (which kills pg / Neon socket
 * drivers while allowing fetch, the same primitive the static SPA uses).
 *
 * It implements enough of the `pg.Pool` / `pg.Client` surface that both the
 * drizzle `node-postgres` adapter and the raw `conn.query(sql, params)` calls
 * in the app keep working unchanged.
 */

export interface HttpPgResult {
  rows: unknown[];
  rowCount: number | null;
  fields: { name: string }[];
}

function parseUrl(url: string): {
  host: string;
  user: string;
  password: string;
  db: string;
} {
  const scheme = url.startsWith("postgres://") ? "postgres" : "postgresql";
  const rest = url.slice(scheme.length + 3); // after postgres://
  const atIndex = rest.indexOf("@");
  const auth = rest.slice(0, atIndex);
  const hostPortPath = rest.slice(atIndex + 1);
  const slash = hostPortPath.indexOf("/");
  const host = slash >= 0 ? hostPortPath.slice(0, slash) : hostPortPath;
  const pathPart = slash >= 0 ? hostPortPath.slice(slash + 1) : "";
  const db = pathPart.split("?")[0];
  const split = auth.indexOf(":");
  const user = split >= 0 ? auth.slice(0, split) : auth;
  const password = split >= 0 ? auth.slice(split + 1) : "";
  return { host, user, password, db };
}

/** Build the Neon HTTP `/sql` URL + the required neon-connection-string header. */
function endpoint(url: string): { url: string; headers: Record<string, string> } {
  const p = parseUrl(url);
  const host = p.host.replace("-pooler.", ".");
  const endpointUrl = `https://${host}/sql?sslmode=require`;
  const neonConn = `postgres://${encodeURIComponent(p.user)}:${encodeURIComponent(p.password)}@${p.host}/${p.db}?sslmode=require`;
  return {
    url: endpointUrl,
    headers: {
      "Content-Type": "application/json",
      "neon-connection-string": neonConn,
    },
  };
}

export async function queryHttp(
  url: string,
  text: string,
  params: unknown[] = []
): Promise<HttpPgResult> {
  const ep = endpoint(url);
  const res = await fetch(ep.url, {
    method: "POST",
    headers: ep.headers,
    body: JSON.stringify({ query: text, params }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DB HTTP ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json() as {
    rows: unknown[];
    rowCount?: number;
    fields?: { name: string }[];
  };
  return {
    rows: data.rows ?? [],
    rowCount: data.rowCount ?? data.rows?.length ?? null,
    fields: data.fields ?? [],
  };
}

/**
 * A Pool-like object compatible with `drizzle-orm/node-postgres` and the app's
 * raw `conn.query(text, params)` (result shape `{ rows }`) and `.connect()`
 * (returns a client with `.query`/`.release`).
 */
export class HttpPgPool {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  query(textOrConfig: string | { text: string; values?: unknown[] }, params?: unknown[]): Promise<HttpPgResult> {
    if (typeof textOrConfig === "object" && textOrConfig !== null) {
      return queryHttp(this.url, textOrConfig.text, params ?? textOrConfig.values ?? []);
    }
    return queryHttp(this.url, textOrConfig, params ?? []);
  }

  connect(): Promise<HttpPgClient> {
    return Promise.resolve(new HttpPgClient(this.url));
  }

  release(): void {}
}

export class HttpPgClient {
  private url: string;
  constructor(url: string) {
    this.url = url;
  }
  query(textOrConfig: string | { text: string; values?: unknown[] }, params?: unknown[]): Promise<HttpPgResult> {
    if (typeof textOrConfig === "object" && textOrConfig !== null) {
      return queryHttp(this.url, textOrConfig.text, params ?? textOrConfig.values ?? []);
    }
    return queryHttp(this.url, textOrConfig, params ?? []);
  }
  release(): void {}
  end(): Promise<void> {
    return Promise.resolve();
  }
}