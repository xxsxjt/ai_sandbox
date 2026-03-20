# 增强版部署指南

## 新增功能

本项目已经增强，包含以下新功能：

1. **用户记录管理**：
   - 用户可以编辑自己的分析记录和总结
   - 用户可以删除自己的记录（软删除，不影响服务器总记录）
   - 用户可以设置记录为公开或私有状态

2. **公开记录库**：
   - 用户可以选择公开自己的记录，供其他用户查看
   - 提供公开记录的浏览页面 (public.html)
   - 支持搜索和排序功能

3. **服务器总记录库**：
   - 所有用户记录的完整备份（包括已删除的记录）
   - 管理员可以查看所有记录，包括隐藏或已删除的

4. **管理员后台**：
   - 完整的管理员界面 (admin.html)
   - 查看系统统计信息
   - 查看所有用户及其记录
   - 查看服务器总记录库（可选择包含已删除记录）
   - 添加其他用户为管理员

5. **改进的加载状态**：
   - 从全屏遮罩改为处理中的任务列表
   - 支持多个任务同时处理
   - 可最小化任务列表，不影响用户操作

## 部署步骤

### 1. 服务器环境准备

确保您的服务器已安装以下环境：

- Node.js 14.0 或更高版本
- SQLite3
- Nginx (推荐，用于反向代理)

### 2. 项目文件上传

将所有项目文件上传到服务器的指定目录，例如：

```bash
mkdir /var/www/ai-analyzer
cd /var/www/ai-analyzer
# 上传项目文件到此目录
```

### 3. 安装依赖

```bash
npm install
```

### 4. 初始化管理员账户

首次部署时，需要创建管理员账户：

```bash
node init-admin.js admin your_password
```

这将创建一个名为 "admin" 的用户，并将其设置为管理员。您可以将 "admin" 替换为您想要的用户名。

### 5. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的环境变量：

```env
PORT=3000
JWT_SECRET=your_very_secure_secret_key_here
```

### 6. 启动应用

```bash
npm start
```

或者使用 PM2 进程管理器：

```bash
npm install -g pm2
pm2 start server.js --name "ai-analyzer"
```

### 7. 配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/ai-analyzer`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/ai-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. 配置 SSL (可选)

可以使用 Let's Encrypt 免费获取 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 安全建议

1. **修改默认密码**：
   - 部署后立即修改默认管理员密码
   - 使用强密码

2. **JWT Secret**：
   - 使用长且随机的 JWT_SECRET
   - 定期更换密钥

3. **防火墙设置**：
   - 只开放必要的端口（80, 443）
   - 限制对 3000 端口的访问（仅本地）

4. **定期备份**：
   - 定期备份数据库文件 `database.sqlite`
   - 可以设置自动备份脚本

## 使用指南

### 普通用户

1. **注册/登录**：
   - 访问主页面 (index-server.html)
   - 注册新账户或使用现有账户登录

2. **分析内容**：
   - 在"分析回答"页面输入内容和上下文
   - 配置分析类型和严格程度
   - 点击"开始分析"

3. **管理记录**：
   - 在"分析记录"页面查看和管理分析
   - 在"总结分析"页面查看和管理总结
   - 可以编辑、删除或更改公开状态

4. **查看公开记录**：
   - 点击"公开记录库"链接
   - 浏览其他用户分享的公开记录

### 管理员

1. **访问后台**：
   - 点击"管理员后台"链接
   - 使用管理员账户登录

2. **系统管理**：
   - 查看系统统计信息
   - 管理用户账户
   - 查看所有记录（包括已删除的）
   - 添加其他管理员

## 数据库结构

### 用户表 (users)
- id: 用户ID
- username: 用户名
- email: 邮箱
- password: 加密密码
- api_key: API密钥
- created_at: 创建时间

### 分析表 (analyses)
- id: 分析ID
- user_id: 用户ID
- content: 分析内容
- context: 上下文
- analysis_type: 分析类型
- strictness: 严格程度
- suspicion_score: 可疑度评分
- summary: 分析摘要
- issues: 检测到的问题 (JSON)
- strengths: 优点 (JSON)
- overall_rating: 总体评级
- tags: 标签 (JSON)
- is_public: 是否公开 (0=私有, 1=公开)
- deleted_by_user: 是否被用户删除 (0=未删除, 1=已删除)
- created_at: 创建时间

### 总结表 (summaries)
- id: 总结ID
- user_id: 用户ID
- title: 标题
- content: 内容
- analysis_ids: 关联的分析ID数组 (JSON)
- is_public: 是否公开 (0=私有, 1=公开)
- deleted_by_user: 是否被用户删除 (0=未删除, 1=已删除)
- created_at: 创建时间

### 管理员表 (admins)
- id: 管理员ID
- user_id: 用户ID
- role: 角色
- created_at: 创建时间

## 故障排除

### 1. 数据库错误

如果遇到数据库相关错误，检查：

```bash
ls -la database.sqlite
chmod 666 database.sqlite
```

### 2. 端口占用

如果端口 3000 被占用：

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### 3. 依赖安装问题

如果依赖安装失败，尝试：

```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### 4. API 请求失败

如果 API 请求失败，检查：

- JWT_SECRET 是否正确设置
- 数据库文件权限
- 网络连接和防火墙设置

## 更新指南

1. **备份数据**：
   ```bash
   cp database.sqlite database.sqlite.backup
   ```

2. **更新代码**：
   ```bash
   git pull origin main  # 如果使用Git
   # 或手动上传新文件
   ```

3. **安装新依赖**：
   ```bash
   npm install
   ```

4. **重启应用**：
   ```bash
   pm2 restart ai-analyzer
   ```

---

如有其他问题，请检查服务器日志：

```bash
pm2 logs ai-analyzer
```