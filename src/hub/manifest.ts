/**
 * 应用 Manifest 定义
 */

import type { Manifest, Tool, ToolInfo } from "./types.js";

/** 从工具列表生成 ToolInfo（去掉 handler） */
function toToolInfo(tools: Tool[]): ToolInfo[] {
  return tools.map(({ name, description, params }) => ({
    name,
    description,
    params,
  }));
}

/** 创建应用 Manifest */
export function createManifest(tools: Tool[]): Manifest {
  return {
    slug: "linear",
    name: "Linear",
    icon: "🔮",
    events: ["command"],
    tools: toToolInfo(tools),
  };
}
