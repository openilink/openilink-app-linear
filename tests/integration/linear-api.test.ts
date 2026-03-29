/**
 * Linear API 集成测试
 * 需要设置 LINEAR_API_KEY 环境变量才能运行
 * 运行: LINEAR_API_KEY=xxx npx vitest run --config vitest.integration.config.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import { LinearClient } from "@linear/sdk";

const apiKey = process.env.LINEAR_API_KEY;

describe.skipIf(!apiKey)("Linear API 集成测试", () => {
  let client: LinearClient;

  beforeAll(() => {
    client = new LinearClient({ apiKey: apiKey! });
  });

  it("应该能获取当前用户信息", async () => {
    const viewer = await client.viewer;
    expect(viewer.id).toBeDefined();
    expect(viewer.name).toBeDefined();
    expect(viewer.email).toBeDefined();
  });

  it("应该能列出团队", async () => {
    const teams = await client.teams();
    expect(teams.nodes).toBeDefined();
    expect(Array.isArray(teams.nodes)).toBe(true);
  });

  it("应该能列出 Issue", async () => {
    const issues = await client.issues({ first: 5 });
    expect(issues.nodes).toBeDefined();
    expect(Array.isArray(issues.nodes)).toBe(true);
  });

  it("应该能列出项目", async () => {
    const projects = await client.projects({ first: 5 });
    expect(projects.nodes).toBeDefined();
    expect(Array.isArray(projects.nodes)).toBe(true);
  });

  it("应该能搜索 Issue", async () => {
    const results = await client.searchIssues("test");
    expect(results.nodes).toBeDefined();
    expect(Array.isArray(results.nodes)).toBe(true);
  });
});
