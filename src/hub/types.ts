/**
 * Hub 标准类型定义
 * 定义 Tool、Manifest、Event 等核心类型
 */

/** 工具参数定义 */
export interface ToolParam {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: "string" | "number" | "boolean";
  /** 参数描述 */
  description: string;
  /** 是否必填 */
  required: boolean;
  /** 枚举值（可选） */
  enum?: string[];
}

/** 工具定义 */
export interface Tool {
  /** 工具唯一标识 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 参数列表 */
  params: ToolParam[];
  /** 处理函数 */
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

/** 工具执行结果 */
export interface ToolResult {
  /** 是否成功 */
  success: boolean;
  /** 返回数据 */
  data?: unknown;
  /** 错误信息 */
  error?: string;
}

/** 应用 Manifest */
export interface Manifest {
  /** 应用标识 */
  slug: string;
  /** 应用名称 */
  name: string;
  /** 应用图标 */
  icon: string;
  /** 监听的事件类型 */
  events: string[];
  /** 工具列表 */
  tools: ToolInfo[];
}

/** 工具信息（不含 handler） */
export interface ToolInfo {
  name: string;
  description: string;
  params: ToolParam[];
}

/** Hub 推送的事件 */
export interface HubEvent {
  /** 事件类型 */
  type: string;
  /** 用户 ID */
  userId: string;
  /** 事件负载 */
  payload: Record<string, unknown>;
}

/** 工具调用请求 */
export interface ToolCallRequest {
  /** 工具名称 */
  tool: string;
  /** 调用参数 */
  args: Record<string, unknown>;
  /** 用户 ID */
  userId?: string;
}

/** 工具调用响应 */
export interface ToolCallResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** 工具模块接口 */
export interface ToolModule {
  tools: Tool[];
}
