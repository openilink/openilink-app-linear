/**
 * 加密工具模块
 * 提供签名验证等安全功能
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** 使用 HMAC-SHA256 生成签名 */
export function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** 验证签名是否匹配 */
export function verify(payload: string, secret: string, signature: string): boolean {
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
