# porkbun-mcp

MCP server for the [Porkbun API v3](https://porkbun.com/api/json/v3/documentation) — 33 tools covering domain registration, DNS management, SSL certificates, email hosting, marketplace, and more. Supports multiple Porkbun accounts in a single server instance.

## Installation

### npm

```bash
npm install -g porkbun-mcp-server
```

### GitHub Packages

```bash
npm install -g @eyalm321/porkbun-mcp-server --registry=https://npm.pkg.github.com
```

## Configuration

### Single account (default)

```bash
export PORKBUN_API_KEY="pk1_..."
export PORKBUN_SECRET_API_KEY="sk1_..."
```

Get your API keys at [porkbun.com/account/api](https://porkbun.com/account/api).

### Multiple accounts

Define additional credential pairs with a `_<USER>` suffix. The user identifier is uppercased; non-alphanumeric characters become underscores.

```bash
# Default account (used when no `user` is passed)
export PORKBUN_API_KEY="pk1_..."
export PORKBUN_SECRET_API_KEY="sk1_..."

# Per-user accounts
export PORKBUN_API_KEY_ALICE="pk1_..."
export PORKBUN_SECRET_API_KEY_ALICE="sk1_..."

export PORKBUN_API_KEY_ACME_CORP="pk1_..."
export PORKBUN_SECRET_API_KEY_ACME_CORP="sk1_..."
```

Then pass `user` to any authenticated tool:

```jsonc
// Use the default credentials
{ "name": "porkbun_domain_list_all", "arguments": {} }

// Use Alice's credentials
{ "name": "porkbun_domain_list_all", "arguments": { "user": "alice" } }

// Identifiers are case-insensitive; `acme-corp` matches PORKBUN_API_KEY_ACME_CORP
{ "name": "porkbun_domain_list_all", "arguments": { "user": "acme-corp" } }
```

Use `porkbun_list_users` to discover which user identifiers are configured in the running server.

## Usage with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "porkbun": {
      "command": "npx",
      "args": ["-y", "porkbun-mcp-server"],
      "env": {
        "PORKBUN_API_KEY": "pk1_...",
        "PORKBUN_SECRET_API_KEY": "sk1_...",
        "PORKBUN_API_KEY_ALICE": "pk1_...",
        "PORKBUN_SECRET_API_KEY_ALICE": "sk1_..."
      }
    }
  }
}
```

## Tools (33)

### Utility
- `porkbun_ping` — Test credentials and get IP
- `porkbun_get_ip` — Get public IP (no auth)
- `porkbun_list_users` — List configured user identifiers

### Pricing
- `porkbun_get_pricing` — Get domain pricing for all TLDs (no auth)

### API Key Management
- `porkbun_apikey_request` — Initiate API key authorization
- `porkbun_apikey_retrieve` — Poll for API key approval

### Domain (13 tools)
- `porkbun_domain_list_all` — List all domains
- `porkbun_domain_get_ns` — Get nameservers
- `porkbun_domain_update_ns` — Update nameservers
- `porkbun_domain_update_auto_renew` — Update auto-renew
- `porkbun_domain_check` — Check availability & pricing
- `porkbun_domain_create` — Register a domain
- `porkbun_domain_add_url_forward` — Add URL forward
- `porkbun_domain_get_url_forwarding` — List URL forwards
- `porkbun_domain_delete_url_forward` — Delete URL forward
- `porkbun_domain_create_glue` — Create glue record
- `porkbun_domain_update_glue` — Update glue record
- `porkbun_domain_delete_glue` — Delete glue record
- `porkbun_domain_get_glue` — Get glue records

### DNS (11 tools)
- `porkbun_dns_retrieve` — Retrieve all DNS records
- `porkbun_dns_retrieve_by_id` — Get record by ID
- `porkbun_dns_retrieve_by_name_type` — Get records by name/type
- `porkbun_dns_create` — Create DNS record
- `porkbun_dns_edit` — Edit record by ID
- `porkbun_dns_edit_by_name_type` — Edit records by name/type
- `porkbun_dns_delete` — Delete record by ID
- `porkbun_dns_delete_by_name_type` — Delete records by name/type
- `porkbun_dns_create_dnssec` — Create DNSSEC record
- `porkbun_dns_get_dnssec` — Get DNSSEC records
- `porkbun_dns_delete_dnssec` — Delete DNSSEC record

### SSL
- `porkbun_ssl_retrieve` — Retrieve SSL certificate bundle

### Email Hosting
- `porkbun_email_set_password` — Set email hosting password

### Marketplace
- `porkbun_marketplace_list` — List marketplace domains

Every authenticated tool accepts an optional `user` parameter that selects which `PORKBUN_API_KEY_<USER>` / `PORKBUN_SECRET_API_KEY_<USER>` credential pair to use. Omit it to use the default `PORKBUN_API_KEY` / `PORKBUN_SECRET_API_KEY`.

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
