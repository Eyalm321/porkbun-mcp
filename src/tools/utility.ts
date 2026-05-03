import { z } from "zod";
import { listConfiguredUsers, porkbunRequest, porkbunRequestNoAuth } from "../client.js";
import { userField } from "./_shared.js";

export const utilityTools = [
  {
    name: "porkbun_ping",
    description: "Test API credentials and get your public IP address. Returns IP and whether credentials are valid.",
    inputSchema: z.object({ user: userField }),
    handler: async (args: { user?: string }) => {
      return porkbunRequest("/ping", undefined, args.user);
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
  {
    name: "porkbun_list_users",
    description:
      "List configured Porkbun user identifiers discovered from environment variables. " +
      "Returns 'default' when PORKBUN_API_KEY is set, plus any users with both " +
      "PORKBUN_API_KEY_<USER> and PORKBUN_SECRET_API_KEY_<USER> defined.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>) => {
      return { users: listConfiguredUsers() };
    },
  },
];
