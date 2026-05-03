import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../client.js", () => ({
  porkbunRequest: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  porkbunRequestNoAuth: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
  listConfiguredUsers: vi.fn().mockReturnValue([]),
}));

import { porkbunRequest, porkbunRequestNoAuth, listConfiguredUsers } from "../../client.js";
import { utilityTools } from "../../tools/utility.js";

const mockRequest = vi.mocked(porkbunRequest);
const mockNoAuth = vi.mocked(porkbunRequestNoAuth);
const mockListUsers = vi.mocked(listConfiguredUsers);

describe("utilityTools", () => {
  beforeEach(() => {
    mockRequest.mockClear();
    mockNoAuth.mockClear();
    mockListUsers.mockClear();
  });

  it("exports 3 tools", () => {
    expect(utilityTools).toHaveLength(3);
  });

  describe("porkbun_ping", () => {
    const tool = utilityTools.find((t) => t.name === "porkbun_ping")!;

    it("exists with correct name", () => {
      expect(tool).toBeDefined();
    });

    it("calls porkbunRequest with /ping", async () => {
      await tool.handler({} as any);
      expect(mockRequest).toHaveBeenCalledWith("/ping", undefined, undefined);
    });

    it("forwards user param", async () => {
      await tool.handler({ user: "alice" } as any);
      expect(mockRequest).toHaveBeenCalledWith("/ping", undefined, "alice");
    });
  });

  describe("porkbun_get_ip", () => {
    const tool = utilityTools.find((t) => t.name === "porkbun_get_ip")!;

    it("exists with correct name", () => {
      expect(tool).toBeDefined();
    });

    it("calls porkbunRequestNoAuth with /ip", async () => {
      await tool.handler({} as any);
      expect(mockNoAuth).toHaveBeenCalledWith("/ip");
    });
  });

  describe("porkbun_list_users", () => {
    const tool = utilityTools.find((t) => t.name === "porkbun_list_users")!;

    it("exists with correct name", () => {
      expect(tool).toBeDefined();
    });

    it("returns the list of configured users", async () => {
      mockListUsers.mockReturnValueOnce(["default", "alice", "bob"]);
      const result = await tool.handler({} as any);
      expect(result).toEqual({ users: ["default", "alice", "bob"] });
    });

    it("returns empty list when none configured", async () => {
      mockListUsers.mockReturnValueOnce([]);
      const result = await tool.handler({} as any);
      expect(result).toEqual({ users: [] });
    });
  });
});
