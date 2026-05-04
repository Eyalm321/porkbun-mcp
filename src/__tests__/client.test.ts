import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  describe("PORKBUN_ACCOUNTS_FILE multi-user", () => {
    let tmp: string;

    beforeEach(() => {
      tmp = mkdtempSync(join(tmpdir(), "porkbun-mcp-test-"));
    });

    afterEach(() => {
      rmSync(tmp, { recursive: true, force: true });
    });

    it("loads accounts from a JSON file", async () => {
      const file = join(tmp, "accounts.json");
      writeFileSync(
        file,
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
          { user: "bob", PORKBUN_API_KEY: "pk1_bob", PORKBUN_SECRET_API_KEY: "sk1_bob" },
        ])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
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
      const file = join(tmp, "accounts.json");
      writeFileSync(
        file,
        JSON.stringify([
          { user: "AliceCo", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
        ])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "aliceco");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_alice");
    });

    it("accepts apiKey / secretApiKey aliases", async () => {
      const file = join(tmp, "accounts.json");
      writeFileSync(
        file,
        JSON.stringify([{ user: "alice", apiKey: "pk1_alice", secretApiKey: "sk1_alice" }])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
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

    it("default account in the file overrides top-level env vars", async () => {
      const file = join(tmp, "accounts.json");
      writeFileSync(
        file,
        JSON.stringify([
          { user: "default", PORKBUN_API_KEY: "pk1_file_default", PORKBUN_SECRET_API_KEY: "sk1_file_default" },
        ])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
      _resetAccountsCache();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.apikey).toBe("pk1_file_default");
    });

    it("falls back to top-level env vars when the file has no default", async () => {
      const file = join(tmp, "accounts.json");
      writeFileSync(
        file,
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
        ])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
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
      const file = join(tmp, "accounts.json");
      writeFileSync(
        file,
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "pk1_alice", PORKBUN_SECRET_API_KEY: "sk1_alice" },
        ])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
      _resetAccountsCache();
      await expect(porkbunRequest("/ping", undefined, "ghost")).rejects.toThrow(
        /No Porkbun credentials configured for user "ghost"/
      );
    });

    it("throws when the file path does not exist", async () => {
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", join(tmp, "does-not-exist.json"));
      _resetAccountsCache();
      await expect(porkbunRequest("/ping")).rejects.toThrow(
        /PORKBUN_ACCOUNTS_FILE could not be read/
      );
    });

    it("throws when the file is not valid JSON", async () => {
      const file = join(tmp, "bad.json");
      writeFileSync(file, "not-json");
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
      _resetAccountsCache();
      await expect(porkbunRequest("/ping")).rejects.toThrow(
        /PORKBUN_ACCOUNTS_FILE is not valid JSON/
      );
    });

    it("throws when the file is not a JSON array", async () => {
      const file = join(tmp, "wrong.json");
      writeFileSync(file, JSON.stringify({ user: "alice" }));
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
      _resetAccountsCache();
      await expect(porkbunRequest("/ping")).rejects.toThrow(
        /PORKBUN_ACCOUNTS_FILE must be a JSON array/
      );
    });

    it("throws when an entry is missing api key fields", async () => {
      const file = join(tmp, "missing.json");
      writeFileSync(
        file,
        JSON.stringify([{ user: "alice", PORKBUN_API_KEY: "pk1_alice" }])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
      _resetAccountsCache();
      await expect(porkbunRequest("/ping", undefined, "alice")).rejects.toThrow(
        /missing PORKBUN_API_KEY or PORKBUN_SECRET_API_KEY/
      );
    });

    it("throws when the file has duplicate users", async () => {
      const file = join(tmp, "dupes.json");
      writeFileSync(
        file,
        JSON.stringify([
          { user: "alice", PORKBUN_API_KEY: "a", PORKBUN_SECRET_API_KEY: "x" },
          { user: "Alice", PORKBUN_API_KEY: "b", PORKBUN_SECRET_API_KEY: "y" },
        ])
      );
      vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
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
  let tmp: string;

  beforeEach(() => {
    clearPorkbunEnv();
    _resetAccountsCache();
    tmp = mkdtempSync(join(tmpdir(), "porkbun-mcp-test-"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetAccountsCache();
    rmSync(tmp, { recursive: true, force: true });
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

  it("includes users from PORKBUN_ACCOUNTS_FILE (lowercased)", () => {
    const file = join(tmp, "accounts.json");
    writeFileSync(
      file,
      JSON.stringify([
        { user: "Alice", PORKBUN_API_KEY: "a", PORKBUN_SECRET_API_KEY: "x" },
        { user: "BOB", PORKBUN_API_KEY: "b", PORKBUN_SECRET_API_KEY: "y" },
      ])
    );
    vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
    _resetAccountsCache();
    const users = listConfiguredUsers();
    expect(users).toContain("alice");
    expect(users).toContain("bob");
  });

  it("merges users from the file with the top-level default", () => {
    vi.stubEnv("PORKBUN_API_KEY", "pk1");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "sk1");
    const file = join(tmp, "accounts.json");
    writeFileSync(
      file,
      JSON.stringify([
        { user: "alice", PORKBUN_API_KEY: "a", PORKBUN_SECRET_API_KEY: "x" },
      ])
    );
    vi.stubEnv("PORKBUN_ACCOUNTS_FILE", file);
    _resetAccountsCache();
    const users = listConfiguredUsers();
    expect(users).toContain("default");
    expect(users).toContain("alice");
  });
});
