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
