const BASE_URL = "https://api.porkbun.com/api/json/v3";

function getApiKey(): string {
  const key = process.env.PORKBUN_API_KEY;
  if (!key) throw new Error("PORKBUN_API_KEY environment variable is not set");
  return key;
}

function getSecretApiKey(): string {
  const key = process.env.PORKBUN_SECRET_API_KEY;
  if (!key) throw new Error("PORKBUN_SECRET_API_KEY environment variable is not set");
  return key;
}

export async function porkbunRequest<T>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const payload: Record<string, unknown> = {
    apikey: getApiKey(),
    secretapikey: getSecretApiKey(),
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
