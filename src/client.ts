import { readFileSync } from "node:fs";

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
let cachedSnapshot: string | undefined;

function envSnapshot(): string {
  return [
    `PORKBUN_API_KEY=${process.env.PORKBUN_API_KEY ?? ""}`,
    `PORKBUN_SECRET_API_KEY=${process.env.PORKBUN_SECRET_API_KEY ?? ""}`,
    `PORKBUN_ACCOUNTS_FILE=${process.env.PORKBUN_ACCOUNTS_FILE ?? ""}`,
  ].join("\n");
}

function parseAccountsJson(raw: string, source: string): Map<string, Account> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `${source} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${source} must be a JSON array of account objects`);
  }
  const out = new Map<string, Account>();
  for (const [i, entry] of parsed.entries()) {
    if (!entry || typeof entry !== "object") {
      throw new Error(`${source}[${i}] is not an object`);
    }
    const acc = entry as ParsedAccount;
    const apiKey = acc.PORKBUN_API_KEY ?? acc.apiKey;
    const secretApiKey = acc.PORKBUN_SECRET_API_KEY ?? acc.secretApiKey;
    if (!apiKey || !secretApiKey) {
      throw new Error(
        `${source}[${i}] is missing PORKBUN_API_KEY or PORKBUN_SECRET_API_KEY`
      );
    }
    const user = (acc.user ?? "default").trim().toLowerCase();
    if (out.has(user)) {
      throw new Error(`${source} contains duplicate user "${user}"`);
    }
    out.set(user, { user, apiKey, secretApiKey });
  }
  return out;
}

/**
 * Build the account map from supported configuration sources, merged in
 * this order (later sources override earlier ones for the same user):
 *
 *   1. Top-level `PORKBUN_API_KEY` / `PORKBUN_SECRET_API_KEY` → "default" account
 *   2. `PORKBUN_ACCOUNTS_FILE` — path to a JSON file containing
 *      `[{user, PORKBUN_API_KEY, PORKBUN_SECRET_API_KEY}, ...]`
 *
 * User identifiers are lowercased throughout.
 */
function parseAccounts(): Map<string, Account> {
  const snapshot = envSnapshot();
  if (cachedAccounts && cachedSnapshot === snapshot) return cachedAccounts;

  const map = new Map<string, Account>();

  // 1. Default account from top-level env vars
  if (process.env.PORKBUN_API_KEY && process.env.PORKBUN_SECRET_API_KEY) {
    map.set("default", {
      user: "default",
      apiKey: process.env.PORKBUN_API_KEY,
      secretApiKey: process.env.PORKBUN_SECRET_API_KEY,
    });
  }

  // 2. PORKBUN_ACCOUNTS_FILE — path to a JSON file containing the array
  const filePath = process.env.PORKBUN_ACCOUNTS_FILE;
  if (filePath && filePath.trim()) {
    let raw: string;
    try {
      raw = readFileSync(filePath.trim(), "utf8");
    } catch (err) {
      throw new Error(
        `PORKBUN_ACCOUNTS_FILE could not be read at "${filePath}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
    for (const [user, acc] of parseAccountsJson(raw, "PORKBUN_ACCOUNTS_FILE")) {
      map.set(user, acc);
    }
  }

  cachedAccounts = map;
  cachedSnapshot = snapshot;
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
          "PORKBUN_SECRET_API_KEY (or include a default entry in the file " +
          "referenced by PORKBUN_ACCOUNTS_FILE)."
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
 * defined in the file referenced by `PORKBUN_ACCOUNTS_FILE`.
 */
export function listConfiguredUsers(): string[] {
  return [...parseAccounts().keys()];
}

/** Test-only: clear the parsed-accounts cache. */
export function _resetAccountsCache(): void {
  cachedAccounts = null;
  cachedSnapshot = undefined;
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
