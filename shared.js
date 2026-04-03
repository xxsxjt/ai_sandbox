// ==================== AI 模拟箱 - 公共模块 ====================
// 提供模型列表、随机选择、设置管理等通用功能
// 所有子模块引用此文件以共享代码

// ==================== 统一设置管理 ====================
const AppSettings = {
    _defaults: {
        apiEndpoint: 'http://localhost:11434',
        apiKey: 'ollama',
        defaultModel: 'qwen3:8b'
    },

    get: function(key) {
        return localStorage.getItem('sandbox_' + key) || this._defaults[key];
    },

    set: function(key, value) {
        localStorage.setItem('sandbox_' + key, value);
    },

    getEndpoint: function() {
        return this.get('apiEndpoint');
    },

    getApiKey: function() {
        return this.get('apiKey');
    },

    getDefaultModel: function() {
        return this.get('defaultModel');
    },

    getEndpointV1: function() {
        let ep = this.getEndpoint();
        return ep.endsWith('/v1') ? ep : ep.replace(/\/$/, '') + '/v1';
    }
};

// ==================== API 调用日志 ====================
const APILogger = {
    _KEY: 'sandbox_api_logs',
    _MAX: 300,

    log({ source, model, endpoint, prompt, response, reasoning, maxTokens, duration, success, error }) {
        try {
            const logs = this.getAll();
            logs.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                time: new Date().toLocaleString(),
                source: source || 'unknown',
                model: model || '',
                endpoint: (endpoint || '').replace(/\/v1\/chat\/completions$/, ''),
                prompt: (prompt || '').substring(0, 500),
                response: (response || '').substring(0, 1000),
                reasoning: (reasoning || '').substring(0, 1000),
                maxTokens: maxTokens || 0,
                duration: Math.round(duration || 0),
                success: success !== false,
                error: (error || '').substring(0, 200)
            });
            while (logs.length > this._MAX) logs.shift();
            localStorage.setItem(this._KEY, JSON.stringify(logs));
        } catch (e) {
            // 存储满，尝试裁剪
            try { localStorage.setItem(this._KEY, JSON.stringify(this.getAll().slice(-100))); } catch (e2) {}
        }
    },

    getAll() {
        try { return JSON.parse(localStorage.getItem(this._KEY)) || []; }
        catch (e) { return []; }
    },

    getStats() {
        const stats = {};
        this.getAll().forEach(log => {
            if (!stats[log.source]) stats[log.source] = { total: 0, success: 0, failed: 0 };
            stats[log.source].total++;
            log.success ? stats[log.source].success++ : stats[log.source].failed++;
        });
        return stats;
    },

    clear() {
        localStorage.removeItem(this._KEY);
    }
};

// ==================== 最近使用模块 ====================
const RecentModule = {
    _KEY: 'sandbox_recent_module',

    record(name) {
        localStorage.setItem(this._KEY, name);
    },

    get() {
        return localStorage.getItem(this._KEY) || '';
    }
};

// 各模块页面加载时自动记录
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const modules = { 'chat': '对话模拟', 'werewolf': '狼人杀', 'battle': '战斗模拟', 'divination': '混沌玄卜', 'analyzer': 'AI分析工具', 'textgame': 'AI文字游戏' };
    for (const [dir, name] of Object.entries(modules)) {
        if (path.includes('/' + dir + '/')) { RecentModule.record(name); break; }
    }
});

// ==================== 默认模型列表 ====================
const DEFAULT_MODELS = [
    'qwen3.5:latest',
    'qwen3.5:397b-cloud',
    'deepseek-r1:8b',
    'deepseek-v3.2:cloud',
    'deepseek-v3.1:671b-cloud',
    'granite4:latest',
    'minimax-m2.7:cloud',
    'minimax-m2.5:cloud',
    'qwen3-coder-next:cloud',
    'cogito-2.1:671b-cloud',
    'mistral-large-3:675b-cloud',
    'devstral-2:123b-cloud',
    'gpt-oss:120b-cloud',
    'nemotron-3-nano:30b-cloud',
    'ministral-3:8b',
    'ministral-3:14b-cloud',
    'olmo-3:latest',
    'rnj-1:latest',
    'openchat:latest',
    'gemma3:12b',
    'qwen3:8b',
    'llama3.1:latest',
    'kimi-k2.5:cloud',
    'glm-5:cloud'
];

// ==================== 模型列表管理 ====================
const ModelManager = {
    _KEY: 'sandbox_custom_models',

    getActiveModels() {
        const custom = this.getCustomModels();
        return custom.length > 0 ? custom : DEFAULT_MODELS;
    },

    getCustomModels() {
        try { return JSON.parse(localStorage.getItem(this._KEY)) || []; }
        catch (e) { return []; }
    },

    setCustomModels(models) {
        localStorage.setItem(this._KEY, JSON.stringify(models.filter(m => m.trim())));
    },

    reset() {
        localStorage.removeItem(this._KEY);
    }
};

// 向后兼容
const AVAILABLE_MODELS = DEFAULT_MODELS;

// ==================== 动态填充模型下拉框 ====================
function populateModelSelect(selectElement, includeRandomRound = false, defaultModel) {
    selectElement.innerHTML = '';
    const models = ModelManager.getActiveModels();

    const randomGroup = document.createElement('optgroup');
    randomGroup.label = '随机';
    [
        ['__random_all__', '🔀 随机模型'],
        ['__random_round__', '🎲 每轮随机']
    ].forEach(([val, text]) => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        randomGroup.appendChild(opt);
    });
    selectElement.appendChild(randomGroup);

    const modelGroup = document.createElement('optgroup');
    modelGroup.label = '可用模型';
    models.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelGroup.appendChild(opt);
    });
    selectElement.appendChild(modelGroup);

    if (defaultModel) selectElement.value = defaultModel;
}

// ==================== 随机模型选择 ====================
function getRandomModel() {
    const models = ModelManager.getActiveModels();
    return models[Math.floor(Math.random() * models.length)];
}

function resolveModel(model) {
    if (model === '__random__' || model === '__random_all__' || model === '__random_round__') {
        return getRandomModel();
    }
    return model;
}

function getDisplayModel(originalModel, actualModel) {
    if (originalModel === '__random__' || originalModel === '__random_all__' || originalModel === '__random_round__') {
        return `随机(${actualModel})`;
    }
    return actualModel;
}

// ==================== 通用 API 调用 ====================
async function callOllamaAPI(endpoint, apiKey, model, prompt, maxTokens = 500) {
    const startTime = Date.now();
    try {
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API调用失败: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const msg = data.choices?.[0]?.message || {};
        const result = msg.content || msg.reasoning || '';
        APILogger.log({ source: 'global', model, endpoint, prompt, response: result, reasoning: msg.reasoning || '', maxTokens, duration: Date.now() - startTime, success: true });
        return result;
    } catch (error) {
        APILogger.log({ source: 'global', model, endpoint, prompt, maxTokens, duration: Date.now() - startTime, success: false, error: error.message });
        throw error;
    }
}

// ==================== 增强版 API 调用 ====================
async function callAPI({ endpoint, apiKey, model, messages, maxTokens = 500, timeout = 120000, stream = false, source = 'global' }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const url = (endpoint || AppSettings.getEndpointV1()) + '/chat/completions';
    const key = apiKey || AppSettings.getApiKey();
    const promptText = Array.isArray(messages) ? messages.map(m => m.content).join('\n') : '';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages || [{ role: 'user', content: '' }],
                stream: stream,
                max_tokens: maxTokens
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`API调用失败: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const msg = data.choices?.[0]?.message || {};
        const result = msg.content || msg.reasoning || '';
        APILogger.log({ source, model, endpoint: url, prompt: promptText, response: result, reasoning: msg.reasoning || '', maxTokens, duration: 0, success: true });
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        APILogger.log({ source, model, endpoint: url, prompt: promptText, maxTokens, duration: 0, success: false, error: error.message });
        if (error.name === 'AbortError') {
            throw new Error('API请求超时，请检查API是否运行');
        }
        throw error;
    }
}

// ==================== 工具函数 ====================
// HTML 转义
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 更安全的HTML转义，处理null/undefined
function safeHtml(text) {
    if (text == null) return '';
    return escapeHtml(String(text));
}

// ==================== UI辅助工具函数 ====================

// 创建和显示Toast提示
function showToast(message, type = 'info', duration = 3000) {
    if (window.UIEnhancements && window.UIEnhancements.Toast) {
        const toast = new UIEnhancements.Toast();
        toast.show(message, type, duration);
    } else {
        // 如果UI增强未加载，使用简单的alert
        alert(message);
    }
}

// 显示加载动画
function showLoading(element = document.body, message = '加载中...') {
    if (window.UIEnhancements && window.UIEnhancements.Loading) {
        const loading = new UIEnhancements.Loading();
        loading.show(message);
        return loading;
    } else {
        // 简单的加载提示
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 1000;
        `;
        loadingDiv.textContent = message;
        document.body.appendChild(loadingDiv);
        return { hide: () => loadingDiv.remove() };
    }
}

// 创建模态框
function createModal(options = {}) {
    if (window.UIEnhancements && window.UIEnhancements.Modal) {
        return new UIEnhancements.Modal(options);
    } else {
        // 简单的模态框实现
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return {
            show: () => {},
            close: () => modal.remove(),
            setHeader: (title) => {
                const header = document.createElement('h2');
                header.textContent = title;
                content.insertBefore(header, content.firstChild);
            },
            setBody: (html) => {
                content.innerHTML = html;
            },
            setFooter: (html) => {
                const footer = document.createElement('div');
                footer.innerHTML = html;
                content.appendChild(footer);
            }
        };
    }
}

// 格式化时间
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 深拷贝对象
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

// 防抖函数
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// 节流函数
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}
