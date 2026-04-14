import { z } from "zod";
import { porkbunRequestNoAuth } from "../client.js";

export const pricingTools = [
  {
    name: "porkbun_get_pricing",
    description: "Retrieve domain pricing for all supported TLDs or a filtered subset. No authentication required. Prices are in USD.",
    inputSchema: z.object({
      tlds: z.array(z.string()).optional().describe("Optional array of TLDs to filter (e.g. ['com', 'net']). Omit for all TLDs."),
    }),
    handler: async (args: { tlds?: string[] }) => {
      return porkbunRequestNoAuth("/pricing/get", args.tlds ? { tlds: args.tlds } : {});
    },
  },
];
