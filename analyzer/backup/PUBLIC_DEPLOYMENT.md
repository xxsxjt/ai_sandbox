# 公开部署指南（无赞助版本）

## 🔍 前置检查

### 1. API服务确认
在公开部署前，请务必：
- 登录算力平台控制台确认API使用条款
- 检查是否有公开部署限制
- 了解免费额度和收费政策
- 确认是否需要添加网站域名到白名单

### 2. 技术限制评估
- 预估用户量和API调用频率
- 检查并发限制和速率限制
- 准备应对API额度耗尽的方案

## 🚀 部署方案

### 方案一：静态网站部署（推荐）

#### GitHub Pages部署
```bash
# 1. 创建GitHub仓库
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/您的用户名/您的仓库名.git
git push -u origin main

# 2. 在GitHub仓库设置中启用Pages
# Settings > Pages > Source > Deploy from a branch > main
```

#### Netlify部署
1. 访问 [netlify.com](https://netlify.com)
2. 连接GitHub仓库
3. 部署设置保持默认
4. 获得公开URL

### 方案二：用户自备API密钥

为了解决API额度问题，建议让用户自己配置API密钥：

```javascript
// 修改后的API配置逻辑
function callOpenAI(prompt) {
    // 使用用户自己的API密钥
    const userApiKey = localStorage.getItem('userApiKey') || '';
    
    if (!userApiKey) {
        showMessage('请先在设置中配置您的API密钥', 'error');
        switchTab('settings');
        return Promise.reject(new Error('未配置API密钥'));
    }
    
    return fetch(`${AppState.settings.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey}`
        },
        body: JSON.stringify({
            model: AppState.settings.apiModel,
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的内容分析专家...'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2
        })
    });
}
```

## 🛡️ 安全措施

### 1. API密钥保护
- 不要在代码中硬编码API密钥
- 实施用户自备API密钥机制
- 添加API密钥验证和错误处理

### 2. 使用限制
```javascript
// 添加本地使用限制
const usageLimit = {
    dailyLimit: 50,  // 每日限制50次
    userUsage: {},    // 记录用户使用情况
    
    checkLimit: function(userId) {
        const today = new Date().toDateString();
        if (!this.userUsage[userId]) {
            this.userUsage[userId] = { date: today, count: 0 };
        }
        
        if (this.userUsage[userId].date !== today) {
            this.userUsage[userId] = { date: today, count: 0 };
        }
        
        return this.userUsage[userId].count < this.dailyLimit;
    },
    
    incrementUsage: function(userId) {
        if (this.userUsage[userId]) {
            this.userUsage[userId].count++;
        }
    }
};

// 在API调用前检查限制
if (!usageLimit.checkLimit(userId)) {
    showMessage('今日使用次数已达上限，请明天再试', 'error');
    return;
}
```

## 📊 监控和分析

### 1. 使用统计
```javascript
// 添加使用统计功能
const analytics = {
    trackUsage: function(apiCall, success, error) {
        const data = {
            timestamp: new Date().toISOString(),
            success: success,
            error: error ? error.message : null
        };
        
        // 存储到本地
        const stats = JSON.parse(localStorage.getItem('usageStats') || '[]');
        stats.push(data);
        localStorage.setItem('usageStats', JSON.stringify(stats));
    },
    
    getStats: function() {
        return JSON.parse(localStorage.getItem('usageStats') || '[]');
    }
};
```

### 2. 错误监控
```javascript
// 添加错误监控
function monitorErrors(error, context) {
    console.error(`[${context}] Error:`, error);
    
    // 可以选择发送到日志服务（如果有的话）
    // logErrorToService(error, context);
}
```

## 📝 用户说明

### 添加使用说明页面
```html
<!-- 在index.html中添加使用说明标签页 -->
<div class="tab-content" id="usage">
    <section class="usage-section">
        <h2>使用说明</h2>
        <div class="usage-info">
            <h3>🔑 API配置</h3>
            <p>本工具需要您自行配置API密钥才能使用：</p>
            <ol>
                <li>访问 <a href="https://console.suanli.cn" target="_blank">算力平台控制台</a></li>
                <li>注册账号并获取API密钥</li>
                <li>在设置页面中输入您的API密钥</li>
            </ol>
            
            <h3>⚠️ 使用限制</h3>
            <ul>
                <li>每日使用次数限制：50次</li>
                <li>API调用频率受平台限制</li>
                <li>请合理使用，避免浪费API额度</li>
            </ul>
            
            <h3>🔒 隐私保护</h3>
            <p>您的API密钥和输入内容仅存储在本地浏览器中，不会上传到任何服务器。</p>
        </div>
    </section>
</div>
```

## 🔄 维护建议

1. **定期检查API政策**：
   - 订阅算力平台的公告
   - 定期检查API文档更新
   - 关注价格和限制变化

2. **用户支持**：
   - 提供详细的使用说明
   - 创建常见问题解答(FAQ)
   - 建立用户反馈渠道

3. **持续改进**：
   - 收集用户反馈
   - 优化用户体验
   - 添加新的分析功能

## 📈 扩展计划

如果项目受到欢迎，可以考虑：

1. **多API提供商支持**：
   ```javascript
   // 支持多个API提供商
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

2. **功能增强**：
   - 添加更多分析类型
   - 优化UI/UX设计
   - 增加数据可视化功能

## 📞 支持

- GitHub Issues: [项目地址]/issues
- 邮箱: [您的邮箱地址]

---

**注意**：本指南基于当前信息编写，请在部署前再次确认API服务的最新条款。