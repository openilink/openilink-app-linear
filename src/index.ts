/**
 * 应用入口
 * 初始化 Linear 客户端、收集工具、启动 HTTP 服务
 * 实现 command-service 模式：
 *   - webhook command 事件：同步/异步响应（2500ms deadline）
 *   - OAuth 安装成功后：同步 tools 到 Hub
 *   - 启动时：遍历所有 installations 同步 tools
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { LinearClient } from "@linear/sdk";
import { loadConfig } from "./config.js";
import { Store } from "./hub/store.js";
import { HubClient } from "./hub/client.js";
import { toToolDefinitions } from "./hub/manifest.js";
import { handleWebhook } from "./hub/webhook.js";
import { handleOAuthStart, handleOAuthCallback } from "./hub/oauth.js";
import { Router } from "./router.js";
import type { Tool, ToolDefinition, Installation } from "./hub/types.js";

import { createHandlers as createIssueHandlers } from "./tools/issues.js";
import { createHandlers as createProjectHandlers } from "./tools/projects.js";
import { createHandlers as createTeamHandlers } from "./tools/teams.js";
import { createHandlers as createCycleHandlers } from "./tools/cycles.js";

/** 收集所有工具 */
function collectAllTools(linearClient: LinearClient): Tool[] {
  return [
    ...createIssueHandlers(linearClient),
    ...createProjectHandlers(linearClient),
    ...createTeamHandlers(linearClient),
    ...createCycleHandlers(linearClient),
  ];
}

/**
 * 启动时遍历所有 installations，向各自的 Hub 同步工具定义
 */
async function syncToolsToAllInstallations(
  store: Store,
  definitions: ToolDefinition[],
): Promise<void> {
  const installations = store.getAllInstallations();
  if (installations.length === 0) {
    console.log("[main] 暂无安装实例，跳过启动同步");
    return;
  }

  console.log(`[main] 启动同步：向 ${installations.length} 个安装实例同步工具定义...`);
  const results = await Promise.allSettled(
    installations.map(async (inst) => {
      const client = new HubClient(inst.hubUrl, inst.appToken);
      await client.syncTools(definitions);
      console.log(`[main] 同步成功: ${inst.id}`);
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(`[main] ${failed.length} 个安装实例同步失败`);
  }
}

/** 创建 HubClient 工厂函数 */
function createHubClientFactory(inst: Installation): HubClient {
  return new HubClient(inst.hubUrl, inst.appToken);
}

/** 启动应用 */
async function main(): Promise<void> {
  const config = loadConfig();

  // 初始化 Linear 客户端
  const linearClient = new LinearClient({ apiKey: config.linearApiKey });

  // 验证 API Key 有效性
  try {
    const viewer = await linearClient.viewer;
    console.log(`[main] Linear 已连接，用户: ${viewer.name} (${viewer.email})`);
  } catch (err) {
    console.error("[main] Linear API Key 无效:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // 初始化存储
  const store = new Store(config.dbPath);

  // 收集所有工具
  const tools = collectAllTools(linearClient);
  console.log(`[main] 已注册 ${tools.length} 个工具: ${tools.map((t) => t.name).join(", ")}`);

  // 转换为 Hub 协议工具定义
  const definitions = toToolDefinitions(tools);

  // 创建命令路由器
  const router = new Router({ definitions, tools, store });

  // 启动时向所有已安装实例同步工具定义
  await syncToolsToAllInstallations(store, definitions);

  // 创建 HTTP 服务
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // 健康检查
    if (url.pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // OAuth 授权启动
    if (url.pathname === "/oauth/setup") {
      handleOAuthStart(req, res, { config, store, tools: definitions });
      return;
    }

    // OAuth 授权回调
    if (url.pathname === "/oauth/redirect" && req.method === "GET") {
      handleOAuthCallback(req, res, { config, store, tools: definitions }).catch((err) => {
        console.error("[main] OAuth 回调异常:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "内部错误" }));
        }
      });
      return;
    }

    // POST /oauth/redirect — 模式 2: Hub 直接安装通知
    if (url.pathname === "/oauth/redirect" && req.method === "POST") {
      (async () => {
        const body = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", () => resolve(Buffer.concat(chunks)));
          req.on("error", reject);
        });
        const data = JSON.parse(body.toString());
        store.saveInstallation({
          id: data.installation_id,
          hubUrl: data.hub_url || config.hubUrl,
          appId: "",
          botId: data.bot_id || "",
          appToken: data.app_token,
          webhookSecret: data.webhook_secret,
          createdAt: new Date().toISOString(),
        });
        console.log("[oauth] 模式2安装成功, installation_id:", data.installation_id);
        // 异步同步工具定义到 Hub
        new HubClient(data.hub_url || config.hubUrl, data.app_token)
          .syncTools(definitions)
          .catch((err) => console.error("[oauth] 模式2同步工具失败:", err));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ webhook_url: `${config.baseUrl}/webhook` }));
      })().catch((err) => {
        console.error("[main] 模式2安装异常:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "内部错误" }));
        }
      });
      return;
    }

    // Webhook 事件接收
    if (url.pathname === "/webhook") {
      handleWebhook(req, res, {
        store,
        // command 事件：通过 Router 执行工具并返回结果
        onCommand: async (event, _installation) => {
          const result = await router.handleCommand(event);
          return result ?? null;
        },
        // 超时后异步回复需要的 HubClient 工厂
        getHubClient: createHubClientFactory,
      }).catch((err) => {
        console.error("[main] Webhook 处理异常:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "内部错误" }));
        }
      });
      return;
    }

    // 未匹配的路由
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  server.listen(config.port, () => {
    console.log(`[main] HTTP 服务启动于 :${config.port}`);
  });

  // 优雅退出
  const shutdown = () => {
    console.log("[main] 正在关闭...");
    server.close();
    store.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[main] 启动失败:", err);
  process.exit(1);
});
