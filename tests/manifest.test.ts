/**
 * Manifest 模块测试
 */

import { describe, it, expect } from "vitest";
import { createManifest } from "../src/hub/manifest.js";
import type { Tool } from "../src/hub/types.js";

describe("createManifest", () => {
  const mockTools: Tool[] = [
    {
      name: "test_tool",
      description: "测试工具",
      params: [{ name: "input", type: "string", description: "输入", required: true }],
      handler: async () => ({ success: true, data: "ok" }),
    },
    {
      name: "another_tool",
      description: "另一个工具",
      params: [],
      handler: async () => ({ success: true }),
    },
  ];

  it("应该生成正确的 manifest", () => {
    const manifest = createManifest(mockTools);
    expect(manifest.slug).toBe("linear");
    expect(manifest.name).toBe("Linear");
    expect(manifest.icon).toBe("🔮");
    expect(manifest.events).toEqual(["command"]);
  });

  it("应该包含所有工具信息", () => {
    const manifest = createManifest(mockTools);
    expect(manifest.tools).toHaveLength(2);
    expect(manifest.tools[0].name).toBe("test_tool");
    expect(manifest.tools[1].name).toBe("another_tool");
  });

  it("工具信息不应包含 handler", () => {
    const manifest = createManifest(mockTools);
    const toolInfo = manifest.tools[0] as Record<string, unknown>;
    expect(toolInfo).not.toHaveProperty("handler");
  });

  it("应该保留参数定义", () => {
    const manifest = createManifest(mockTools);
    expect(manifest.tools[0].params).toHaveLength(1);
    expect(manifest.tools[0].params[0].name).toBe("input");
    expect(manifest.tools[0].params[0].type).toBe("string");
    expect(manifest.tools[0].params[0].required).toBe(true);
  });

  it("空工具列表应返回空 tools", () => {
    const manifest = createManifest([]);
    expect(manifest.tools).toHaveLength(0);
  });
});
