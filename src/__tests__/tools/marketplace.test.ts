import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequest } from "../../client.js";
import { marketplaceTools } from "../../tools/marketplace.js";

const mockRequest = vi.mocked(porkbunRequest);

describe("marketplaceTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("exports 1 tool", () => {
    expect(marketplaceTools).toHaveLength(1);
  });

  describe("porkbun_marketplace_list", () => {
    const tool = marketplaceTools.find((t) => t.name === "porkbun_marketplace_list")!;

    it("calls with no extra params", async () => {
      await tool.handler({});
      expect(mockRequest).toHaveBeenCalledWith("/marketplace/getAll", {});
    });

    it("passes start and limit", async () => {
      await tool.handler({ start: 0, limit: 500 });
      expect(mockRequest).toHaveBeenCalledWith("/marketplace/getAll", { start: 0, limit: 500 });
    });
  });
});
