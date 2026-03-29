/**
 * Webhook 处理模块
 * 处理来自 Hub 的事件推送
 */

import type { HubEvent, Tool, ToolCallRequest, ToolCallResponse } from "./types.js";

export class WebhookHandler {
  private tools: Map<string, Tool>;

  constructor(tools: Tool[]) {
    this.tools = new Map(tools.map((t) => [t.name, t]));
  }

  /** 处理事件推送 */
  async handleEvent(event: HubEvent): Promise<void> {
    console.log(`[webhook] 收到事件: type=${event.type}, userId=${event.userId}`);
  }

  /** 处理工具调用 */
  async handleToolCall(request: ToolCallRequest): Promise<ToolCallResponse> {
    const tool = this.tools.get(request.tool);
    if (!tool) {
      return { success: false, error: `未找到工具: ${request.tool}` };
    }

    try {
      const result = await tool.handler(request.args);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[webhook] 工具调用失败: ${request.tool}`, message);
      return { success: false, error: message };
    }
  }

  /** 获取已注册的工具名称列表 */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
