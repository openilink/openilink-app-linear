/**
 * 加密工具模块测试
 */

import { describe, it, expect } from "vitest";
import { sign, verify } from "../src/hub/crypto.js";

describe("crypto", () => {
  const secret = "test-secret";
  const payload = '{"event":"test"}';

  describe("sign", () => {
    it("应该生成 hex 格式签名", () => {
      const signature = sign(payload, secret);
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });

    it("相同输入应该生成相同签名", () => {
      const sig1 = sign(payload, secret);
      const sig2 = sign(payload, secret);
      expect(sig1).toBe(sig2);
    });

    it("不同 secret 应该生成不同签名", () => {
      const sig1 = sign(payload, "secret-1");
      const sig2 = sign(payload, "secret-2");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verify", () => {
    it("正确签名应验证通过", () => {
      const signature = sign(payload, secret);
      expect(verify(payload, secret, signature)).toBe(true);
    });

    it("错误签名应验证失败", () => {
      expect(verify(payload, secret, "wrong-signature")).toBe(false);
    });

    it("不同 payload 应验证失败", () => {
      const signature = sign(payload, secret);
      expect(verify("different-payload", secret, signature)).toBe(false);
    });
  });
});
