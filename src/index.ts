/**
 * 应用入口
 * 初始化 Linear 客户端、收集工具、启动 HTTP 服务
 */

import { createServer } from "node:http";
import { LinearClient } from "@linear/sdk";
import { loadConfig } from "./config.js";
import { Store } from "./hub/store.js";
import { HubClient } from "./hub/client.js";
import { createManifest } from "./hub/manifest.js";
import { Router } from "./router.js";
import type { Tool } from "./hub/types.js";

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

  // 创建 manifest
  const manifest = createManifest(tools);

  // 创建路由
  const router = new Router({ manifest, tools });

  // 创建 HTTP 服务
  const server = createServer((req, res) => {
    router.handle(req, res);
  });

  server.listen(config.port, () => {
    console.log(`[main] HTTP 服务启动于 :${config.port}`);
  });

  // 向 Hub 注册
  const hubClient = new HubClient({
    hubUrl: config.hubUrl,
    baseUrl: config.baseUrl,
  });
  await hubClient.register(manifest);

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
