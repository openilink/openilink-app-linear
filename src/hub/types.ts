/**
 * Hub 协议相关类型定义
 */

/** Hub 推送的事件结构 */
export interface HubEvent {
  /** 协议版本 */
  v: string;
  /** 事件类型：event / url_verification */
  type: "event" | "url_verification";
  /** 链路追踪 ID */
  trace_id: string;
  /** 握手挑战值（type=url_verification 时存在） */
  challenge?: string;
  /** 安装实例 ID */
  installation_id: string;
  /** 关联的 Bot 信息 */
  bot: {
    id: string;
  };
  /** 业务事件载荷（type=event 时存在） */
  event?: {
    /** 事件子类型：message / command 等 */
    type: string;
    /** 事件唯一 ID */
    id: string;
    /** 事件发生时间戳 */
    timestamp: string;
    /** 事件数据 */
    data: Record<string, unknown>;
  };
}

/** 安装实例记录 */
export interface Installation {
  /** 安装实例 ID */
  id: string;
  /** Hub 服务地址 */
  hubUrl: string;
  /** 应用 ID */
  appId: string;
  /** Bot ID */
  botId: string;
  /** 应用访问令牌 */
  appToken: string;
  /** Webhook 签名密钥 */
  webhookSecret: string;
  /** 创建时间 */
  createdAt?: string;
}

/** AI Tool 定义 */
export interface ToolDefinition {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 触发指令 */
  command: string;
  /** JSON Schema 参数定义 */
  parameters?: Record<string, unknown>;
}

/** AI Tool 执行上下文 */
export interface ToolContext {
  /** 安装实例 ID */
  installationId: string;
  /** Bot ID */
  botId: string;
  /** 触发用户 ID */
  userId: string;
  /** 链路追踪 ID */
  traceId: string;
  /** 工具参数 */
  args: Record<string, any>;
}

/** AI Tool 处理函数类型 */
export type ToolHandler = (ctx: ToolContext) => Promise<string>;

/** 工具参数定义（兼容 Linear tools 现有结构） */
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

/** 工具执行结果（兼容 Linear tools 现有结构） */
export interface ToolResult {
  /** 是否成功 */
  success: boolean;
  /** 返回数据 */
  data?: unknown;
  /** 错误信息 */
  error?: string;
}

/** 原始工具定义（兼容 Linear tools 现有结构） */
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

/** 工具调用请求（兼容现有结构） */
export interface ToolCallRequest {
  /** 工具名称 */
  tool: string;
  /** 调用参数 */
  args: Record<string, unknown>;
  /** 用户 ID */
  userId?: string;
}

/** 工具调用响应（兼容现有结构） */
export interface ToolCallResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** 应用 Manifest（兼容现有结构） */
export interface Manifest {
  /** 应用标识 */
  slug: string;
  /** 应用名称 */
  name: string;
  /** 应用图标 */
  icon: string;
  /** 监听的事件类型 */
  events: string[];
  /** 工具信息列表 */
  tools: ToolInfo[];
}

/** 工具信息（不含 handler） */
export interface ToolInfo {
  name: string;
  description: string;
  params: ToolParam[];
}
