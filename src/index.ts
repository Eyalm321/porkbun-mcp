#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { utilityTools } from "./tools/utility.js";
import { pricingTools } from "./tools/pricing.js";
import { apikeyTools } from "./tools/apikey.js";
import { domainTools } from "./tools/domain.js";
import { dnsTools } from "./tools/dns.js";
import { sslTools } from "./tools/ssl.js";
import { emailTools } from "./tools/email.js";
import { marketplaceTools } from "./tools/marketplace.js";

const server = new McpServer({
  name: "porkbun-mcp",
  version: "1.0.0",
});

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

for (const tool of allTools) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.shape as any,
    async (args: any) => {
      try {
        const result = await tool.handler(args as any);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Porkbun MCP server running");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
