import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequest } from "../../client.js";
import { dnsTools } from "../../tools/dns.js";

const mockRequest = vi.mocked(porkbunRequest);

describe("dnsTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("exports 11 tools", () => {
    expect(dnsTools).toHaveLength(11);
  });

  it("has no duplicate tool names", () => {
    const names = dnsTools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  describe("porkbun_dns_retrieve", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_retrieve")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/retrieve/example.com");
    });
  });

  describe("porkbun_dns_retrieve_by_id", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_retrieve_by_id")!;

    it("calls correct path with id", async () => {
      await tool.handler({ domain: "example.com", id: "123" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/retrieve/example.com/123");
    });
  });

  describe("porkbun_dns_retrieve_by_name_type", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_retrieve_by_name_type")!;

    it("calls with subdomain", async () => {
      await tool.handler({ domain: "example.com", type: "A", subdomain: "www" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/retrieveByNameType/example.com/A/www");
    });

    it("calls with empty subdomain for root", async () => {
      await tool.handler({ domain: "example.com", type: "A" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/retrieveByNameType/example.com/A/");
    });
  });

  describe("porkbun_dns_create", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_create")!;

    it("passes all fields", async () => {
      await tool.handler({ domain: "example.com", type: "A", content: "1.2.3.4", name: "www", ttl: 600, prio: 0 });
      expect(mockRequest).toHaveBeenCalledWith("/dns/create/example.com", {
        type: "A", content: "1.2.3.4", name: "www", ttl: 600, prio: 0,
      });
    });

    it("passes minimal fields", async () => {
      await tool.handler({ domain: "example.com", type: "A", content: "1.2.3.4" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/create/example.com", {
        type: "A", content: "1.2.3.4",
      });
    });
  });

  describe("porkbun_dns_edit", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_edit")!;

    it("passes type and content", async () => {
      await tool.handler({ domain: "example.com", id: "123", type: "A", content: "5.6.7.8" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/edit/example.com/123", {
        type: "A", content: "5.6.7.8",
      });
    });
  });

  describe("porkbun_dns_edit_by_name_type", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_edit_by_name_type")!;

    it("passes content with subdomain", async () => {
      await tool.handler({ domain: "example.com", type: "A", subdomain: "www", content: "5.6.7.8" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/editByNameType/example.com/A/www", { content: "5.6.7.8" });
    });

    it("uses empty subdomain for root", async () => {
      await tool.handler({ domain: "example.com", type: "A", content: "5.6.7.8" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/editByNameType/example.com/A/", { content: "5.6.7.8" });
    });
  });

  describe("porkbun_dns_delete", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_delete")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com", id: "123" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/delete/example.com/123");
    });
  });

  describe("porkbun_dns_delete_by_name_type", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_delete_by_name_type")!;

    it("calls with subdomain", async () => {
      await tool.handler({ domain: "example.com", type: "A", subdomain: "www" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/deleteByNameType/example.com/A/www");
    });
  });

  describe("porkbun_dns_create_dnssec", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_create_dnssec")!;

    it("passes required DNSSEC fields", async () => {
      await tool.handler({
        domain: "example.com",
        keyTag: "12345",
        alg: "13",
        digestType: "2",
        digest: "ABCD1234",
      });
      expect(mockRequest).toHaveBeenCalledWith("/dns/createDnssecRecord/example.com", {
        keyTag: "12345",
        alg: "13",
        digestType: "2",
        digest: "ABCD1234",
      });
    });
  });

  describe("porkbun_dns_get_dnssec", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_get_dnssec")!;

    it("calls correct path", async () => {
      await tool.handler({ domain: "example.com" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/getDnssecRecords/example.com");
    });
  });

  describe("porkbun_dns_delete_dnssec", () => {
    const tool = dnsTools.find((t) => t.name === "porkbun_dns_delete_dnssec")!;

    it("calls correct path with keytag", async () => {
      await tool.handler({ domain: "example.com", keytag: "12345" });
      expect(mockRequest).toHaveBeenCalledWith("/dns/deleteDnssecRecord/example.com/12345");
    });
  });
});
