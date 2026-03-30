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
import { handleSettingsPage, handleSettingsVerify, handleSettingsSave } from "./hub/settings.js";
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

  // 初始化 Linear 客户端（API Key 可选，云端托管模式下由用户安装时填写）
  const linearClient = config.linearApiKey
    ? new LinearClient({ apiKey: config.linearApiKey })
    : null;

  // 验证 API Key 有效性（仅在有 API Key 时）
  if (linearClient) {
    try {
      const viewer = await linearClient.viewer;
      console.log(`[main] Linear 已连接，用户: ${viewer.name} (${viewer.email})`);
    } catch (err) {
      console.error("[main] Linear API Key 无效:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  } else {
    console.log("[main] 未配置 LINEAR_API_KEY，运行在云端托管模式");
  }

  // 初始化存储
  const store = new Store(config.dbPath);

  // 收集所有工具（使用默认 client 或占位 client 来获取工具列表）
  const placeholderClient = linearClient ?? new LinearClient({ apiKey: "placeholder" });
  const tools = collectAllTools(placeholderClient);
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

    // OAuth 授权启动（GET 显示表单 / POST 提交表单）
    if (url.pathname === "/oauth/setup") {
      handleOAuthStart(req, res, { config, store, tools: definitions }).catch((err) => {
        console.error("[main] OAuth setup 异常:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "内部错误" }));
        }
      });
      return;
    }

    // GET /settings — 设置页面
    if (url.pathname === "/settings" && req.method === "GET") {
      handleSettingsPage(req, res);
      return;
    }

    // POST /settings/verify — 验证身份
    if (url.pathname === "/settings/verify" && req.method === "POST") {
      handleSettingsVerify(req, res, config, store).catch((err) => {
        console.error("[main] Settings verify 异常:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "内部错误" }));
        }
      });
      return;
    }

    // POST /settings/save — 保存配置
    if (url.pathname === "/settings/save" && req.method === "POST") {
      handleSettingsSave(req, res, config, store).catch((err) => {
        console.error("[main] Settings save 异常:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "内部错误" }));
        }
      });
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
        // 安装后从 Hub 拉取用户配置并加密存储
        const mode2HubClient = new HubClient(data.hub_url || config.hubUrl, data.app_token);
        mode2HubClient.fetchConfig().then((userConfig) => {
          if (Object.keys(userConfig).length > 0) {
            store.saveConfig(data.installation_id, userConfig);
            console.log("[oauth] 模式2用户配置已加密存储");
          }
        }).catch((err) => console.error("[oauth] 模式2拉取配置失败:", err));
        // 异步同步工具定义到 Hub
        mode2HubClient
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
        // command 事件：从本地加密存储读取配置，动态创建 LinearClient
        onCommand: async (event, installation) => {
          // 从加密存储读取 per-installation 配置
          const localConfig = store.getConfig(installation.id);
          const apiKey = localConfig.linear_api_key || config.linearApiKey;
          // 动态创建对应 installation 的 LinearClient
          const instLinearClient = new LinearClient({ apiKey });
          const instTools = collectAllTools(instLinearClient);
          const instRouter = new Router({ definitions, tools: instTools, store });
          const result = await instRouter.handleCommand(event);
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
