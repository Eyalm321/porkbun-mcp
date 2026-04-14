import { z } from "zod";
import { porkbunRequest } from "../client.js";

const dnsTypeEnum = z.enum(["A", "AAAA", "MX", "CNAME", "ALIAS", "TXT", "NS", "SRV", "TLSA", "CAA", "SSHFP"]);

export const dnsTools = [
  {
    name: "porkbun_dns_retrieve",
    description: "Retrieve all editable DNS records for a domain. SOA and default NS records are excluded.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name (e.g. 'example.com')."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/dns/retrieve/${args.domain}`);
    },
  },
  {
    name: "porkbun_dns_retrieve_by_id",
    description: "Retrieve a specific DNS record by its numeric ID.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      id: z.string().describe("Numeric DNS record ID."),
    }),
    handler: async (args: { domain: string; id: string }) => {
      return porkbunRequest(`/dns/retrieve/${args.domain}/${args.id}`);
    },
  },
  {
    name: "porkbun_dns_retrieve_by_name_type",
    description: "Retrieve DNS records matching a specific subdomain and record type.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      type: z.string().describe("DNS record type (A, AAAA, CNAME, MX, TXT, etc.)."),
      subdomain: z.string().optional().describe("Subdomain portion only. Omit for root domain records."),
    }),
    handler: async (args: { domain: string; type: string; subdomain?: string }) => {
      const sub = args.subdomain || "";
      return porkbunRequest(`/dns/retrieveByNameType/${args.domain}/${args.type}/${sub}`);
    },
  },
  {
    name: "porkbun_dns_create",
    description: "Create a new DNS record for a domain. Returns the record ID.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      type: dnsTypeEnum.describe("DNS record type."),
      content: z.string().describe("The record value (e.g. IP address, hostname, TXT value)."),
      name: z.string().optional().describe("Subdomain (e.g. 'www', '*' for wildcard, blank for root). Do not include the domain itself."),
      ttl: z.number().optional().describe("Time to live in seconds. Minimum is typically 600."),
      prio: z.number().optional().describe("Priority for MX and SRV records. Defaults to 0."),
      notes: z.string().optional().describe("Optional notes (not served in DNS)."),
    }),
    handler: async (args: { domain: string; type: string; content: string; name?: string; ttl?: number; prio?: number; notes?: string }) => {
      const { domain, ...body } = args;
      return porkbunRequest(`/dns/create/${domain}`, body as Record<string, unknown>);
    },
  },
  {
    name: "porkbun_dns_edit",
    description: "Edit a specific DNS record by its numeric ID.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      id: z.string().describe("Numeric DNS record ID."),
      type: dnsTypeEnum.describe("DNS record type."),
      content: z.string().describe("The new record value."),
      name: z.string().optional().describe("Subdomain. Do not include the domain itself."),
      ttl: z.number().optional().describe("Time to live in seconds."),
      prio: z.number().optional().describe("Priority for MX/SRV records."),
      notes: z.string().optional().describe("Notes. Pass empty string to clear; omit to leave unchanged."),
    }),
    handler: async (args: { domain: string; id: string; type: string; content: string; name?: string; ttl?: number; prio?: number; notes?: string }) => {
      const { domain, id, ...body } = args;
      return porkbunRequest(`/dns/edit/${domain}/${id}`, body as Record<string, unknown>);
    },
  },
  {
    name: "porkbun_dns_edit_by_name_type",
    description: "Replace the content of all DNS records matching a given subdomain and type.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      type: z.string().describe("DNS record type (e.g. 'A')."),
      subdomain: z.string().optional().describe("Subdomain portion. Omit for root domain."),
      content: z.string().describe("New record value to set on all matching records."),
      ttl: z.number().optional().describe("Time to live in seconds."),
      prio: z.number().optional().describe("Priority."),
      notes: z.string().optional().describe("Notes. Pass empty string to clear; omit to leave unchanged."),
    }),
    handler: async (args: { domain: string; type: string; subdomain?: string; content: string; ttl?: number; prio?: number; notes?: string }) => {
      const { domain, type, subdomain, ...body } = args;
      const sub = subdomain || "";
      return porkbunRequest(`/dns/editByNameType/${domain}/${type}/${sub}`, body as Record<string, unknown>);
    },
  },
  {
    name: "porkbun_dns_delete",
    description: "Delete a specific DNS record by its numeric ID.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      id: z.string().describe("Numeric DNS record ID."),
    }),
    handler: async (args: { domain: string; id: string }) => {
      return porkbunRequest(`/dns/delete/${args.domain}/${args.id}`);
    },
  },
  {
    name: "porkbun_dns_delete_by_name_type",
    description: "Delete all DNS records matching a given subdomain and type.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      type: z.string().describe("DNS record type (e.g. 'A')."),
      subdomain: z.string().optional().describe("Subdomain portion. Omit for root domain."),
    }),
    handler: async (args: { domain: string; type: string; subdomain?: string }) => {
      const sub = args.subdomain || "";
      return porkbunRequest(`/dns/deleteByNameType/${args.domain}/${args.type}/${sub}`);
    },
  },
  {
    name: "porkbun_dns_create_dnssec",
    description: "Create a DNSSEC DS or key record at the registry.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      keyTag: z.string().describe("DNSSEC key tag."),
      alg: z.string().describe("DS Data algorithm number (e.g. '13' for ECDSA P-256)."),
      digestType: z.string().describe("Digest type number (e.g. '2' for SHA-256)."),
      digest: z.string().describe("Hex-encoded digest value."),
      maxSigLife: z.string().optional().describe("Maximum signature lifetime in seconds (optional)."),
      keyDataFlags: z.string().optional().describe("Key data flags (optional)."),
      keyDataProtocol: z.string().optional().describe("Key data protocol (optional)."),
      keyDataAlgo: z.string().optional().describe("Key data algorithm (optional)."),
      keyDataPubKey: z.string().optional().describe("Key data public key in base64 (optional)."),
    }),
    handler: async (args: { domain: string; keyTag: string; alg: string; digestType: string; digest: string; maxSigLife?: string; keyDataFlags?: string; keyDataProtocol?: string; keyDataAlgo?: string; keyDataPubKey?: string }) => {
      const { domain, ...body } = args;
      return porkbunRequest(`/dns/createDnssecRecord/${domain}`, body as Record<string, unknown>);
    },
  },
  {
    name: "porkbun_dns_get_dnssec",
    description: "Retrieve DNSSEC records associated with the domain at the registry.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
    }),
    handler: async (args: { domain: string }) => {
      return porkbunRequest(`/dns/getDnssecRecords/${args.domain}`);
    },
  },
  {
    name: "porkbun_dns_delete_dnssec",
    description: "Delete a DNSSEC record from the registry by key tag.",
    inputSchema: z.object({
      domain: z.string().describe("The domain name."),
      keytag: z.string().describe("The DNSSEC key tag value."),
    }),
    handler: async (args: { domain: string; keytag: string }) => {
      return porkbunRequest(`/dns/deleteDnssecRecord/${args.domain}/${args.keytag}`);
    },
  },
];
