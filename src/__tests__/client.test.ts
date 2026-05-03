import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { porkbunRequest, porkbunRequestNoAuth, listConfiguredUsers } from "../client.js";

describe("porkbunRequest", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("PORKBUN_API_KEY", "pk1_test");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "sk1_test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws if PORKBUN_API_KEY is not set", async () => {
    vi.stubEnv("PORKBUN_API_KEY", "");
    await expect(porkbunRequest("/ping")).rejects.toThrow(
      "PORKBUN_API_KEY environment variable is not set"
    );
  });

  it("throws if PORKBUN_SECRET_API_KEY is not set", async () => {
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "");
    await expect(porkbunRequest("/ping")).rejects.toThrow(
      "PORKBUN_SECRET_API_KEY environment variable is not set"
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

  describe("multi-user credentials", () => {
    it("resolves user-specific credentials when user is given", async () => {
      vi.stubEnv("PORKBUN_API_KEY_ALICE", "pk1_alice");
      vi.stubEnv("PORKBUN_SECRET_API_KEY_ALICE", "sk1_alice");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "alice");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.apikey).toBe("pk1_alice");
      expect(callBody.secretapikey).toBe("sk1_alice");
    });

    it("uppercases user identifier for env var lookup", async () => {
      vi.stubEnv("PORKBUN_API_KEY_BOB", "pk1_bob");
      vi.stubEnv("PORKBUN_SECRET_API_KEY_BOB", "sk1_bob");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "bob");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.apikey).toBe("pk1_bob");
    });

    it("normalizes non-alphanumerics in user identifier to underscore", async () => {
      vi.stubEnv("PORKBUN_API_KEY_ACME_CORP", "pk1_acme");
      vi.stubEnv("PORKBUN_SECRET_API_KEY_ACME_CORP", "sk1_acme");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping", undefined, "acme-corp");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.apikey).toBe("pk1_acme");
      expect(callBody.secretapikey).toBe("sk1_acme");
    });

    it("throws when user-specific API key is missing", async () => {
      await expect(porkbunRequest("/ping", undefined, "ghost")).rejects.toThrow(
        "PORKBUN_API_KEY_GHOST environment variable is not set"
      );
    });

    it("throws when user-specific secret key is missing", async () => {
      vi.stubEnv("PORKBUN_API_KEY_PARTIAL", "pk1_partial");
      await expect(porkbunRequest("/ping", undefined, "partial")).rejects.toThrow(
        "PORKBUN_SECRET_API_KEY_PARTIAL environment variable is not set"
      );
    });

    it("default credentials are used when no user is given even if user-specific ones exist", async () => {
      vi.stubEnv("PORKBUN_API_KEY_ALICE", "pk1_alice");
      vi.stubEnv("PORKBUN_SECRET_API_KEY_ALICE", "sk1_alice");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "SUCCESS" }),
      });

      await porkbunRequest("/ping");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.apikey).toBe("pk1_test");
      expect(callBody.secretapikey).toBe("sk1_test");
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
    // Strip any inherited PORKBUN_* env vars so tests are deterministic.
    for (const k of Object.keys(process.env)) {
      if (k.startsWith("PORKBUN_")) vi.stubEnv(k, "");
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty list when nothing is configured", () => {
    expect(listConfiguredUsers()).toEqual([]);
  });

  it("includes 'default' when both default keys are set", () => {
    vi.stubEnv("PORKBUN_API_KEY", "pk1");
    vi.stubEnv("PORKBUN_SECRET_API_KEY", "sk1");
    expect(listConfiguredUsers()).toContain("default");
  });

  it("excludes 'default' when only one of the default keys is set", () => {
    vi.stubEnv("PORKBUN_API_KEY", "pk1");
    expect(listConfiguredUsers()).not.toContain("default");
  });

  it("includes user-suffixed pairs (lowercased)", () => {
    vi.stubEnv("PORKBUN_API_KEY_ALICE", "pk1_alice");
    vi.stubEnv("PORKBUN_SECRET_API_KEY_ALICE", "sk1_alice");
    vi.stubEnv("PORKBUN_API_KEY_BOB", "pk1_bob");
    vi.stubEnv("PORKBUN_SECRET_API_KEY_BOB", "sk1_bob");
    const users = listConfiguredUsers();
    expect(users).toContain("alice");
    expect(users).toContain("bob");
  });

  it("excludes users with only an API key but no secret", () => {
    vi.stubEnv("PORKBUN_API_KEY_PARTIAL", "pk1_partial");
    expect(listConfiguredUsers()).not.toContain("partial");
  });
});
