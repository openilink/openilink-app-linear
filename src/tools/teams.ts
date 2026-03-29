/**
 * Team 相关工具
 * 提供团队信息查询功能
 */

import type { LinearClient } from "@linear/sdk";
import type { Tool, ToolResult } from "../hub/types.js";

/** 创建 Team 相关工具 */
export function createHandlers(linearClient: LinearClient): Tool[] {
  return [
    {
      name: "list_teams",
      description: "列出团队",
      params: [],
      handler: async (): Promise<ToolResult> => {
        try {
          const teams = await linearClient.teams();

          const data = await Promise.all(
            teams.nodes.map(async (team) => {
              const members = await team.members();
              return {
                id: team.id,
                key: team.key,
                name: team.name,
                description: team.description,
                memberCount: members.nodes.length,
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
      name: "get_team",
      description: "获取团队详情",
      params: [{ name: "team_id", type: "string", description: "团队 ID", required: true }],
      handler: async (args): Promise<ToolResult> => {
        try {
          const team = await linearClient.team(args.team_id as string);
          const members = await team.members();
          const states = await team.states();
          const labels = await team.labels();

          return {
            success: true,
            data: {
              id: team.id,
              key: team.key,
              name: team.name,
              description: team.description,
              members: members.nodes.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
              })),
              states: states.nodes.map((s) => ({
                id: s.id,
                name: s.name,
                type: s.type,
                color: s.color,
              })),
              labels: labels.nodes.map((l) => ({
                id: l.id,
                name: l.name,
                color: l.color,
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
