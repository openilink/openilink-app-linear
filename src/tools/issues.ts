/**
 * Issue 相关工具
 * 提供 Issue 的增删改查和搜索功能
 */

import type { LinearClient } from "@linear/sdk";
import type { LinearDocument } from "@linear/sdk";
import type { Tool, ToolResult } from "../hub/types.js";

/** 状态名称到 Linear 状态类型的映射 */
const STATE_TYPE_MAP: Record<string, string> = {
  backlog: "backlog",
  todo: "unstarted",
  in_progress: "started",
  done: "completed",
};

/** 创建 Issue 相关工具 */
export function createHandlers(linearClient: LinearClient): Tool[] {
  return [
    {
      name: "list_issues",
      description: "列出 Issue",
      params: [
        { name: "team", type: "string", description: "团队 Key（如 ENG）", required: false },
        {
          name: "state",
          type: "string",
          description: "状态过滤",
          required: false,
          enum: ["backlog", "todo", "in_progress", "done"],
        },
        { name: "count", type: "number", description: "返回数量（默认 20）", required: false },
      ],
      handler: async (args): Promise<ToolResult> => {
        try {
          const count = (args.count as number) || 20;
          const filter: Record<string, unknown> = {};

          // 按团队 key 过滤
          if (args.team) {
            filter.team = { key: { eq: args.team as string } };
          }

          // 按状态类型过滤
          if (args.state) {
            const stateType = STATE_TYPE_MAP[args.state as string];
            if (stateType) {
              filter.state = { type: { eq: stateType } };
            }
          }

          const issues = await linearClient.issues({
            first: count,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
          });

          const data = await Promise.all(
            issues.nodes.map(async (issue) => {
              const state = await issue.state;
              const team = await issue.team;
              const assignee = await issue.assignee;
              return {
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
                description: issue.description?.slice(0, 200),
                priority: issue.priority,
                state: state ? { id: state.id, name: state.name, type: state.type } : null,
                team: team ? { id: team.id, key: team.key, name: team.name } : null,
                assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
              };
            })
          );

          return { success: true, data };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },

    {
      name: "create_issue",
      description: "创建 Issue",
      params: [
        { name: "title", type: "string", description: "标题", required: true },
        { name: "team_id", type: "string", description: "团队 ID", required: true },
        { name: "description", type: "string", description: "描述（Markdown）", required: false },
        { name: "priority", type: "number", description: "优先级（0=无, 1=紧急, 2=高, 3=中, 4=低）", required: false },
        { name: "assignee_id", type: "string", description: "指派人 ID", required: false },
      ],
      handler: async (args): Promise<ToolResult> => {
        try {
          const input: LinearDocument.IssueCreateInput = {
            teamId: args.team_id as string,
            title: args.title as string,
          };

          if (args.description) input.description = args.description as string;
          if (args.priority !== undefined) input.priority = args.priority as number;
          if (args.assignee_id) input.assigneeId = args.assignee_id as string;

          const result = await linearClient.createIssue(input);
          const issue = await result.issue;

          return {
            success: true,
            data: issue
              ? {
                  id: issue.id,
                  identifier: issue.identifier,
                  title: issue.title,
                  url: issue.url,
                }
              : null,
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },

    {
      name: "get_issue",
      description: "获取 Issue 详情",
      params: [{ name: "issue_id", type: "string", description: "Issue ID", required: true }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const issue = await linearClient.issue(args.issue_id as string);
          const state = await issue.state;
          const team = await issue.team;
          const assignee = await issue.assignee;
          const labels = await issue.labels();

          return {
            success: true,
            data: {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              description: issue.description,
              priority: issue.priority,
              priorityLabel: issue.priorityLabel,
              url: issue.url,
              state: state ? { id: state.id, name: state.name, type: state.type } : null,
              team: team ? { id: team.id, key: team.key, name: team.name } : null,
              assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
              labels: labels.nodes.map((l) => ({ id: l.id, name: l.name, color: l.color })),
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt,
            },
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },

    {
      name: "update_issue",
      description: "更新 Issue",
      params: [
        { name: "issue_id", type: "string", description: "Issue ID", required: true },
        { name: "title", type: "string", description: "新标题", required: false },
        { name: "description", type: "string", description: "新描述", required: false },
        { name: "state_id", type: "string", description: "新状态 ID", required: false },
        { name: "priority", type: "number", description: "新优先级（0-4）", required: false },
      ],
      handler: async (args): Promise<ToolResult> => {
        try {
          const input: Record<string, unknown> = {};
          if (args.title) input.title = args.title as string;
          if (args.description) input.description = args.description as string;
          if (args.state_id) input.stateId = args.state_id as string;
          if (args.priority !== undefined) input.priority = args.priority as number;

          if (Object.keys(input).length === 0) {
            return { success: false, error: "至少需要提供一个更新字段" };
          }

          const result = await linearClient.updateIssue(args.issue_id as string, input);
          const issue = await result.issue;

          return {
            success: true,
            data: issue
              ? {
                  id: issue.id,
                  identifier: issue.identifier,
                  title: issue.title,
                }
              : null,
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },

    {
      name: "search_issues",
      description: "搜索 Issue",
      params: [{ name: "query", type: "string", description: "搜索关键词", required: true }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const result = await linearClient.searchIssues(args.query as string);

          const data = await Promise.all(
            result.nodes.map(async (node) => {
              // searchIssues 返回的是 IssueSearchResult
              const state = await node.state;
              const team = await node.team;
              return {
                id: node.id,
                identifier: node.identifier,
                title: node.title,
                description: node.description?.slice(0, 200),
                priority: node.priority,
                state: state ? { id: state.id, name: state.name } : null,
                team: team ? { id: team.id, key: team.key, name: team.name } : null,
                url: node.url,
              };
            })
          );

          return { success: true, data };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },

    {
      name: "add_comment",
      description: "为 Issue 添加评论",
      params: [
        { name: "issue_id", type: "string", description: "Issue ID", required: true },
        { name: "body", type: "string", description: "评论内容（Markdown）", required: true },
      ],
      handler: async (args): Promise<ToolResult> => {
        try {
          const result = await linearClient.createComment({
            issueId: args.issue_id as string,
            body: args.body as string,
          });
          const comment = await result.comment;

          return {
            success: true,
            data: comment
              ? {
                  id: comment.id,
                  body: comment.body,
                  createdAt: comment.createdAt,
                }
              : null,
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },
  ];
}
