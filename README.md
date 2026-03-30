# @openilink/app-linear

[![OpeniLink Hub](https://img.shields.io/badge/OpeniLink_Hub-安装到微信-07C160?style=for-the-badge&logo=wechat&logoColor=white)](https://github.com/openilink/openilink-hub)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)]()

> 在微信里管理 Linear -- 查看 Issue、创建任务、跟进项目、管理 Cycle，随时掌握团队进度。

**13 个 AI Tools** | 纯工具型无状态应用

---

## 亮点

- **微信管理 Linear 任务** -- 出门在外也能创建 Issue、更新状态、添加评论
- **项目 + Cycle 全覆盖** -- 不只是 Issue，项目进度和迭代周期也能查
- **自然语言驱动** -- 对 Bot 说「查看 Linear 上我的待办」即可
- **无状态零存储** -- 请求即响应，不存储任何用户数据

## 13 个 AI Tools 一览

| 分类 | 数量 | 工具 |
|------|------|------|
| **Issue** | 6 | `list_issues` `create_issue` `get_issue` `update_issue` `search_issues` `add_comment` |
| **项目** | 3 | `list_projects` `get_project` `create_project` |
| **团队** | 2 | `list_teams` `get_team` |
| **Cycle** | 2 | `list_cycles` `get_current_cycle` |

## 使用方式

安装到 Bot 后，支持三种方式：

**自然语言（推荐）** -- 直接对 Bot 说话，Hub AI 自动识别意图并调用：
- "查看 Linear 上我的待办"
- "创建一个 Issue 标题是优化首页性能"
- "当前 Cycle 还剩多少任务"

**命令调用** -- `/list_issues --state in_progress`

**AI 自动调用** -- Hub AI 在多轮对话中自动判断何时需要调用本 App。

<details>
<summary><strong>部署与配置</strong></summary>

### 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `LINEAR_API_KEY` | 是 | -- | Linear Personal API Key |
| `HUB_URL` | 否 | `http://localhost:8080` | Hub 服务地址 |
| `BASE_URL` | 否 | `http://localhost:8089` | 本应用对外基础地址 |
| `PORT` | 否 | `8089` | HTTP 服务端口 |
| `DB_PATH` | 否 | `data/linear.db` | SQLite 数据库路径 |

### 启动

```bash
# Docker（推荐）
LINEAR_API_KEY=your_key docker compose up -d

# 或源码运行
git clone https://github.com/openilink/openilink-app-linear.git
cd openilink-app-linear
npm install
LINEAR_API_KEY=your_key npm run dev
```

### 开发

```bash
npm run typecheck   # 类型检查
npm test            # 单元测试
LINEAR_API_KEY=your_key npm run test:integration  # 集成测试
```

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/healthz` | 健康检查 |
| `GET` | `/api/manifest` | 获取应用 Manifest |
| `GET` | `/api/tools` | 获取工具列表 |
| `POST` | `/api/tool` | 调用工具 |
| `POST` | `/api/callback` | Hub Webhook 回调 |

</details>

## 安全与隐私

- **无状态工具** -- 请求即响应，不存储任何用户数据
- **API Key 安全** -- 仅存储在服务端环境变量或 Installation 配置中，不会暴露给其他用户
- **完全开源** -- 所有代码接受社区审查；自部署后数据完全不经过第三方

## 更多 OpeniLink Hub App

| App | 说明 |
|-----|------|
| [openilink-hub](https://github.com/openilink/openilink-hub) | 开源微信 Bot 管理平台 |
| [app-notion](https://github.com/openilink/openilink-app-notion) | 微信操作 Notion -- 15 Tools |
| [app-github](https://github.com/openilink/openilink-app-github) | 微信管理 GitHub -- 36 Tools |
| [app-amap](https://github.com/openilink/openilink-app-amap) | 微信查高德地图 -- 10 Tools |
| [app-lark](https://github.com/openilink/openilink-app-lark) | 微信 <-> 飞书桥接 -- 34 Tools |
| [app-slack](https://github.com/openilink/openilink-app-slack) | 微信 <-> Slack 桥接 -- 23 Tools |
| [app-dingtalk](https://github.com/openilink/openilink-app-dingtalk) | 微信 <-> 钉钉桥接 -- 20 Tools |
| [app-discord](https://github.com/openilink/openilink-app-discord) | 微信 <-> Discord 桥接 -- 19 Tools |
| [app-google](https://github.com/openilink/openilink-app-google) | 微信操作 Google Workspace -- 18 Tools |

## License

MIT
