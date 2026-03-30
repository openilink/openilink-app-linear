# OpeniLink Hub App - Linear

通过微信操作 Linear 的 Hub App。纯 Tools 型应用，共提供 13 个工具。

## 功能

### Issues (6 个工具)
- `list_issues` - 列出 Issue，支持按团队和状态过滤
- `create_issue` - 创建 Issue
- `get_issue` - 获取 Issue 详情
- `update_issue` - 更新 Issue
- `search_issues` - 搜索 Issue
- `add_comment` - 为 Issue 添加评论

### Projects (3 个工具)
- `list_projects` - 列出项目
- `get_project` - 获取项目详情
- `create_project` - 创建项目

### Teams (2 个工具)
- `list_teams` - 列出团队
- `get_team` - 获取团队详情

### Cycles (2 个工具)
- `list_cycles` - 列出 Cycle
- `get_current_cycle` - 获取当前活跃 Cycle

## 配置

| 环境变量 | 默认值 | 说明 |
|---------|-------|------|
| `LINEAR_API_KEY` | (必填) | Linear Personal API Key |
| `PORT` | `8089` | HTTP 服务端口 |
| `HUB_URL` | `http://localhost:8080` | Hub 服务地址 |
| `BASE_URL` | `http://localhost:8089` | 本应用对外基础地址 |
| `DB_PATH` | `data/linear.db` | SQLite 数据库路径 |

## 本地开发

```bash
# 安装依赖
npm install

# 开发模式运行
LINEAR_API_KEY=your_key npm run dev

# 类型检查
npm run typecheck

# 运行测试
npm test

# 集成测试（需要真实 API Key）
LINEAR_API_KEY=your_key npm run test:integration
```

## Docker 部署

```bash
LINEAR_API_KEY=your_key docker compose up -d
```

## API 端点

- `GET /healthz` - 健康检查
- `GET /api/manifest` - 获取应用 Manifest
- `GET /api/tools` - 获取工具列表
- `POST /api/tool` - 调用工具
- `POST /api/callback` - Hub Webhook 回调

## 使用方式

安装到 Bot 后，支持三种方式调用：

### 自然语言（推荐）

直接用微信跟 Bot 对话，Hub AI 会自动识别意图并调用对应功能：

- "查看 Linear 上我的待办"
- "创建一个 Issue 标题是优化首页性能"

### 命令调用

也可以使用 `/命令名 参数` 的格式直接调用：

- `/list_issues --state in_progress`

### AI 自动调用

Hub AI 在多轮对话中会自动判断是否需要调用本 App 的功能，无需手动触发。

## 安全与隐私

### 数据处理说明

- **无状态工具**：本 App 为纯工具型应用，请求即响应，**不存储任何用户数据**
- **第三方 API 调用**：您的请求会通过 Linear API 处理，请参阅其隐私政策
- **API Key 安全**：您的 API Key 仅存储在服务端环境变量或 Installation 配置中，不会暴露给其他用户

### 应用市场安装（托管模式）

通过 OpeniLink Hub 应用市场安装时，您的请求将通过我们的服务器转发至第三方 API。我们承诺：

- 不会记录、存储或分析您的请求内容和返回结果
- 您的 API Key 加密存储，仅用于调用对应的第三方服务
- 所有 App 代码完全开源，接受社区审查

### 自部署（推荐注重隐私的用户）

如果您对数据隐私有更高要求，建议自行部署：

```bash
docker compose up -d
```

自部署后 API Key 和所有请求数据仅在您自己的服务器上。

## License

MIT
