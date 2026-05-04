import { z } from "zod";

/**
 * Optional `user` field added to every authenticated tool. Selects which
 * Porkbun account credentials to use.
 *
 * User identifiers can be configured via any of:
 *   • Suffixed env vars `PORKBUN_API_KEY_<USER>` / `PORKBUN_SECRET_API_KEY_<USER>`
 *   • A `PORKBUN_ACCOUNTS` JSON array of `{user, PORKBUN_API_KEY, PORKBUN_SECRET_API_KEY}`
 *
 * Omit `user` to use the default account
 * (`PORKBUN_API_KEY` / `PORKBUN_SECRET_API_KEY`, or the `PORKBUN_ACCOUNTS`
 * entry with `user: "default"`).
 */
export const userField = z
  .string()
  .optional()
  .describe(
    "Optional user identifier to select which Porkbun account credentials to " +
      "use. Configure users via suffixed env vars (PORKBUN_API_KEY_<USER> / " +
      "PORKBUN_SECRET_API_KEY_<USER>) or a PORKBUN_ACCOUNTS JSON array. " +
      "Matching is case-insensitive. Omit to use the default account."
  );
