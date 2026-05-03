import { z } from "zod";
import { porkbunRequest } from "../client.js";
import { userField } from "./_shared.js";

export const marketplaceTools = [
  {
    name: "porkbun_marketplace_list",
    description: "List domains currently on the Porkbun marketplace. Up to 5000 domains per request. Results are paginated.",
    inputSchema: z.object({
      start: z.number().optional().describe("Offset to start retrieving from (default 0)."),
      limit: z.number().optional().describe("Number of domains to return (default 1000, max 5000)."),
      user: userField,
    }),
    handler: async (args: { start?: number; limit?: number; user?: string }) => {
      return porkbunRequest("/marketplace/getAll", {
        ...(args.start !== undefined && { start: args.start }),
        ...(args.limit !== undefined && { limit: args.limit }),
      }, args.user);
    },
  },
];
