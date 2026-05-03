import { z } from "zod";
import { porkbunRequest } from "../client.js";
import { userField } from "./_shared.js";

export const emailTools = [
  {
    name: "porkbun_email_set_password",
    description: "Set the password for an email hosting account associated with a domain managed by your API key.",
    inputSchema: z.object({
      emailAddress: z.string().describe("The full email address (e.g. 'user@example.com')."),
      password: z.string().describe("The new password. Must pass Porkbun password validation rules."),
      user: userField,
    }),
    handler: async (args: { emailAddress: string; password: string; user?: string }) => {
      return porkbunRequest("/email/setPassword", {
        emailAddress: args.emailAddress,
        password: args.password,
      }, args.user);
    },
  },
];
