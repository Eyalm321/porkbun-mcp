import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequestNoAuth } from "../../client.js";
import { apikeyTools } from "../../tools/apikey.js";

const mockNoAuth = vi.mocked(porkbunRequestNoAuth);

describe("apikeyTools", () => {
  beforeEach(() => {
    mockNoAuth.mockClear();
  });

  it("exports 2 tools", () => {
    expect(apikeyTools).toHaveLength(2);
  });

  describe("porkbun_apikey_request", () => {
    const tool = apikeyTools.find((t) => t.name === "porkbun_apikey_request")!;

    it("calls without name when not provided", async () => {
      await tool.handler({});
      expect(mockNoAuth).toHaveBeenCalledWith("/apikey/request", {});
    });

    it("passes name when provided", async () => {
      await tool.handler({ name: "My App" });
      expect(mockNoAuth).toHaveBeenCalledWith("/apikey/request", { name: "My App" });
    });
  });

  describe("porkbun_apikey_retrieve", () => {
    const tool = apikeyTools.find((t) => t.name === "porkbun_apikey_retrieve")!;

    it("passes requestToken", async () => {
      await tool.handler({ requestToken: "abc123" });
      expect(mockNoAuth).toHaveBeenCalledWith("/apikey/retrieve", { requestToken: "abc123" });
    });
  });
});
