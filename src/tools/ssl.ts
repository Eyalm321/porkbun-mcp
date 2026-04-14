import { z } from "zod";
import { porkbunRequest } from "../client.js";

export const sslTools = [
  {
    name: "porkbun_ssl_retrieve",
    description: "Retrieve the Let's Encrypt SSL certificate bundle for a domain. Returns the certificate chain, private key, and public key in PEM format.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name (e.g. 'example.com')."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/ssl/retrieve/${args.domain}`);
    },
  },
];
