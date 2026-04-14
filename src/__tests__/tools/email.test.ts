import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
}));

import { porkbunRequest } from "../../client.js";
import { emailTools } from "../../tools/email.js";

const mockRequest = vi.mocked(porkbunRequest);

describe("emailTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("exports 1 tool", () => {
    expect(emailTools).toHaveLength(1);
  });

  describe("porkbun_email_set_password", () => {
    const tool = emailTools.find((t) => t.name === "porkbun_email_set_password")!;

    it("passes email and password", async () => {
      await tool.handler({ emailAddress: "user@example.com", password: "NewPass123!" });
      expect(mockRequest).toHaveBeenCalledWith("/email/setPassword", {
        emailAddress: "user@example.com",
        password: "NewPass123!",
      });
    });
  });
});
