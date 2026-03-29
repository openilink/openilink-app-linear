/**
 * Webhook 处理模块测试
 */

import { describe, it, expect } from "vitest";
import { WebhookHandler } from "../src/hub/webhook.js";
import type { Tool } from "../src/hub/types.js";

describe("WebhookHandler", () => {
  const mockTools: Tool[] = [
    {
      name: "greet",
      description: "打招呼",
      params: [{ name: "name", type: "string", description: "姓名", required: true }],
      handler: async (args) => ({
        success: true,
        data: `你好, ${args.name}`,
      }),
    },
    {
      name: "fail_tool",
      description: "会失败的工具",
      params: [],
      handler: async () => {
        throw new Error("模拟失败");
      },
    },
  ];

  it("应该成功调用工具", async () => {
    const handler = new WebhookHandler(mockTools);
    const result = await handler.handleToolCall({
      tool: "greet",
      args: { name: "世界" },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBe("你好, 世界");
  });

  it("调用不存在的工具应返回错误", async () => {
    const handler = new WebhookHandler(mockTools);
    const result = await handler.handleToolCall({
      tool: "nonexistent",
      args: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("未找到工具");
  });

  it("工具抛出异常应被捕获", async () => {
    const handler = new WebhookHandler(mockTools);
    const result = await handler.handleToolCall({
      tool: "fail_tool",
      args: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("模拟失败");
  });

  it("应该返回已注册的工具名称", () => {
    const handler = new WebhookHandler(mockTools);
    const names = handler.getToolNames();
    expect(names).toEqual(["greet", "fail_tool"]);
  });

  it("空工具列表不应报错", () => {
    const handler = new WebhookHandler([]);
    expect(handler.getToolNames()).toEqual([]);
  });
});
