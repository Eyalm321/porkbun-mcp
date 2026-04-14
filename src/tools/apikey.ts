import { z } from "zod";
import { porkbunRequestNoAuth } from "../client.js";

export const apikeyTools = [
  {
    name: "porkbun_apikey_request",
    description: "Initiate an API key authorization request. Returns a requestToken and authUrl that the account holder must visit to approve. No credentials required. Rate limited: 20 requests per IP per hour.",
    inputSchema: z.object({
      name: z.string().optional().describe("Optional human-readable name for the application requesting access (max 255 chars)."),
    }),
    handler: async (args: { name?: string }) => {
      return porkbunRequestNoAuth("/apikey/request", args.name ? { name: args.name } : {});
    },
  },
  {
    name: "porkbun_apikey_retrieve",
    description: "Poll for API key approval status. Returns PENDING while awaiting approval, SUCCESS with public API key on approval. The secret key is shown only in the user's browser. Rate limited: 120 requests per IP per hour.",
    inputSchema: z.object({
      requestToken: z.string().describe("The 64-character hex token returned by porkbun_apikey_request."),
    }),
    handler: async (args: { requestToken: string }) => {
      return porkbunRequestNoAuth("/apikey/retrieve", { requestToken: args.requestToken });
    },
  },
];
