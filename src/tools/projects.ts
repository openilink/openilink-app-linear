/**
 * Project 相关工具
 * 提供项目的查询和创建功能
 */

import type { LinearClient } from "@linear/sdk";
import type { LinearDocument } from "@linear/sdk";
import type { Tool, ToolResult } from "../hub/types.js";

/** 创建 Project 相关工具 */
export function createHandlers(linearClient: LinearClient): Tool[] {
  return [
    {
      name: "list_projects",
      description: "列出项目",
      params: [{ name: "count", type: "number", description: "返回数量（默认 20）", required: false }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const count = (args.count as number) || 20;
          const projects = await linearClient.projects({ first: count });

          const data = await Promise.all(
            projects.nodes.map(async (project) => {
              const lead = await project.lead;
              const teams = await project.teams();
              return {
                id: project.id,
                name: project.name,
                description: project.description?.slice(0, 200),
                state: project.state,
                progress: project.progress,
                startDate: project.startDate,
                targetDate: project.targetDate,
                lead: lead ? { id: lead.id, name: lead.name } : null,
                teams: teams.nodes.map((t) => ({ id: t.id, key: t.key, name: t.name })),
                url: project.url,
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
      name: "get_project",
      description: "获取项目详情",
      params: [{ name: "project_id", type: "string", description: "项目 ID", required: true }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const project = await linearClient.project(args.project_id as string);
          const lead = await project.lead;
          const members = await project.members();
          const teams = await project.teams();

          return {
            success: true,
            data: {
              id: project.id,
              name: project.name,
              description: project.description,
              state: project.state,
              progress: project.progress,
              startDate: project.startDate,
              targetDate: project.targetDate,
              url: project.url,
              lead: lead ? { id: lead.id, name: lead.name, email: lead.email } : null,
              members: members.nodes.map((m) => ({ id: m.id, name: m.name })),
              teams: teams.nodes.map((t) => ({ id: t.id, key: t.key, name: t.name })),
            },
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },

    {
      name: "create_project",
      description: "创建项目",
      params: [
        { name: "name", type: "string", description: "项目名称", required: true },
        { name: "description", type: "string", description: "项目描述", required: false },
        { name: "team_ids", type: "string", description: "关联团队 ID（逗号分隔）", required: false },
      ],
      handler: async (args): Promise<ToolResult> => {
        try {
          // 解析逗号分隔的团队 ID
          const teamIds: string[] = args.team_ids
            ? (args.team_ids as string).split(",").map((id) => id.trim()).filter(Boolean)
            : [];

          const input: LinearDocument.ProjectCreateInput = {
            name: args.name as string,
            teamIds,
          };

          if (args.description) input.description = args.description as string;

          const result = await linearClient.createProject(input);
          const project = await result.project;

          return {
            success: true,
            data: project
              ? {
                  id: project.id,
                  name: project.name,
                  url: project.url,
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
