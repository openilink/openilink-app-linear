/**
 * Project 工具模块测试
 */

import { describe, it, expect, vi } from "vitest";
import { createHandlers } from "../src/tools/projects.js";
import type { LinearClient } from "@linear/sdk";

function createMockClient(): LinearClient {
  return {
    projects: vi.fn().mockResolvedValue({
      nodes: [
        {
          id: "proj-1",
          name: "测试项目",
          description: "项目描述",
          state: "started",
          progress: 0.5,
          startDate: "2024-01-01",
          targetDate: "2024-06-30",
          url: "https://linear.app/team/project/proj-1",
          lead: Promise.resolve({ id: "user-1", name: "李四" }),
          teams: vi.fn().mockResolvedValue({
            nodes: [{ id: "team-1", key: "ENG", name: "Engineering" }],
          }),
        },
      ],
    }),
    project: vi.fn().mockResolvedValue({
      id: "proj-1",
      name: "测试项目",
      description: "详细描述",
      state: "started",
      progress: 0.5,
      startDate: "2024-01-01",
      targetDate: "2024-06-30",
      url: "https://linear.app/team/project/proj-1",
      lead: Promise.resolve({ id: "user-1", name: "李四", email: "lisi@test.com" }),
      members: vi.fn().mockResolvedValue({
        nodes: [{ id: "user-1", name: "李四" }],
      }),
      teams: vi.fn().mockResolvedValue({
        nodes: [{ id: "team-1", key: "ENG", name: "Engineering" }],
      }),
    }),
    createProject: vi.fn().mockResolvedValue({
      project: Promise.resolve({
        id: "proj-new",
        name: "新项目",
        url: "https://linear.app/team/project/proj-new",
      }),
    }),
  } as unknown as LinearClient;
}

describe("projects tools", () => {
  it("应该注册 3 个工具", () => {
    const tools = createHandlers(createMockClient());
    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toEqual(["list_projects", "get_project", "create_project"]);
  });

  describe("list_projects", () => {
    it("应该列出项目", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listProjects = tools.find((t) => t.name === "list_projects")!;

      const result = await listProjects.handler({});
      expect(result.success).toBe(true);

      const data = result.data as unknown[];
      expect(data).toHaveLength(1);
      expect((data[0] as Record<string, unknown>).name).toBe("测试项目");
    });
  });

  describe("get_project", () => {
    it("应该获取项目详情", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const getProject = tools.find((t) => t.name === "get_project")!;

      const result = await getProject.handler({ project_id: "proj-1" });
      expect(result.success).toBe(true);

      const data = result.data as Record<string, unknown>;
      expect(data.name).toBe("测试项目");
      expect(client.project).toHaveBeenCalledWith("proj-1");
    });
  });

  describe("create_project", () => {
    it("应该创建项目", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const createProject = tools.find((t) => t.name === "create_project")!;

      const result = await createProject.handler({
        name: "新项目",
        description: "项目描述",
        team_ids: "team-1,team-2",
      });

      expect(result.success).toBe(true);
      expect(client.createProject).toHaveBeenCalledWith({
        name: "新项目",
        description: "项目描述",
        teamIds: ["team-1", "team-2"],
      });
    });

    it("应该支持不传 team_ids", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const createProject = tools.find((t) => t.name === "create_project")!;

      await createProject.handler({ name: "简单项目" });
      expect(client.createProject).toHaveBeenCalledWith({ name: "简单项目", teamIds: [] });
    });
  });
});
