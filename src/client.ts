const BASE_URL = "https://api.porkbun.com/api/json/v3";

interface Account {
  user: string;
  apiKey: string;
  secretApiKey: string;
}

interface ParsedAccount {
  user?: string;
  PORKBUN_API_KEY?: string;
  PORKBUN_SECRET_API_KEY?: string;
  apiKey?: string;
  secretApiKey?: string;
}

let cachedAccounts: Map<string, Account> | null = null;
let cachedSource: string | undefined;

/**
 * Parse `PORKBUN_ACCOUNTS` (a JSON array) into a map keyed by lowercased
 * user identifier. Each object should contain `user`, `PORKBUN_API_KEY`,
 * and `PORKBUN_SECRET_API_KEY`. `apiKey` / `secretApiKey` are also accepted
 * as aliases. The default account (no `user` field, or `user: "default"`)
 * is keyed under "default".
 */
function parseAccounts(): Map<string, Account> {
  const raw = process.env.PORKBUN_ACCOUNTS;
  if (cachedAccounts && cachedSource === raw) return cachedAccounts;

  const map = new Map<string, Account>();

  if (raw && raw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `PORKBUN_ACCOUNTS is not valid JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (!Array.isArray(parsed)) {
      throw new Error("PORKBUN_ACCOUNTS must be a JSON array of account objects");
    }
    for (const [i, entry] of parsed.entries()) {
      if (!entry || typeof entry !== "object") {
        throw new Error(`PORKBUN_ACCOUNTS[${i}] is not an object`);
      }
      const acc = entry as ParsedAccount;
      const apiKey = acc.PORKBUN_API_KEY ?? acc.apiKey;
      const secretApiKey = acc.PORKBUN_SECRET_API_KEY ?? acc.secretApiKey;
      if (!apiKey || !secretApiKey) {
        throw new Error(
          `PORKBUN_ACCOUNTS[${i}] is missing PORKBUN_API_KEY or PORKBUN_SECRET_API_KEY`
        );
      }
      const user = (acc.user ?? "default").trim().toLowerCase();
      if (map.has(user)) {
        throw new Error(`PORKBUN_ACCOUNTS contains duplicate user "${user}"`);
      }
      map.set(user, { user, apiKey, secretApiKey });
    }
  }

  // Top-level PORKBUN_API_KEY / PORKBUN_SECRET_API_KEY are the default if
  // not already provided via PORKBUN_ACCOUNTS.
  if (
    !map.has("default") &&
    process.env.PORKBUN_API_KEY &&
    process.env.PORKBUN_SECRET_API_KEY
  ) {
    map.set("default", {
      user: "default",
      apiKey: process.env.PORKBUN_API_KEY,
      secretApiKey: process.env.PORKBUN_SECRET_API_KEY,
    });
  }

  cachedAccounts = map;
  cachedSource = raw;
  return map;
}

function resolveAccount(user?: string): Account {
  const accounts = parseAccounts();
  const key = (user ?? "default").trim().toLowerCase();
  const acc = accounts.get(key);
  if (!acc) {
    if (!user || key === "default") {
      throw new Error(
        "No default Porkbun credentials configured. Set PORKBUN_API_KEY and " +
          "PORKBUN_SECRET_API_KEY, or include a default entry in PORKBUN_ACCOUNTS."
      );
    }
    const known = [...accounts.keys()].join(", ") || "(none)";
    throw new Error(
      `No Porkbun credentials configured for user "${user}". Configured users: ${known}`
    );
  }
  return acc;
}

/**
 * Returns the list of configured user identifiers, lowercased.
 *
 * Includes "default" when default credentials are present, plus any users
 * defined via the PORKBUN_ACCOUNTS JSON array.
 */
export function listConfiguredUsers(): string[] {
  return [...parseAccounts().keys()];
}

/** Test-only: clear the parsed-accounts cache. */
export function _resetAccountsCache(): void {
  cachedAccounts = null;
  cachedSource = undefined;
}

export async function porkbunRequest<T>(
  path: string,
  body?: Record<string, unknown>,
  user?: string
): Promise<T> {
  const account = resolveAccount(user);
  const url = `${BASE_URL}${path}`;

  const payload: Record<string, unknown> = {
    apikey: account.apiKey,
    secretapikey: account.secretApiKey,
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
