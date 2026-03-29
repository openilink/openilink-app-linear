/**
 * Hub 加密工具模块
 * 提供签名生成与验证等安全功能
 *
 * 签名规范：
 *   算法: HMAC-SHA256(secret, timestamp + ":" + body)
 *   格式: "sha256=" + hex(digest)
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 使用 HMAC-SHA256 生成签名
 * @param timestamp - 时间戳字符串
 * @param payload - 请求体内容
 * @param secret - 签名密钥
 * @returns 带 sha256= 前缀的签名字符串
 */
export function sign(timestamp: string, payload: string, secret: string): string {
  const mac = createHmac("sha256", secret);
  mac.update(timestamp + ":");
  mac.update(payload);
  return "sha256=" + mac.digest("hex");
}

/**
 * 验证签名是否匹配（时间安全比较）
 * @param timestamp - 时间戳字符串
 * @param payload - 请求体内容
 * @param secret - 签名密钥
 * @param signature - 待验证的签名，格式 "sha256=xxx"
 */
export function verify(
  timestamp: string,
  payload: string,
  secret: string,
  signature: string,
): boolean {
  const expected = sign(timestamp, payload, secret);
  if (expected.length !== signature.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
