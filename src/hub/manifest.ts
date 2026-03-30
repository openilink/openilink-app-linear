/**
 * 应用清单定义
 */

import type { Tool, ToolDefinition } from "./types.js";

/** 应用清单结构 */
export interface AppManifest {
  /** 应用唯一标识（URL 友好） */
  slug: string;
  /** 应用显示名称 */
  name: string;
  /** 应用图标（emoji 或 URL） */
  icon: string;
  /** 应用描述 */
  description: string;
  /** 订阅的事件类型列表 */
  events: string[];
  /** 配置表单 JSON Schema */
  config_schema?: Record<string, unknown>;
  /** 安装引导说明（Markdown） */
  guide?: string;
}

/** Linear 应用清单 */
export const manifest: AppManifest = {
  slug: "linear",
  name: "Linear",
  icon: "🔮",
  description: "通过微信管理 Linear Issue、项目、团队和迭代周期",
  events: ["command"],
  config_schema: {
    type: "object",
    properties: {
      linear_api_key: { type: "string", title: "Linear API Key", description: "在 Linear Settings → API → Personal API keys 创建" },
    },
    required: ["linear_api_key"],
  },
  guide: "## Linear 安装指南\n### 第 1 步\n访问 Linear → Settings → API\n### 第 2 步\n创建 Personal API Key\n### 第 3 步\n填写上方配置并安装\n\n安装后可通过 /settings 页面随时修改配置。",
};

/**
 * 将原始 Tool 列表转换为 Hub 协议所需的 ToolDefinition 列表
 * 去掉 handler，仅保留名称、描述、参数元信息
 */
export function toToolDefinitions(tools: Tool[]): ToolDefinition[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    command: t.name,
    parameters: buildJsonSchema(t),
  }));
}

/** 将 Tool.params 转换为 JSON Schema 格式 */
function buildJsonSchema(tool: Tool): Record<string, unknown> | undefined {
  if (!tool.params || tool.params.length === 0) return undefined;

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const p of tool.params) {
    const prop: Record<string, unknown> = {
      type: p.type,
      description: p.description,
    };
    if (p.enum) {
      prop.enum = p.enum;
    }
    properties[p.name] = prop;
    if (p.required) {
      required.push(p.name);
    }
  }

  const schema: Record<string, unknown> = {
    type: "object",
    properties,
  };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}
