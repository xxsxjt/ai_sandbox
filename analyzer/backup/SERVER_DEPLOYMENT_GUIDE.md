# 服务器部署指南

## 🚀 快速开始

### 方法一：自动部署脚本（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd ai-content-analyzer

# 2. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

脚本将自动完成以下操作：
- 安装Node.js和npm
- 安装应用依赖
- 配置环境变量
- 设置进程管理器(PM2)
- 可选：配置Nginx反向代理
- 可选：设置SSL证书
- 可选：配置防火墙
- 可选：设置开机自启

### 方法二：手动部署

#### 1. 服务器要求

- **操作系统**: Ubuntu 18.04+, CentOS 7+, Debian 9+
- **内存**: 至少 512MB RAM
- **存储**: 至少 1GB 可用空间
- **网络**: 稳定的互联网连接

#### 2. 安装Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 3. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /opt/ai-analyzer
sudo chown $USER:$USER /opt/ai-analyzer
cd /opt/ai-analyzer

# 复制应用文件
cp -r /path/to/your/project/* .

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置文件

# 启动应用
npm start
```

## ⚙️ 配置说明

### 环境变量 (.env)

```bash
# 服务器配置
PORT=3000

# JWT密钥 (生产环境请使用强密码)
JWT_SECRET=your-very-secure-secret-key-here

# 数据库文件路径
DB_PATH=./database.sqlite

# API配置
DEFAULT_API_ENDPOINT=https://api.suanli.cn/v1
DEFAULT_API_MODEL=zai-org/GLM-4.5
```

### 安全建议

1. **JWT密钥**:
   - 使用至少32位的随机字符串
   - 不要在代码中硬编码
   - 定期更换密钥

2. **数据库安全**:
   - 定期备份数据库文件
   - 设置适当的文件权限

3. **网络安全**:
   - 使用HTTPS加密传输
   - 配置防火墙限制访问
   - 定期更新系统依赖

## 🔧 高级配置

### Nginx反向代理配置

创建 `/etc/nginx/sites-available/ai-analyzer`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

启用站点:
```bash
sudo ln -s /etc/nginx/sites-available/ai-analyzer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL证书配置 (Let's Encrypt)

```bash
# 安装certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```

### 系统服务配置

创建systemd服务文件 `/etc/systemd/system/ai-analyzer.service`:

```ini
[Unit]
Description=AI Content Analyzer
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/ai-analyzer
ExecStart=/usr/bin/node /opt/ai-analyzer/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-analyzer.service
sudo systemctl start ai-analyzer.service
```

## 📊 监控和维护

### 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "ai-analyzer"

# 查看状态
pm2 status

# 查看日志
pm2 logs ai-analyzer

# 重启应用
pm2 restart ai-analyzer

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 日志管理

应用日志位置:
- PM2日志: `~/.pm2/logs/`
- 系统日志: `sudo journalctl -u ai-analyzer`

### 数据库备份

```bash
# 创建备份脚本
cat > backup.sh <<EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/ai-analyzer"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/ai-analyzer/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# 保留最近7天的备份
find $BACKUP_DIR -name "database_*.sqlite" -mtime +7 -delete
EOF

chmod +x backup.sh

# 设置定时备份
echo "0 2 * * * /opt/ai-analyzer/backup.sh" | sudo crontab -
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   sudo netstat -tulpn | grep :3000
   # 终止进程
   sudo kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R user:group /opt/ai-analyzer
   chmod +x /opt/ai-analyzer
   ```

3. **依赖问题**
   ```bash
   # 清理并重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **数据库问题**
   ```bash
   # 检查数据库文件权限
   ls -la database.sqlite
   # 如果需要，修复权限
   chmod 664 database.sqlite
   ```

### 性能优化

1. **Node.js调优**:
   ```bash
   # 设置环境变量
   export NODE_ENV=production
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

2. **Nginx优化**:
   ```nginx
   # 添加到nginx配置
   client_max_body_size 10M;
   proxy_read_timeout 300s;
   proxy_connect_timeout 75s;
   ```

## 📈 扩展和定制

### 添加新的API提供商

在`server.js`中的`/api/analyze`路由中添加新的配置:

```javascript
const apiProviders = {
    suanli: {
        endpoint: 'https://api.suanli.cn/v1',
        models: ['zai-org/GLM-4.5', 'Qwen/QwQ-32B']
    },
    openai: {
        endpoint: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo']
    }
};
```

### 数据库迁移

如需更换数据库，修改`server.js`中的数据库连接:

```javascript
// 从SQLite更换到PostgreSQL示例
const { Pool } = require('pg');

const pool = new Pool({
    user: 'your-user',
    host: 'localhost',
    database: 'ai-analyzer',
    password: 'your-password',
    port: 5432,
});
```

## 📞 支持

如遇到部署问题，请检查以下资源：

1. 应用日志: `pm2 logs ai-analyzer`
2. 系统日志: `sudo journalctl -u ai-analyzer`
3. Nginx日志: `sudo journalctl -u nginx`

---

**注意**: 首次部署后，请注册第一个管理员账号，并配置API密钥后才能正常使用分析功能。