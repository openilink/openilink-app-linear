/**
 * 命令路由器 —— 将 Hub 事件分发到对应的工具处理函数
 *
 * Linear 的工具返回 ToolResult（{success, data?, error?}），
 * 本路由器负责将其转换为标准的 string 响应。
 */

import type { HubEvent, ToolDefinition, ToolContext, Tool } from "./hub/types.js";
import type { HubClient } from "./hub/client.js";
import type { Store } from "./hub/store.js";

/** Router 构造参数 */
export interface RouterOptions {
  /** 工具定义列表 */
  definitions: ToolDefinition[];
  /** 原始工具列表（含 handler） */
  tools: Tool[];
  /** Store 实例 */
  store: Store;
}

/**
 * 命令路由器
 */
export class Router {
  private definitions: ToolDefinition[];
  private toolMap: Map<string, Tool>;
  private store: Store;

  constructor(opts: RouterOptions) {
    this.definitions = opts.definitions;
    this.store = opts.store;
    this.toolMap = new Map(opts.tools.map((t) => [t.name, t]));
  }

  /** 获取所有已注册的工具定义 */
  getDefinitions(): ToolDefinition[] {
    return this.definitions;
  }

  /**
   * 处理 Hub 推送的 command 事件
   * 将 Linear 工具的 ToolResult 格式化为文本字符串
   */
  async handleCommand(event: HubEvent): Promise<string | undefined> {
    if (event.type !== "event" || !event.event || event.event.type !== "command") {
      return undefined;
    }

    const eventData = event.event.data;
    const command = (eventData.command as string) || "";
    const args = (eventData.args as Record<string, unknown>) || {};

    // 查找对应的工具
    const tool = this.toolMap.get(command);
    if (!tool) {
      return `未知命令：${command}。可用命令：${this.definitions.map((d) => d.command).join("、")}`;
    }

    try {
      const result = await tool.handler(args);
      if (result.success) {
        // 将 data 格式化为可读文本
        if (result.data === undefined || result.data === null) {
          return "执行成功";
        }
        if (typeof result.data === "string") {
          return result.data;
        }
        return JSON.stringify(result.data, null, 2);
      } else {
        return `命令执行失败：${result.error || "未知错误"}`;
      }
    } catch (err: any) {
      console.error(`[Router] 命令 ${command} 执行异常:`, err);
      return `命令执行失败：${err.message || "未知错误"}`;
    }
  }

  /**
   * 完整处理流程：执行命令并通过 HubClient 回传结果
   * 使用 /bot/v1/message/send 发送结果消息
   */
  async handleAndReply(event: HubEvent, hubClient: HubClient): Promise<void> {
    const result = await this.handleCommand(event);
    if (result === undefined) return;

    // 优先使用 sender.id
    const evtData = event.event?.data;
    const evtSender = (evtData as any)?.sender;
    const userId = (evtSender?.id ?? (evtData as any)?.user_id ?? (evtData as any)?.from ?? "") as string;
    if (!userId) return;

    try {
      await hubClient.sendMessage({ userId, text: result, traceId: event.trace_id });
    } catch (err) {
      console.error("[Router] 回传工具结果失败:", err);
    }
  }
}
