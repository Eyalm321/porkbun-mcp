import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequest, porkbunRequestNoAuth } from "../../client.js";
import { utilityTools } from "../../tools/utility.js";

const mockRequest = vi.mocked(porkbunRequest);
const mockNoAuth = vi.mocked(porkbunRequestNoAuth);

describe("utilityTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
    mockNoAuth.mockClear();
  });

  it("exports 2 tools", () => {
    expect(utilityTools).toHaveLength(2);
  });

  describe("porkbun_ping", () => {
    const tool = utilityTools.find((t) => t.name === "porkbun_ping")!;

    it("exists with correct name", () => {
      expect(tool).toBeDefined();
    });

    it("calls porkbunRequest with /ping", async () => {
      await tool.handler({} as any);
      expect(mockRequest).toHaveBeenCalledWith("/ping");
    });
  });

  describe("porkbun_get_ip", () => {
    const tool = utilityTools.find((t) => t.name === "porkbun_get_ip")!;

    it("exists with correct name", () => {
      expect(tool).toBeDefined();
    });

    it("calls porkbunRequestNoAuth with /ip", async () => {
      await tool.handler({} as any);
      expect(mockNoAuth).toHaveBeenCalledWith("/ip");
    });
  });
});
