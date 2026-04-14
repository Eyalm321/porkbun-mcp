import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { porkbunRequest, porkbunRequestNoAuth } from "../client.js";

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
