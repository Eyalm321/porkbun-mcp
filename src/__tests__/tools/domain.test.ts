import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  listConfiguredUsers: vi.fn().mockReturnValue([]),
}));

import { porkbunRequest } from "../../client.js";
import { domainTools } from "../../tools/domain.js";

const mockRequest = vi.mocked(porkbunRequest);

describe("domainTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("exports 13 tools", () => {
    expect(domainTools).toHaveLength(13);
  });

  it("has no duplicate tool names", () => {
    const names = domainTools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every tool accepts an optional user param", () => {
    for (const tool of domainTools) {
      expect(tool.inputSchema.shape).toHaveProperty("user");
    }
  });

  describe("porkbun_domain_list_all", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_list_all")!;

    it("calls /domain/listAll with no extra params", async () => {
      await tool.handler({});
      expect(mockRequest).toHaveBeenCalledWith("/domain/listAll", {}, undefined);
    });

    it("passes start and includeLabels", async () => {
      await tool.handler({ start: 1000, includeLabels: "yes" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/listAll", { start: 1000, includeLabels: "yes" }, undefined);
    });

    it("forwards user param", async () => {
      await tool.handler({ user: "alice" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/listAll", {}, "alice");
    });
  });

  describe("porkbun_domain_get_ns", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_get_ns")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/getNs/example.com", undefined, undefined);
    });

    it("forwards user param", async () => {
      await tool.handler({ domain: "example.com", user: "bob" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/getNs/example.com", undefined, "bob");
    });
  });

  describe("porkbun_domain_update_ns", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_update_ns")!;

    it("passes nameservers", async () => {
      await tool.handler({ domain: "example.com", ns: ["ns1.test.com", "ns2.test.com"] });
      expect(mockRequest).toHaveBeenCalledWith("/domain/updateNs/example.com", { ns: ["ns1.test.com", "ns2.test.com"] }, undefined);
    });
  });

  describe("porkbun_domain_update_auto_renew", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_update_auto_renew")!;

    it("uses domain in path when provided", async () => {
      await tool.handler({ domain: "example.com", status: "on" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/updateAutoRenew/example.com", { status: "on" }, undefined);
    });

    it("uses trailing slash when no domain", async () => {
      await tool.handler({ status: "off", domains: ["a.com", "b.com"] });
      expect(mockRequest).toHaveBeenCalledWith("/domain/updateAutoRenew/", { status: "off", domains: ["a.com", "b.com"] }, undefined);
    });
  });

  describe("porkbun_domain_check", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_check")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "test.com" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/checkDomain/test.com", undefined, undefined);
    });
  });

  describe("porkbun_domain_create", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_create")!;

    it("passes cost and agreeToTerms", async () => {
      await tool.handler({ domain: "new.com", cost: 973, agreeToTerms: "yes" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/create/new.com", { cost: 973, agreeToTerms: "yes" }, undefined);
    });
  });

  describe("porkbun_domain_add_url_forward", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_add_url_forward")!;

    it("passes all forward params", async () => {
      await tool.handler({
        domain: "example.com",
        subdomain: "www",
        location: "https://dest.com",
        type: "permanent",
        includePath: "yes",
        wildcard: "no",
      });
      expect(mockRequest).toHaveBeenCalledWith("/domain/addUrlForward/example.com", {
        subdomain: "www",
        location: "https://dest.com",
        type: "permanent",
        includePath: "yes",
        wildcard: "no",
      }, undefined);
    });
  });

  describe("porkbun_domain_get_url_forwarding", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_get_url_forwarding")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/getUrlForwarding/example.com", undefined, undefined);
    });
  });

  describe("porkbun_domain_delete_url_forward", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_delete_url_forward")!;

    it("calls correct path with id", async () => {
      await tool.handler({ domain: "example.com", id: "12345" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/deleteUrlForward/example.com/12345", undefined, undefined);
    });
  });

  describe("porkbun_domain_create_glue", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_create_glue")!;

    it("passes IPs", async () => {
      await tool.handler({ domain: "example.com", subdomain: "ns1", ips: ["1.2.3.4"] });
      expect(mockRequest).toHaveBeenCalledWith("/domain/createGlue/example.com/ns1", { ips: ["1.2.3.4"] }, undefined);
    });
  });

  describe("porkbun_domain_update_glue", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_update_glue")!;

    it("passes IPs", async () => {
      await tool.handler({ domain: "example.com", subdomain: "ns1", ips: ["5.6.7.8"] });
      expect(mockRequest).toHaveBeenCalledWith("/domain/updateGlue/example.com/ns1", { ips: ["5.6.7.8"] }, undefined);
    });
  });

  describe("porkbun_domain_delete_glue", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_delete_glue")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com", subdomain: "ns1" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/deleteGlue/example.com/ns1", undefined, undefined);
    });
  });

  describe("porkbun_domain_get_glue", () => {
    const tool = domainTools.find((t) => t.name === "porkbun_domain_get_glue")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com" });
      expect(mockRequest).toHaveBeenCalledWith("/domain/getGlue/example.com", undefined, undefined);
    });
  });
});
