import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequest } from "../../client.js";
import { sslTools } from "../../tools/ssl.js";

const mockRequest = vi.mocked(porkbunRequest);

describe("sslTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("exports 1 tool", () => {
    expect(sslTools).toHaveLength(1);
  });

  describe("porkbun_ssl_retrieve", () => {
    const tool = sslTools.find((t) => t.name === "porkbun_ssl_retrieve")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com" });
      expect(mockRequest).toHaveBeenCalledWith("/ssl/retrieve/example.com");
    });
  });
});
