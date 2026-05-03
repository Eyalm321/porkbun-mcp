import { z } from "zod";

/**
 * Optional `user` field added to every authenticated tool. Selects which
 * Porkbun credential pair to use (`PORKBUN_API_KEY_<USER>` /
 * `PORKBUN_SECRET_API_KEY_<USER>`, uppercased). Omit to use the default
 * `PORKBUN_API_KEY` / `PORKBUN_SECRET_API_KEY`.
 */
export const userField = z
  .string()
  .optional()
  .describe(
    "Optional user identifier to select which Porkbun account credentials to use. " +
      "Resolves env vars PORKBUN_API_KEY_<USER> and PORKBUN_SECRET_API_KEY_<USER> " +
      "(user is uppercased, non-alphanumerics become underscores). Omit to use the " +
      "default PORKBUN_API_KEY / PORKBUN_SECRET_API_KEY."
  );
