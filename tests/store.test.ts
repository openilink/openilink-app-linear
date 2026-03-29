/**
 * SQLite 存储模块测试
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "../src/hub/store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Store", () => {
  let store: Store;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "linear-test-"));
    store = new Store(join(tmpDir, "test.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("token 操作", () => {
    it("应该保存和获取 token", () => {
      store.saveToken({
        userId: "user-1",
        accessToken: "token-abc",
        refreshToken: "refresh-xyz",
        expiresAt: 1234567890,
      });

      const record = store.getToken("user-1");
      expect(record).toBeDefined();
      expect(record!.userId).toBe("user-1");
      expect(record!.accessToken).toBe("token-abc");
      expect(record!.refreshToken).toBe("refresh-xyz");
      expect(record!.expiresAt).toBe(1234567890);
    });

    it("不存在的用户应返回 undefined", () => {
      const record = store.getToken("nonexistent");
      expect(record).toBeUndefined();
    });

    it("应该更新已存在的 token", () => {
      store.saveToken({ userId: "user-1", accessToken: "old-token" });
      store.saveToken({ userId: "user-1", accessToken: "new-token" });

      const record = store.getToken("user-1");
      expect(record!.accessToken).toBe("new-token");
    });

    it("应该删除 token", () => {
      store.saveToken({ userId: "user-1", accessToken: "token" });
      store.deleteToken("user-1");

      const record = store.getToken("user-1");
      expect(record).toBeUndefined();
    });

    it("删除不存在的 token 不应报错", () => {
      expect(() => store.deleteToken("nonexistent")).not.toThrow();
    });
  });

  describe("KV 操作", () => {
    it("应该保存和获取 KV", () => {
      store.setKV("key-1", "value-1");
      expect(store.getKV("key-1")).toBe("value-1");
    });

    it("不存在的 key 应返回 undefined", () => {
      expect(store.getKV("nonexistent")).toBeUndefined();
    });

    it("应该覆盖已存在的 KV", () => {
      store.setKV("key-1", "old-value");
      store.setKV("key-1", "new-value");
      expect(store.getKV("key-1")).toBe("new-value");
    });
  });
});
