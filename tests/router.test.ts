/**
 * 路由模块测试
 */

import { describe, it, expect } from "vitest";
import { Router } from "../src/router.js";
import { createManifest } from "../src/hub/manifest.js";
import type { Tool } from "../src/hub/types.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

/** 创建模拟请求 */
function createMockReq(method: string, url: string, body?: string): IncomingMessage {
  const readable = new Readable();
  readable.push(body || null);
  readable.push(null);

  const req = readable as unknown as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = { host: "localhost:8089" };
  return req;
}

/** 创建模拟响应并捕获输出 */
function createMockRes(): { res: ServerResponse; getResult: () => { status: number; body: string } } {
  let status = 200;
  let body = "";
  const headers: Record<string, string> = {};

  const res = {
    writeHead(s: number, h: Record<string, string | number>) {
      status = s;
      Object.assign(headers, h);
    },
    end(b: string) {
      body = b || "";
    },
  } as unknown as ServerResponse;

  return { res, getResult: () => ({ status, body }) };
}

describe("Router", () => {
  const mockTools: Tool[] = [
    {
      name: "echo",
      description: "回声",
      params: [{ name: "text", type: "string", description: "文本", required: true }],
      handler: async (args) => ({
        success: true,
        data: args.text,
      }),
    },
  ];

  const manifest = createManifest(mockTools);
  const router = new Router({ manifest, tools: mockTools });

  it("GET /healthz 应返回 200", async () => {
    const req = createMockReq("GET", "/healthz");
    const { res, getResult } = createMockRes();

    await router.handle(req, res);
    const result = getResult();
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ status: "ok" });
  });

  it("GET /api/manifest 应返回 manifest", async () => {
    const req = createMockReq("GET", "/api/manifest");
    const { res, getResult } = createMockRes();

    await router.handle(req, res);
    const result = getResult();
    expect(result.status).toBe(200);

    const data = JSON.parse(result.body);
    expect(data.slug).toBe("linear");
    expect(data.name).toBe("Linear");
    expect(data.tools).toHaveLength(1);
  });

  it("POST /api/tool 应调用工具", async () => {
    const body = JSON.stringify({ tool: "echo", args: { text: "hello" } });
    const req = createMockReq("POST", "/api/tool", body);
    const { res, getResult } = createMockRes();

    await router.handle(req, res);
    const result = getResult();
    expect(result.status).toBe(200);

    const data = JSON.parse(result.body);
    expect(data.success).toBe(true);
    expect(data.data).toBe("hello");
  });

  it("POST /api/tool 调用不存在的工具应返回 400", async () => {
    const body = JSON.stringify({ tool: "nonexistent", args: {} });
    const req = createMockReq("POST", "/api/tool", body);
    const { res, getResult } = createMockRes();

    await router.handle(req, res);
    const result = getResult();
    expect(result.status).toBe(400);
  });

  it("GET /api/tools 应返回工具列表", async () => {
    const req = createMockReq("GET", "/api/tools");
    const { res, getResult } = createMockRes();

    await router.handle(req, res);
    const result = getResult();
    expect(result.status).toBe(200);

    const data = JSON.parse(result.body);
    expect(data.tools).toHaveLength(1);
    expect(data.tools[0].name).toBe("echo");
  });

  it("未知路径应返回 404", async () => {
    const req = createMockReq("GET", "/unknown");
    const { res, getResult } = createMockRes();

    await router.handle(req, res);
    const result = getResult();
    expect(result.status).toBe(404);
  });
});
