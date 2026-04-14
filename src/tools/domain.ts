import { z } from "zod";
import { porkbunRequest } from "../client.js";

export const domainTools = [
  {
    name: "porkbun_domain_list_all",
    description: "List all domains in your Porkbun account. Returns up to 1000 domains per call, ordered by expiration date. Use 'start' to paginate.",
    inputSchema: z.object({
      start: z.number().optional().describe("Zero-based offset for pagination (default 0). Increment by 1000 to get next page."),
      includeLabels: z.enum(["yes", "no"]).optional().describe("Return label metadata for each domain. Defaults to 'no'."),
    }),
    handler: async (args: { start?: number; includeLabels?: string }) => {
      return porkbunRequest("/domain/listAll", {
        ...(args.start !== undefined && { start: args.start }),
        ...(args.includeLabels && { includeLabels: args.includeLabels }),
      });
    },
  },
  {
    name: "porkbun_domain_get_ns",
    description: "Get the authoritative nameservers for a domain.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name (e.g. 'example.com')."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/domain/getNs/${args.domain}`);
    },
  },
  {
    name: "porkbun_domain_update_ns",
    description: "Update the nameservers for a domain at the registry.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name (e.g. 'example.com')."),
      ns: z.array(z.string()).describe("Ordered array of nameserver hostnames (e.g. ['ns1.example.com', 'ns2.example.com'])."),
    }),
    handler: async (args: { domain: string; ns: string[] }) => {
      return porkbunRequest(`/domain/updateNs/${args.domain}`, { ns: args.ns });
    },
  },
  {
    name: "porkbun_domain_update_auto_renew",
    description: "Update the auto-renew setting for one or more domains.",
    inputSchema: z.object({
      domain: z.string().optional().describe("A single domain to update (optional if using 'domains' array)."),
      status: z.enum(["on", "off"]).describe("Auto-renew status to set."),
      domains: z.array(z.string()).optional().describe("Array of additional domain names to update."),
    }),
    handler: async (args: { domain?: string; status: string; domains?: string[] }) => {
      const path = args.domain ? `/domain/updateAutoRenew/${args.domain}` : "/domain/updateAutoRenew/";
      return porkbunRequest(path, {
        status: args.status,
        ...(args.domains && { domains: args.domains }),
      });
    },
  },
  {
    name: "porkbun_domain_check",
    description: "Check if a domain is available for registration and get current pricing. Rate limited: ~1 check per 10 seconds per account.",
    inputSchema: z.object({
      domain: z.string().describe("The domain to check (e.g. 'example.com')."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/domain/checkDomain/${args.domain}`);
    },
  },
  {
    name: "porkbun_domain_create",
    description: "Register a domain using account credit. Requires verified email/phone, sufficient credit, and agreement to terms. Cost must match current price in pennies (USD cents).",
    inputSchema: z.object({
      domain: z.string().describe("The domain to register (e.g. 'example.com')."),
      cost: z.number().describe("Registration cost in pennies (USD cents). Must match the current price from porkbun_domain_check."),
      agreeToTerms: z.enum(["yes", "1"]).describe("Must be 'yes' or '1' to confirm agreement to Porkbun terms."),
    }),
    handler: async (args: { domain: string; cost: number; agreeToTerms: string }) => {
      return porkbunRequest(`/domain/create/${args.domain}`, {
        cost: args.cost,
        agreeToTerms: args.agreeToTerms,
      });
    },
  },
  {
    name: "porkbun_domain_add_url_forward",
    description: "Add a URL forward for a domain or subdomain.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      subdomain: z.string().optional().describe("Subdomain to forward (omit for root domain)."),
      location: z.string().describe("Destination URL to forward to."),
      type: z.enum(["temporary", "permanent"]).describe("'permanent' = HTTP 301, 'temporary' = default redirect code."),
      includePath: z.enum(["yes", "no"]).describe("Whether to append the request URI path to the destination."),
      wildcard: z.enum(["yes", "no"]).describe("Whether to also forward all subdomains."),
    }),
    handler: async (args: { domain: string; subdomain?: string; location: string; type: string; includePath: string; wildcard: string }) => {
      return porkbunRequest(`/domain/addUrlForward/${args.domain}`, {
        ...(args.subdomain && { subdomain: args.subdomain }),
        location: args.location,
        type: args.type,
        includePath: args.includePath,
        wildcard: args.wildcard,
      });
    },
  },
  {
    name: "porkbun_domain_get_url_forwarding",
    description: "List all active URL forwards for a domain.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/domain/getUrlForwarding/${args.domain}`);
    },
  },
  {
    name: "porkbun_domain_delete_url_forward",
    description: "Delete a specific URL forward by ID.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      id: z.string().describe("URL forward record ID."),
    }),
    handler: async (args: { domain: string; id: string }) => {
      return porkbunRequest(`/domain/deleteUrlForward/${args.domain}/${args.id}`);
    },
  },
  {
    name: "porkbun_domain_create_glue",
    description: "Create a glue record (host object) for a nameserver hostname under the domain.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      subdomain: z.string().describe("The subdomain portion (e.g. 'ns1' for ns1.example.com)."),
      ips: z.array(z.string()).describe("Array of IP addresses (IPv4 and/or IPv6) for the host record."),
    }),
    handler: async (args: { domain: string; subdomain: string; ips: string[] }) => {
      return porkbunRequest(`/domain/createGlue/${args.domain}/${args.subdomain}`, { ips: args.ips });
    },
  },
  {
    name: "porkbun_domain_update_glue",
    description: "Update the IP addresses of a glue record. Replaces all existing IPs.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      subdomain: z.string().describe("The subdomain portion (e.g. 'ns1')."),
      ips: z.array(z.string()).describe("New array of IP addresses to set."),
    }),
    handler: async (args: { domain: string; subdomain: string; ips: string[] }) => {
      return porkbunRequest(`/domain/updateGlue/${args.domain}/${args.subdomain}`, { ips: args.ips });
    },
  },
  {
    name: "porkbun_domain_delete_glue",
    description: "Delete a glue record (host object) for a subdomain.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      subdomain: z.string().describe("The subdomain portion (e.g. 'ns1')."),
    }),
    handler: async (args: { domain: string; subdomain: string }) => {
      return porkbunRequest(`/domain/deleteGlue/${args.domain}/${args.subdomain}`);
    },
  },
  {
    name: "porkbun_domain_get_glue",
    description: "Retrieve all glue records (host objects) registered under the domain.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/domain/getGlue/${args.domain}`);
    },
  },
];
