import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequestNoAuth } from "../../client.js";
import { pricingTools } from "../../tools/pricing.js";

const mockNoAuth = vi.mocked(porkbunRequestNoAuth);

describe("pricingTools", () => {
  beforeEach(() => {
    mockNoAuth.mockClear();
  });

  it("exports 1 tool", () => {
    expect(pricingTools).toHaveLength(1);
  });

  describe("porkbun_get_pricing", () => {
    const tool = pricingTools.find((t) => t.name === "porkbun_get_pricing")!;

    it("calls without tlds when not provided", async () => {
      await tool.handler({});
      expect(mockNoAuth).toHaveBeenCalledWith("/pricing/get", {});
    });

    it("passes tlds array when provided", async () => {
      await tool.handler({ tlds: ["com", "net"] });
      expect(mockNoAuth).toHaveBeenCalledWith("/pricing/get", { tlds: ["com", "net"] });
    });
  });
});
