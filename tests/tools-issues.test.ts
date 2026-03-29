/**
 * Issue 工具模块测试
 * 使用 mock LinearClient 测试工具逻辑
 */

import { describe, it, expect, vi } from "vitest";
import { createHandlers } from "../src/tools/issues.js";
import type { LinearClient } from "@linear/sdk";

/** 创建模拟的 LinearClient */
function createMockClient(overrides: Record<string, unknown> = {}): LinearClient {
  return {
    issues: vi.fn().mockResolvedValue({
      nodes: [
        {
          id: "issue-1",
          identifier: "ENG-1",
          title: "测试 Issue",
          description: "这是描述",
          priority: 2,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          state: Promise.resolve({ id: "state-1", name: "Todo", type: "unstarted" }),
          team: Promise.resolve({ id: "team-1", key: "ENG", name: "Engineering" }),
          assignee: Promise.resolve({ id: "user-1", name: "张三" }),
        },
      ],
    }),
    createIssue: vi.fn().mockResolvedValue({
      issue: Promise.resolve({
        id: "issue-new",
        identifier: "ENG-2",
        title: "新 Issue",
        url: "https://linear.app/team/issue/ENG-2",
      }),
    }),
    issue: vi.fn().mockResolvedValue({
      id: "issue-1",
      identifier: "ENG-1",
      title: "测试 Issue",
      description: "详细描述",
      priority: 2,
      priorityLabel: "High",
      url: "https://linear.app/team/issue/ENG-1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
      state: Promise.resolve({ id: "state-1", name: "Todo", type: "unstarted" }),
      team: Promise.resolve({ id: "team-1", key: "ENG", name: "Engineering" }),
      assignee: Promise.resolve({ id: "user-1", name: "张三", email: "zhangsan@test.com" }),
      labels: vi.fn().mockResolvedValue({
        nodes: [{ id: "label-1", name: "Bug", color: "#ff0000" }],
      }),
    }),
    updateIssue: vi.fn().mockResolvedValue({
      issue: Promise.resolve({
        id: "issue-1",
        identifier: "ENG-1",
        title: "更新后的标题",
      }),
    }),
    searchIssues: vi.fn().mockResolvedValue({
      nodes: [
        {
          id: "issue-1",
          identifier: "ENG-1",
          title: "搜索结果",
          description: "描述",
          priority: 1,
          url: "https://linear.app/team/issue/ENG-1",
          state: Promise.resolve({ id: "state-1", name: "Done" }),
          team: Promise.resolve({ id: "team-1", key: "ENG", name: "Engineering" }),
        },
      ],
    }),
    createComment: vi.fn().mockResolvedValue({
      comment: Promise.resolve({
        id: "comment-1",
        body: "测试评论",
        createdAt: new Date("2024-01-01"),
      }),
    }),
    ...overrides,
  } as unknown as LinearClient;
}

describe("issues tools", () => {
  it("应该注册 6 个工具", () => {
    const tools = createHandlers(createMockClient());
    expect(tools).toHaveLength(6);
    expect(tools.map((t) => t.name)).toEqual([
      "list_issues",
      "create_issue",
      "get_issue",
      "update_issue",
      "search_issues",
      "add_comment",
    ]);
  });

  describe("list_issues", () => {
    it("应该成功列出 Issue", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listIssues = tools.find((t) => t.name === "list_issues")!;

      const result = await listIssues.handler({});
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect((result.data as unknown[])[0]).toHaveProperty("id", "issue-1");
      expect(client.issues).toHaveBeenCalledWith({ first: 20, filter: undefined });
    });

    it("应该支持按团队过滤", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listIssues = tools.find((t) => t.name === "list_issues")!;

      await listIssues.handler({ team: "ENG" });
      expect(client.issues).toHaveBeenCalledWith({
        first: 20,
        filter: { team: { key: { eq: "ENG" } } },
      });
    });

    it("应该支持按状态过滤", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const listIssues = tools.find((t) => t.name === "list_issues")!;

      await listIssues.handler({ state: "in_progress" });
      expect(client.issues).toHaveBeenCalledWith({
        first: 20,
        filter: { state: { type: { eq: "started" } } },
      });
    });
  });

  describe("create_issue", () => {
    it("应该成功创建 Issue", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const createIssue = tools.find((t) => t.name === "create_issue")!;

      const result = await createIssue.handler({
        title: "新任务",
        team_id: "team-1",
        description: "任务描述",
        priority: 2,
      });

      expect(result.success).toBe(true);
      expect(client.createIssue).toHaveBeenCalledWith({
        title: "新任务",
        teamId: "team-1",
        description: "任务描述",
        priority: 2,
      });
    });
  });

  describe("get_issue", () => {
    it("应该获取 Issue 详情", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const getIssue = tools.find((t) => t.name === "get_issue")!;

      const result = await getIssue.handler({ issue_id: "issue-1" });
      expect(result.success).toBe(true);

      const data = result.data as Record<string, unknown>;
      expect(data.id).toBe("issue-1");
      expect(data.title).toBe("测试 Issue");
      expect(client.issue).toHaveBeenCalledWith("issue-1");
    });
  });

  describe("update_issue", () => {
    it("应该成功更新 Issue", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const updateIssue = tools.find((t) => t.name === "update_issue")!;

      const result = await updateIssue.handler({
        issue_id: "issue-1",
        title: "更新后的标题",
      });

      expect(result.success).toBe(true);
      expect(client.updateIssue).toHaveBeenCalledWith("issue-1", { title: "更新后的标题" });
    });

    it("没有更新字段应返回错误", async () => {
      const tools = createHandlers(createMockClient());
      const updateIssue = tools.find((t) => t.name === "update_issue")!;

      const result = await updateIssue.handler({ issue_id: "issue-1" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("至少需要提供一个更新字段");
    });
  });

  describe("search_issues", () => {
    it("应该搜索 Issue", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const searchIssues = tools.find((t) => t.name === "search_issues")!;

      const result = await searchIssues.handler({ query: "bug" });
      expect(result.success).toBe(true);
      expect(client.searchIssues).toHaveBeenCalledWith("bug");
    });
  });

  describe("add_comment", () => {
    it("应该成功添加评论", async () => {
      const client = createMockClient();
      const tools = createHandlers(client);
      const addComment = tools.find((t) => t.name === "add_comment")!;

      const result = await addComment.handler({
        issue_id: "issue-1",
        body: "这是一条评论",
      });

      expect(result.success).toBe(true);
      expect(client.createComment).toHaveBeenCalledWith({
        issueId: "issue-1",
        body: "这是一条评论",
      });
    });
  });
});
