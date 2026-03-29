/**
 * Hub 客户端模块
 * 用于向 Hub 注册应用和上报状态
 */

import type { Manifest } from "./types.js";

export interface HubClientOptions {
  /** Hub 服务地址 */
  hubUrl: string;
  /** 本应用对外基础地址 */
  baseUrl: string;
}

export class HubClient {
  private hubUrl: string;
  private baseUrl: string;

  constructor(options: HubClientOptions) {
    this.hubUrl = options.hubUrl;
    this.baseUrl = options.baseUrl;
  }

  /** 向 Hub 注册应用 */
  async register(manifest: Manifest): Promise<void> {
    try {
      const res = await fetch(`${this.hubUrl}/api/apps/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manifest,
          callbackUrl: `${this.baseUrl}/api/callback`,
        }),
      });

      if (!res.ok) {
        console.warn(`[hub-client] 注册失败: ${res.status} ${res.statusText}`);
      } else {
        console.log("[hub-client] 应用注册成功");
      }
    } catch (err) {
      // Hub 不可用时不阻塞启动
      console.warn("[hub-client] 无法连接 Hub:", err instanceof Error ? err.message : err);
    }
  }

  /** 发送心跳 */
  async heartbeat(slug: string): Promise<void> {
    try {
      await fetch(`${this.hubUrl}/api/apps/${slug}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // 静默处理心跳失败
    }
  }
}
