import { z } from "zod";

/**
 * Optional `user` field added to every authenticated tool. Selects which
 * Porkbun account credentials to use from the PORKBUN_ACCOUNTS JSON array.
 * Omit to use the default account (PORKBUN_API_KEY / PORKBUN_SECRET_API_KEY,
 * or the entry in PORKBUN_ACCOUNTS with user "default").
 */
export const userField = z
  .string()
  .optional()
  .describe(
    "Optional user identifier to select which Porkbun account credentials to " +
      "use. Matches the `user` field of an entry in the PORKBUN_ACCOUNTS JSON " +
      "array (case-insensitive). Omit to use the default account (top-level " +
      "PORKBUN_API_KEY / PORKBUN_SECRET_API_KEY, or PORKBUN_ACCOUNTS entry with " +
      'user "default").'
  );
