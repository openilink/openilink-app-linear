/**
 * 配置模块测试
 */

import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("应该使用默认值加载配置", () => {
    const config = loadConfig({ LINEAR_API_KEY: "test-key-123" });
    expect(config.port).toBe(8089);
    expect(config.hubUrl).toBe("http://localhost:8080");
    expect(config.baseUrl).toBe("http://localhost:8089");
    expect(config.dbPath).toBe("data/linear.db");
    expect(config.linearApiKey).toBe("test-key-123");
  });

  it("应该使用自定义环境变量覆盖默认值", () => {
    const config = loadConfig({
      PORT: "3000",
      HUB_URL: "http://hub:9090",
      BASE_URL: "http://app:3000",
      DB_PATH: "/tmp/test.db",
      LINEAR_API_KEY: "custom-key",
    });
    expect(config.port).toBe(3000);
    expect(config.hubUrl).toBe("http://hub:9090");
    expect(config.baseUrl).toBe("http://app:3000");
    expect(config.dbPath).toBe("/tmp/test.db");
    expect(config.linearApiKey).toBe("custom-key");
  });

  it("缺少 LINEAR_API_KEY 应抛出错误", () => {
    expect(() => loadConfig({})).toThrow("LINEAR_API_KEY");
  });

  it("空白 LINEAR_API_KEY 应抛出错误", () => {
    expect(() => loadConfig({ LINEAR_API_KEY: "   " })).toThrow("LINEAR_API_KEY");
  });

  it("应该去除环境变量中的空白字符", () => {
    const config = loadConfig({
      PORT: " 9000 ",
      LINEAR_API_KEY: "  key-with-spaces  ",
    });
    expect(config.port).toBe(9000);
    expect(config.linearApiKey).toBe("key-with-spaces");
  });
});
