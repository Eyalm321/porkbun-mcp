import { describe, it, expect } from "vitest";
import { utilityTools } from "../tools/utility.js";
import { pricingTools } from "../tools/pricing.js";
import { apikeyTools } from "../tools/apikey.js";
import { domainTools } from "../tools/domain.js";
import { dnsTools } from "../tools/dns.js";
import { sslTools } from "../tools/ssl.js";
import { emailTools } from "../tools/email.js";
import { marketplaceTools } from "../tools/marketplace.js";

const allTools = [
  ...utilityTools,
  ...pricingTools,
  ...apikeyTools,
  ...domainTools,
  ...dnsTools,
  ...sslTools,
  ...emailTools,
  ...marketplaceTools,
];

describe("Tool Registration", () => {
  it("has no duplicate tool names across all modules", () => {
    const names = allTools.map((t) => t.name);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    expect(duplicates).toEqual([]);
  });

  it("all tools have required properties", () => {
    for (const tool of allTools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.handler).toBe("function");
    }
  });

  it("all tool names follow porkbun_ naming convention", () => {
    for (const tool of allTools) {
      expect(tool.name).toMatch(/^porkbun_/);
    }
  });

  it("registers the expected total number of tools (32)", () => {
    expect(allTools.length).toBe(32);
  });

  it("each module exports a non-empty array", () => {
    const modules = [
      utilityTools, pricingTools, apikeyTools, domainTools,
      dnsTools, sslTools, emailTools, marketplaceTools,
    ];
    for (const mod of modules) {
      expect(Array.isArray(mod)).toBe(true);
      expect(mod.length).toBeGreaterThan(0);
    }
  });
});
