/**
 * Cycle 工具模块测试
 */

import { describe, it, expect, vi } from "vitest";
import { createHandlers } from "../src/tools/cycles.js";
import type { LinearClient } from "@linear/sdk";

function createMockClient(cycleNodes: unknown[] = []): LinearClient {
  const defaultNodes = [
    {
      id: "cycle-1",
      number: 1,
      name: "Sprint 1",
      startsAt: new Date("2024-01-01"),
      endsAt: new Date("2024-01-14"),
      progress: 0.6,
      team: Promise.resolve({ id: "team-1", key: "ENG", name: "Engineering" }),
      issues: vi.fn().mockResolvedValue({
        nodes: [
          { id: "issue-1", identifier: "ENG-1", title: "任务一", priority: 1 },
          { id: "issue-2", identifier: "ENG-2", title: "任务二", priority: 2 },
        ],
      }),
    },
  ];

  return {
    cycles: vi.fn().mockResolvedValue({
      nodes: cycleNodes.length > 0 ? cycleNodes : defaultNodes,
    }),
  } as unknown as LinearClient;
}

describe("cycles tools", () => {
  it("应该注册 2 个工具", () => {
    const tools = createHandlers(createMockClient());
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(["list_cycles", "get_current_cycle"]);
  });

  describe("list_cycles", () => {
    it("应该列出所有 Cycle", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listCycles = tools.find((t) => t.name === "list_cycles")!;

      const result = await listCycles.handler({});
      expect(result.success).toBe(true);

      const data = result.data as Record<string, unknown>[];
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Sprint 1");
    });

    it("应该支持按团队过滤", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listCycles = tools.find((t) => t.name === "list_cycles")!;

      await listCycles.handler({ team_id: "team-1" });
      expect(client.cycles).toHaveBeenCalledWith({
        first: 20,
        filter: { team: { id: { eq: "team-1" } } },
      });
    });
  });

  describe("get_current_cycle", () => {
    it("有活跃 Cycle 应返回数据", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const getCurrentCycle = tools.find((t) => t.name === "get_current_cycle")!;

      const result = await getCurrentCycle.handler({ team_id: "team-1" });
      expect(result.success).toBe(true);

      const data = result.data as Record<string, unknown>;
      expect(data.name).toBe("Sprint 1");
      expect(data.issueCount).toBe(2);
    });

    it("无活跃 Cycle 应返回 null", async () => {
      const emptyClient = {
        cycles: vi.fn().mockResolvedValue({ nodes: [] }),
      } as unknown as LinearClient;

      const tools = createHandlers(emptyClient);
      const getCurrentCycle = tools.find((t) => t.name === "get_current_cycle")!;

      const result = await getCurrentCycle.handler({ team_id: "team-1" });
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});
