/**
 * OAuth 模块
 * Linear 使用 Personal API Key 认证，此模块为标准 Hub 层保留
 * 如果未来需要 OAuth2 流程可在此扩展
 */

import type { Store } from "./store.js";

export interface OAuthConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export class OAuthManager {
  private store: Store;
  private config: OAuthConfig;

  constructor(store: Store, config: OAuthConfig = {}) {
    this.store = store;
    this.config = config;
  }

  /** 获取授权 URL（Linear OAuth2 流程预留） */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId || "",
      redirect_uri: this.config.redirectUri || "",
      response_type: "code",
      state,
      scope: "read,write",
    });
    return `https://linear.app/oauth/authorize?${params.toString()}`;
  }

  /** 保存 token */
  saveToken(userId: string, accessToken: string, refreshToken?: string): void {
    this.store.saveToken({
      userId,
      accessToken,
      refreshToken,
    });
  }

  /** 获取 token */
  getToken(userId: string): string | undefined {
    const record = this.store.getToken(userId);
    return record?.accessToken;
  }
}
