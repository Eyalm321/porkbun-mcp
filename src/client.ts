const BASE_URL = "https://api.porkbun.com/api/json/v3";

function envName(prefix: string, user?: string): string {
  if (!user) return prefix;
  // Normalize user identifier: uppercase, replace any non-alphanumeric with `_`
  const suffix = user.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return `${prefix}_${suffix}`;
}

function getApiKey(user?: string): string {
  const name = envName("PORKBUN_API_KEY", user);
  const key = process.env[name];
  if (!key) throw new Error(`${name} environment variable is not set`);
  return key;
}

function getSecretApiKey(user?: string): string {
  const name = envName("PORKBUN_SECRET_API_KEY", user);
  const key = process.env[name];
  if (!key) throw new Error(`${name} environment variable is not set`);
  return key;
}

/**
 * Discover all configured users by scanning environment variables.
 *
 * Returns an array of user identifiers (lowercased) that have a complete
 * `PORKBUN_API_KEY_<USER>` + `PORKBUN_SECRET_API_KEY_<USER>` pair. The
 * default (unsuffixed) `PORKBUN_API_KEY` is reported as `"default"` when set.
 */
export function listConfiguredUsers(): string[] {
  const users: string[] = [];
  if (process.env.PORKBUN_API_KEY && process.env.PORKBUN_SECRET_API_KEY) {
    users.push("default");
  }
  const seen = new Set<string>();
  for (const envKey of Object.keys(process.env)) {
    const m = envKey.match(/^PORKBUN_API_KEY_(.+)$/);
    if (!m) continue;
    const suffix = m[1];
    const secretName = `PORKBUN_SECRET_API_KEY_${suffix}`;
    if (process.env[envKey] && process.env[secretName] && !seen.has(suffix)) {
      seen.add(suffix);
      users.push(suffix.toLowerCase());
    }
  }
  return users;
}

export async function porkbunRequest<T>(
  path: string,
  body?: Record<string, unknown>,
  user?: string
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const payload: Record<string, unknown> = {
    apikey: getApiKey(user),
    secretapikey: getSecretApiKey(user),
    ...body,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (data.status === "ERROR") {
    const msg = (data.message as string) || "Unknown Porkbun API error";
    const code = data.code ? ` (${data.code})` : "";
    throw new Error(`Porkbun API error${code}: ${msg}`);
  }

  return data as T;
}

export async function porkbunRequestNoAuth<T>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (data.status === "ERROR") {
    const msg = (data.message as string) || "Unknown Porkbun API error";
    const code = data.code ? ` (${data.code})` : "";
    throw new Error(`Porkbun API error${code}: ${msg}`);
  }

  return data as T;
}
