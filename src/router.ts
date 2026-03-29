/**
 * HTTP 路由模块
 * 处理所有 HTTP 请求，包括 manifest、工具调用、Webhook 等
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Manifest, Tool, ToolCallRequest } from "./hub/types.js";
import { WebhookHandler } from "./hub/webhook.js";

export interface RouterOptions {
  manifest: Manifest;
  tools: Tool[];
}

/** HTTP 路由器 */
export class Router {
  private manifest: Manifest;
  private webhookHandler: WebhookHandler;

  constructor(options: RouterOptions) {
    this.manifest = options.manifest;
    this.webhookHandler = new WebhookHandler(options.tools);
  }

  /** 处理 HTTP 请求 */
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = url.pathname;
    const method = req.method?.toUpperCase() || "GET";

    try {
      // 健康检查
      if (path === "/healthz" && method === "GET") {
        this.json(res, 200, { status: "ok" });
        return;
      }

      // 获取 manifest
      if (path === "/api/manifest" && method === "GET") {
        this.json(res, 200, this.manifest);
        return;
      }

      // 工具调用
      if (path === "/api/tool" && method === "POST") {
        const body = await this.readBody(req);
        const request = JSON.parse(body) as ToolCallRequest;
        const result = await this.webhookHandler.handleToolCall(request);
        this.json(res, result.success ? 200 : 400, result);
        return;
      }

      // Webhook 回调
      if (path === "/api/callback" && method === "POST") {
        const body = await this.readBody(req);
        const event = JSON.parse(body);
        await this.webhookHandler.handleEvent(event);
        this.json(res, 200, { ok: true });
        return;
      }

      // 工具列表
      if (path === "/api/tools" && method === "GET") {
        this.json(res, 200, { tools: this.manifest.tools });
        return;
      }

      // 404
      this.json(res, 404, { error: "Not Found" });
    } catch (err) {
      console.error("[router] 请求处理失败:", err);
      this.json(res, 500, {
        error: err instanceof Error ? err.message : "Internal Server Error",
      });
    }
  }

  /** 读取请求体 */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      req.on("error", reject);
    });
  }

  /** 发送 JSON 响应 */
  private json(res: ServerResponse, status: number, data: unknown): void {
    const body = JSON.stringify(data);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  }
}
