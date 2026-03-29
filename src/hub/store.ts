/**
 * SQLite 存储模块
 * 用于持久化 OAuth token 和应用状态
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

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
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  /** 初始化数据库表 */
  private init(): void {
    this.db.exec(`
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
