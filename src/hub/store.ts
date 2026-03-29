/**
 * SQLite 持久化存储层（基于 better-sqlite3）
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Installation } from "./types.js";

/** Token 记录（兼容旧结构） */
export interface TokenRecord {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export class Store {
  private db: Database.Database;

  constructor(dbPath: string) {
    // 确保目录存在
    if (dbPath !== ":memory:") {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  /** 初始化数据库表 */
  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS installations (
        id            TEXT PRIMARY KEY,
        hub_url       TEXT NOT NULL,
        app_id        TEXT NOT NULL,
        bot_id        TEXT NOT NULL,
        app_token     TEXT NOT NULL,
        webhook_secret TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tokens (
        user_id TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  // ─── Installation CRUD ────────────────────────────────────

  /** 保存或更新安装记录 */
  saveInstallation(inst: Installation): void {
    this.db.prepare(`
      INSERT INTO installations (id, hub_url, app_id, bot_id, app_token, webhook_secret, created_at)
      VALUES (@id, @hubUrl, @appId, @botId, @appToken, @webhookSecret, @createdAt)
      ON CONFLICT(id) DO UPDATE SET
        hub_url = excluded.hub_url, app_id = excluded.app_id,
        bot_id = excluded.bot_id, app_token = excluded.app_token,
        webhook_secret = excluded.webhook_secret
    `).run({
      id: inst.id,
      hubUrl: inst.hubUrl,
      appId: inst.appId,
      botId: inst.botId,
      appToken: inst.appToken,
      webhookSecret: inst.webhookSecret,
      createdAt: inst.createdAt || new Date().toISOString(),
    });
  }

  /** 根据 ID 获取单条安装记录 */
  getInstallation(id: string): Installation | undefined {
    const row = this.db
      .prepare("SELECT * FROM installations WHERE id = ?")
      .get(id) as Record<string, string> | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      hubUrl: row.hub_url,
      appId: row.app_id,
      botId: row.bot_id,
      appToken: row.app_token,
      webhookSecret: row.webhook_secret,
      createdAt: row.created_at,
    };
  }

  /** 获取所有安装记录 */
  getAllInstallations(): Installation[] {
    const rows = this.db
      .prepare("SELECT * FROM installations ORDER BY created_at DESC")
      .all() as Record<string, string>[];
    return rows.map((row) => ({
      id: row.id,
      hubUrl: row.hub_url,
      appId: row.app_id,
      botId: row.bot_id,
      appToken: row.app_token,
      webhookSecret: row.webhook_secret,
      createdAt: row.created_at,
    }));
  }

  // ─── Token CRUD（兼容旧接口）────────────────────────────────

  /** 保存用户 token */
  saveToken(record: TokenRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO tokens (user_id, access_token, refresh_token, expires_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(record.userId, record.accessToken, record.refreshToken ?? null, record.expiresAt ?? null);
  }

  /** 获取用户 token */
  getToken(userId: string): TokenRecord | undefined {
    const row = this.db
      .prepare("SELECT user_id, access_token, refresh_token, expires_at FROM tokens WHERE user_id = ?")
      .get(userId) as { user_id: string; access_token: string; refresh_token: string | null; expires_at: number | null } | undefined;

    if (!row) return undefined;
    return {
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token ?? undefined,
      expiresAt: row.expires_at ?? undefined,
    };
  }

  /** 删除用户 token */
  deleteToken(userId: string): void {
    this.db.prepare("DELETE FROM tokens WHERE user_id = ?").run(userId);
  }

  /** 保存键值对 */
  setKV(key: string, value: string): void {
    this.db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)").run(key, value);
  }

  /** 获取键值对 */
  getKV(key: string): string | undefined {
    const row = this.db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value;
  }

  /** 关闭数据库连接 */
  close(): void {
    this.db.close();
  }
}
