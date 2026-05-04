import { z } from "zod";

/**
 * Optional `user` field added to every authenticated tool. Selects which
 * account from the file referenced by `PORKBUN_ACCOUNTS_FILE` to use. Omit
 * to use the default account from `PORKBUN_API_KEY` / `PORKBUN_SECRET_API_KEY`
 * (or a `user: "default"` entry in the accounts file).
 */
export const userField = z
  .string()
  .optional()
  .describe(
    "Optional user identifier to select which Porkbun account to use from the " +
      "file referenced by PORKBUN_ACCOUNTS_FILE. Matching is case-insensitive. " +
      "Omit to use the default account (PORKBUN_API_KEY / PORKBUN_SECRET_API_KEY)."
  );
