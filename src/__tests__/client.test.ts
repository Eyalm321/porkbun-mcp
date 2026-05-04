import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  porkbunRequest,
  porkbunRequestNoAuth,
  listConfiguredUsers,
  _resetAccountsCache,
} from "../client.js";

// Strip any inherited PORKBUN_* env vars so tests run in a clean baseline.
function clearPorkbunEnv() {
  for (const k of Object.keys(process.env)) {
    if (k.startsWith("PORKBUN_")) vi.stubEnv(k, "");
  }
}

describe("porkbunRequest", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    clearPorkbunEnv();
    vi.stubEnv("PORKBUN_API_KEY", "pk1_test");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "sk1_test");
    _resetAccountsCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    _resetAccountsCache();
  });

  it("throws when no default credentials are configured", async () => {
    vi.stubEnv("PORKBUN_API_KEY", "");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "");
    _resetAccountsCache();
    await expect(porkbunRequest("/ping")).rejects.toThrow(
      /No default Porkbun credentials configured/
    );
  });

  it("makes POST request with credentials in body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "SUCCESS", yourIp: "1.2.3.4" }),
    });

    await porkbunRequest("/ping");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.porkbun.com/api/json/v3/ping",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: "pk1_test",
          secretapikey: "sk1_test",
        }),
      })
    );
  });

  it("merges additional body params with credentials", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "SUCCESS" }),
    });

    await porkbunRequest("/dns/create/example.com", { type: "A", content: "1.2.3.4" });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.apikey).toBe("pk1_test");
    expect(callBody.secretapikey).toBe("sk1_test");
    expect(callBody.type).toBe("A");
    expect(callBody.content).toBe("1.2.3.4");
  });

  it("returns parsed JSON on success", async () => {
    const expected = { status: "SUCCESS", yourIp: "1.2.3.4" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(expected),
    });

    const result = await porkbunRequest("/ping");
    expect(result).toEqual(expected);
  });

  it("throws on API error response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: "ERROR",
        message: "Invalid domain.",
        code: "INVALID_DOMAIN",
      }),
    });

    await expect(porkbunRequest("/domain/getNs/bad")).rejects.toThrow(
      "Porkbun API error (INVALID_DOMAIN): Invalid domain."
    );
  });

  it("throws on API error without code", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: "ERROR",
        message: "Something went wrong",
      }),
    });

    await expect(porkbunRequest("/ping")).rejects.toThrow(
      "Porkbun API error: Something went wrong"
    );
  });

  describe("suffixed env-var multi-user", () => {
    it("resolves credentials from PORKBUN_API_KEY_<USER> pair", async () => {
      vi.stubEnv("PORKBUN_API_KEY_ALICE", "pk1_alice");
      vi.stubEnv("PORKBUN_SECRET_API_KEY_ALICE", "sk1_alice");
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "alice");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_alice");
      expect(body.secretapikey).toBe("sk1_alice");
    });

    it("matches user identifier case-insensitively against env suffix", async () => {
      vi.stubEnv("PORKBUN_API_KEY_BOB", "pk1_bob");
      vi.stubEnv("PORKBUN_SECRET_API_KEY_BOB", "sk1_bob");
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "BOB");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_bob");
    });

    it("ignores PORKBUN_API_KEY_<USER> with no matching secret", async () => {
      vi.stubEnv("PORKBUN_API_KEY_PARTIAL", "pk1_partial");
      _resetAccountsCache();
      await expect(porkbunRequest("/ping", undefined, "partial")).rejects.toThrow(
        /No Porkbun credentials configured for user "partial"/
      );
    });
  });

  describe("PORKBUN_ACCOUNTS multi-user", () => {
    it("resolves credentials for a named user from PORKBUN_ACCOUNTS", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
          { user: "bob", PORKBUN_API_KEY: "pk1_bob", PORKBUN_SECRET_API_KEY: "sk1_bob" },
        ])
      );
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "alice");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_alice");
      expect(body.secretapikey).toBe("sk1_alice");
    });

    it("matches user identifier case-insensitively", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([
          { user: "AliceCo", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
        ])
      );
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "aliceco");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_alice");
    });

    it("accepts apiKey / secretApiKey aliases inside the JSON object", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([{ user: "alice", apiKey: "pk1_alice", secretApiKey: "sk1_alice" }])
      );
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "alice");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_alice");
      expect(body.secretapikey).toBe("sk1_alice");
    });

    it("default account from PORKBUN_ACCOUNTS overrides top-level env vars", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([
          { user: "default", PORKBUN_API_KEY: "pk1_acct_default", PORKBUN_SECRET_API_KEY: "sk1_acct_default" },
        ])
      );
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_acct_default");
    });

    it("falls back to top-level env vars when PORKBUN_ACCOUNTS has no default", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
        ])
      );
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_test");
    });

    it("throws a helpful error when an unknown user is requested", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
        ])
      );
      _resetAccountsCache();
      await expect(porkbunRequest("/ping", undefined, "ghost")).rejects.toThrow(
        /No Porkbun credentials configured for user "ghost"/
      );
    });

    it("throws when PORKBUN_ACCOUNTS is not valid JSON", async () => {
      vi.stubEnv("PORKBUN_ACCOUNTS", "not-json");
      _resetAccountsCache();
      await expect(porkbunRequest("/ping")).rejects.toThrow(
        /PORKBUN_ACCOUNTS is not valid JSON/
      );
    });

    it("throws when PORKBUN_ACCOUNTS is not an array", async () => {
      vi.stubEnv("PORKBUN_ACCOUNTS", JSON.stringify({ user: "alice" }));
      _resetAccountsCache();
      await expect(porkbunRequest("/ping")).rejects.toThrow(
        /PORKBUN_ACCOUNTS must be a JSON array/
      );
    });

    it("throws when an entry is missing api key fields", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([{ user: "alice", PORKBUN_API_KEY: "pk1_alice" }])
      );
      _resetAccountsCache();
      await expect(porkbunRequest("/ping", undefined, "alice")).rejects.toThrow(
        /missing PORKBUN_API_KEY or PORKBUN_SECRET_API_KEY/
      );
    });

    it("throws when PORKBUN_ACCOUNTS has duplicate users", async () => {
      vi.stubEnv(
        "PORKBUN_ACCOUNTS",
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "a", PORKBUN_SECRET_API_KEY: "x" },
          { user: "Alice", PORKBUN_API_KEY: "b", PORKBUN_SECRET_API_KEY: "y" },
        ])
      );
      _resetAccountsCache();
      await expect(porkbunRequest("/ping")).rejects.toThrow(
        /duplicate user "alice"/
      );
    });
  });
});

describe("porkbunRequestNoAuth", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes POST request without credentials", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "SUCCESS", yourIp: "1.2.3.4" }),
    });

    await porkbunRequestNoAuth("/ip");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.porkbun.com/api/json/v3/ip",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
      })
    );
  });

  it("passes body params without credentials", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "SUCCESS", pricing: {} }),
    });

    await porkbunRequestNoAuth("/pricing/get", { tlds: ["com"] });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tlds).toEqual(["com"]);
    expect(callBody.apikey).toBeUndefined();
  });

  it("returns parsed JSON on success", async () => {
    const expected = { status: "SUCCESS", yourIp: "5.6.7.8" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(expected),
    });

    const result = await porkbunRequestNoAuth("/ip");
    expect(result).toEqual(expected);
  });

  it("throws on API error response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: "ERROR",
        message: "Rate limit exceeded.",
        code: "RATE_LIMIT_EXCEEDED",
      }),
    });

    await expect(porkbunRequestNoAuth("/apikey/request")).rejects.toThrow(
      "Porkbun API error (RATE_LIMIT_EXCEEDED): Rate limit exceeded."
    );
  });
});

describe("listConfiguredUsers", () => {
  beforeEach(() => {
    clearPorkbunEnv();
    _resetAccountsCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetAccountsCache();
  });

  it("returns empty list when nothing is configured", () => {
    expect(listConfiguredUsers()).toEqual([]);
  });

  it("includes 'default' when top-level env vars are set", () => {
    vi.stubEnv("PORKBUN_API_KEY", "pk1");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "sk1");
    _resetAccountsCache();
    expect(listConfiguredUsers()).toContain("default");
  });

  it("excludes 'default' when only one of the top-level keys is set", () => {
    vi.stubEnv("PORKBUN_API_KEY", "pk1");
    _resetAccountsCache();
    expect(listConfiguredUsers()).not.toContain("default");
  });

  it("includes users from PORKBUN_ACCOUNTS (lowercased)", () => {
    vi.stubEnv(
      "PORKBUN_ACCOUNTS",
      JSON.stringify([
        { user: "Alice", PORKBUN_API_KEY: "a", PORKBUN_SECRET_API_KEY: "x" },
        { user: "BOB", PORKBUN_API_KEY: "b", PORKBUN_SECRET_API_KEY: "y" },
      ])
    );
    _resetAccountsCache();
    const users = listConfiguredUsers();
    expect(users).toContain("alice");
    expect(users).toContain("bob");
  });

  it("includes users from suffixed env-var pairs", () => {
    vi.stubEnv("PORKBUN_API_KEY_ALICE", "pk1");
    vi.stubEnv("PORKBUN_SECRET_API_KEY_ALICE", "sk1");
    vi.stubEnv("PORKBUN_API_KEY_BOB", "pk1");
    vi.stubEnv("PORKBUN_SECRET_API_KEY_BOB", "sk1");
    _resetAccountsCache();
    const users = listConfiguredUsers();
    expect(users).toContain("alice");
    expect(users).toContain("bob");
  });

  it("merges PORKBUN_ACCOUNTS users with top-level default", () => {
    vi.stubEnv("PORKBUN_API_KEY", "pk1");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "sk1");
    vi.stubEnv(
      "PORKBUN_ACCOUNTS",
      JSON.stringify([
        { user: "alice", PORKBUN_API_KEY: "a", PORKBUN_SECRET_API_KEY: "x" },
      ])
    );
    _resetAccountsCache();
    const users = listConfiguredUsers();
    expect(users).toContain("default");
    expect(users).toContain("alice");
  });
});
