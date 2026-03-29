/**
 * Cycle 相关工具
 * 提供 Cycle（迭代/冲刺）查询功能
 */

import type { LinearClient } from "@linear/sdk";
import type { Tool, ToolResult } from "../hub/types.js";

/** 创建 Cycle 相关工具 */
export function createHandlers(linearClient: LinearClient): Tool[] {
  return [
    {
      name: "list_cycles",
      description: "列出 Cycle",
      params: [{ name: "team_id", type: "string", description: "团队 ID（可选过滤）", required: false }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const filter: Record<string, unknown> = {};
          if (args.team_id) {
            filter.team = { id: { eq: args.team_id as string } };
          }

          const cycles = await linearClient.cycles({
            first: 20,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
          });

          const data = await Promise.all(
            cycles.nodes.map(async (cycle) => {
              const team = await cycle.team;
              return {
                id: cycle.id,
                number: cycle.number,
                name: cycle.name,
                startsAt: cycle.startsAt,
                endsAt: cycle.endsAt,
                progress: cycle.progress,
                team: team ? { id: team.id, key: team.key, name: team.name } : null,
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
      name: "get_current_cycle",
      description: "获取当前活跃 Cycle",
      params: [{ name: "team_id", type: "string", description: "团队 ID", required: true }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const now = new Date().toISOString();

          const cycles = await linearClient.cycles({
            first: 1,
            filter: {
              team: { id: { eq: args.team_id as string } },
              startsAt: { lte: now },
              endsAt: { gte: now },
            },
          });

          if (cycles.nodes.length === 0) {
            return { success: true, data: null };
          }

          const cycle = cycles.nodes[0];
          const team = await cycle.team;
          const issues = await cycle.issues();

          return {
            success: true,
            data: {
              id: cycle.id,
              number: cycle.number,
              name: cycle.name,
              startsAt: cycle.startsAt,
              endsAt: cycle.endsAt,
              progress: cycle.progress,
              team: team ? { id: team.id, key: team.key, name: team.name } : null,
              issueCount: issues.nodes.length,
              issues: issues.nodes.slice(0, 10).map((i) => ({
                id: i.id,
                identifier: i.identifier,
                title: i.title,
                priority: i.priority,
              })),
            },
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },
  ];
}
