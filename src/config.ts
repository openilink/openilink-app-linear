/**
 * 应用配置模块
 * 从环境变量加载配置，提供默认值
 */

export interface Config {
  /** HTTP 服务端口 */
  port: number;
  /** Hub 服务地址 */
  hubUrl: string;
  /** 本应用对外基础地址 */
  baseUrl: string;
  /** SQLite 数据库文件路径 */
  dbPath: string;
  /** Linear Personal API Key（必填） */
  linearApiKey: string;
}

/** 从环境变量加载配置 */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const linearApiKey = env.LINEAR_API_KEY?.trim();
  if (!linearApiKey) {
    throw new Error("环境变量 LINEAR_API_KEY 是必填的");
  }

  return {
    port: parseInt(env.PORT?.trim() || "8089", 10),
    hubUrl: env.HUB_URL?.trim() || "http://localhost:8080",
    baseUrl: env.BASE_URL?.trim() || "http://localhost:8089",
    dbPath: env.DB_PATH?.trim() || "data/linear.db",
    linearApiKey,
  };
}
