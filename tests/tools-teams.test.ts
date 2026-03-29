/**
 * Team 工具模块测试
 */

import { describe, it, expect, vi } from "vitest";
import { createHandlers } from "../src/tools/teams.js";
import type { LinearClient } from "@linear/sdk";

function createMockClient(): LinearClient {
  return {
    teams: vi.fn().mockResolvedValue({
      nodes: [
        {
          id: "team-1",
          key: "ENG",
          name: "Engineering",
          description: "工程团队",
          members: vi.fn().mockResolvedValue({
            nodes: [
              { id: "user-1", name: "张三" },
              { id: "user-2", name: "李四" },
            ],
          }),
        },
      ],
    }),
    team: vi.fn().mockResolvedValue({
      id: "team-1",
      key: "ENG",
      name: "Engineering",
      description: "工程团队",
      members: vi.fn().mockResolvedValue({
        nodes: [
          { id: "user-1", name: "张三", email: "zhangsan@test.com" },
          { id: "user-2", name: "李四", email: "lisi@test.com" },
        ],
      }),
      states: vi.fn().mockResolvedValue({
        nodes: [
          { id: "state-1", name: "Backlog", type: "backlog", color: "#bbb" },
          { id: "state-2", name: "Todo", type: "unstarted", color: "#ccc" },
        ],
      }),
      labels: vi.fn().mockResolvedValue({
        nodes: [{ id: "label-1", name: "Bug", color: "#ff0000" }],
      }),
    }),
  } as unknown as LinearClient;
}

describe("teams tools", () => {
  it("应该注册 2 个工具", () => {
    const tools = createHandlers(createMockClient());
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(["list_teams", "get_team"]);
  });

  describe("list_teams", () => {
    it("应该列出团队", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listTeams = tools.find((t) => t.name === "list_teams")!;

      const result = await listTeams.handler({});
      expect(result.success).toBe(true);

      const data = result.data as Record<string, unknown>[];
      expect(data).toHaveLength(1);
      expect(data[0].key).toBe("ENG");
      expect(data[0].memberCount).toBe(2);
    });
  });

  describe("get_team", () => {
    it("应该获取团队详情", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const getTeam = tools.find((t) => t.name === "get_team")!;

      const result = await getTeam.handler({ team_id: "team-1" });
      expect(result.success).toBe(true);

      const data = result.data as Record<string, unknown>;
      expect(data.name).toBe("Engineering");
      expect((data.members as unknown[]).length).toBe(2);
      expect((data.states as unknown[]).length).toBe(2);
      expect((data.labels as unknown[]).length).toBe(1);
      expect(client.team).toHaveBeenCalledWith("team-1");
    });
  });
});
