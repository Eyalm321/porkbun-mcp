import { z } from "zod";
import { porkbunRequest } from "../client.js";

export const marketplaceTools = [
  {
    name: "porkbun_marketplace_list",
    description: "List domains currently on the Porkbun marketplace. Up to 5000 domains per request. Results are paginated.",
    inputSchema: z.object({
      start: z.number().optional().describe("Offset to start retrieving from (default 0)."),
      limit: z.number().optional().describe("Number of domains to return (default 1000, max 5000)."),
    }),
    handler: async (args: { start?: number; limit?: number }) => {
      return porkbunRequest("/marketplace/getAll", {
        ...(args.start !== undefined && { start: args.start }),
        ...(args.limit !== undefined && { limit: args.limit }),
      });
    },
  },
];
