import { z } from "zod";
import { porkbunRequest, porkbunRequestNoAuth } from "../client.js";

export const utilityTools = [
  {
    name: "porkbun_ping",
    description: "Test API credentials and get your public IP address. Returns IP and whether credentials are valid.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>) => {
      return porkbunRequest("/ping");
    },
  },
  {
    name: "porkbun_get_ip",
    description: "Get your public IP address. No credentials required.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>) => {
      return porkbunRequestNoAuth("/ip");
    },
  },
];
