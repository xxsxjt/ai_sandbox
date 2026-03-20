#!/bin/bash

# AI内容分析工具部署脚本
# 适用于Ubuntu/CentOS等Linux系统

echo "=== AI内容分析工具部署脚本 ==="
echo "开始部署..."

# 检查Node.js是否已安装
if ! command -v node &> /dev/null; then
    echo "Node.js未安装，正在安装..."
    
    # 检测系统类型
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu系统
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL系统
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "无法检测系统类型，请手动安装Node.js 18+"
        exit 1
    fi
    
    echo "Node.js安装完成"
fi

# 检查npm是否已安装
if ! command -v npm &> /dev/null; then
    echo "npm未安装，正在安装..."
    sudo apt-get install -y npm || sudo yum install -y npm
    echo "npm安装完成"
fi

# 创建应用目录
APP_DIR="/opt/ai-analyzer"
echo "创建应用目录: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 复制文件到应用目录
echo "复制应用文件..."
cp -r . $APP_DIR/
cd $APP_DIR

# 安装依赖
echo "安装Node.js依赖..."
npm install --production

# 创建环境变量文件
if [ ! -f .env ]; then
    echo "创建环境变量文件..."
    cp .env.example .env
    
    # 生成随机JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-secret-key-change-in-production/$JWT_SECRET/" .env
    
    echo "已生成随机JWT密钥，请根据需要修改.env文件中的其他配置"
fi

# 设置PM2进程管理器（可选）
if command -v pm2 &> /dev/null; then
    echo "PM2已安装，使用PM2启动应用..."
    pm2 start server.js --name "ai-analyzer"
    pm2 save
    echo "应用已启动，使用 'pm2 logs ai-analyzer' 查看日志"
else
    echo "PM2未安装，正在安装..."
    npm install -g pm2
    
    echo "使用PM2启动应用..."
    pm2 start server.js --name "ai-analyzer"
    pm2 save
    
    echo "PM2安装完成，应用已启动"
    echo "使用 'pm2 logs ai-analyzer' 查看日志"
    echo "使用 'pm2 restart ai-analyzer' 重启应用"
    echo "使用 'pm2 stop ai-analyzer' 停止应用"
fi

# 设置Nginx反向代理（可选）
read -p "是否设置Nginx反向代理? (y/n): " setup_nginx
if [ "$setup_nginx" = "y" ]; then
    echo "设置Nginx反向代理..."
    
    # 检查Nginx是否已安装
    if ! command -v nginx &> /dev/null; then
        echo "Nginx未安装，正在安装..."
        sudo apt-get update && sudo apt-get install -y nginx || sudo yum install -y nginx
    fi
    
    # 创建Nginx配置文件
    DOMAIN="localhost"
    read -p "请输入域名 (默认: localhost): " input_domain
    if [ -n "$input_domain" ]; then
        DOMAIN="$input_domain"
    fi
    
    # 生成SSL证书（Let's Encrypt）
    read -p "是否设置SSL证书? (需要域名和公网IP) (y/n): " setup_ssl
    if [ "$setup_ssl" = "y" ] && [ "$DOMAIN" != "localhost" ]; then
        sudo apt-get install -y certbot python3-certbot-nginx || sudo yum install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    fi
    
    # 创建Nginx配置
    sudo tee /etc/nginx/sites-available/ai-analyzer > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # 启用站点
    if [ -d /etc/nginx/sites-enabled ]; then
        sudo ln -sf /etc/nginx/sites-available/ai-analyzer /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
    fi
    
    # 测试并重载Nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "Nginx配置完成"
    echo "应用可通过 http://$DOMAIN 访问"
    
    if [ "$setup_ssl" = "y" ] && [ "$DOMAIN" != "localhost" ]; then
        echo "SSL证书已配置，应用可通过 https://$DOMAIN 访问"
    fi
fi

# 设置防火墙（可选）
read -p "是否配置防火墙? (y/n): " setup_firewall
if [ "$setup_firewall" = "y" ]; then
    echo "配置防火墙..."
    
    # 检查防火墙工具
    if command -v ufw &> /dev/null; then
        # Ubuntu UFW
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        echo "y" | sudo ufw enable
        echo "UFW防火墙已配置"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld
        sudo systemctl enable firewalld
        sudo systemctl start firewalld
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        echo "Firewalld防火墙已配置"
    else
        echo "未找到支持的防火墙工具，请手动配置"
    fi
fi

# 设置自动启动
read -p "是否设置应用开机自启? (y/n): " setup_autostart
if [ "$setup_autostart" = "y" ]; then
    echo "设置应用开机自启..."
    
    # 创建systemd服务文件
    sudo tee /etc/systemd/system/ai-analyzer.service > /dev/null <<EOF
[Unit]
Description=AI Content Analyzer
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # 启用并启动服务
    sudo systemctl daemon-reload
    sudo systemctl enable ai-analyzer.service
    sudo systemctl start ai-analyzer.service
    
    echo "开机自启已设置"
    echo "应用已在后台运行"
    echo "使用 'sudo systemctl status ai-analyzer' 查看服务状态"
    echo "使用 'sudo journalctl -u ai-analyzer' 查看日志"
fi

echo ""
echo "=== 部署完成 ==="
echo "应用已成功部署并启动"
echo "默认端口: 3000"

if [ "$setup_nginx" = "y" ]; then
    if [ "$setup_ssl" = "y" ] && [ "$DOMAIN" != "localhost" ]; then
        echo "访问地址: https://$DOMAIN"
    else
        echo "访问地址: http://$DOMAIN"
    fi
else
    echo "本地访问地址: http://localhost:3000"
fi

echo ""
echo "常用命令:"
echo "- 查看应用状态: pm2 status ai-analyzer"
echo "- 查看日志: pm2 logs ai-analyzer"
echo "- 重启应用: pm2 restart ai-analyzer"
echo "- 停止应用: pm2 stop ai-analyzer"
echo ""
echo "如需修改配置，请编辑: $APP_DIR/.env"
echo "如需修改应用，请编辑: $APP_DIR/server.js"
echo ""