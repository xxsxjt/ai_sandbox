// ==================== AI 模拟箱 - 公共模块 ====================
// 提供模型列表、随机选择、云端备用等通用功能
// 所有子模块引用此文件以共享代码

// ==================== 云端备用 API 配置 ====================
// 用户的云端 Ollama 兼容服务器配置
const CLOUD_FALLBACK_CONFIG = {
    enabled: true,
    // 用户自己的云端服务器地址（Ollama 兼容）
    baseURL: 'https://your-ollama-cloud.com',
    apiKey: 'ollama',
    // 云端可用的模型列表
    fallbackModels: [
        'llama3.1:latest',
        'qwen3:8b',
        'deepseek-r1:8b',
        'gemma3:12b'
    ],
    currentModelIndex: 0,

    getModel: function() {
        return this.fallbackModels[this.currentModelIndex];
    },

    nextModel: function() {
        this.currentModelIndex = (this.currentModelIndex + 1) % this.fallbackModels.length;
        return this.getModel();
    },

    reset: function() {
        this.currentModelIndex = 0;
    },

    // 设置云端服务器配置
    configure: function(baseURL, apiKey, models) {
        if (baseURL) this.baseURL = baseURL;
        if (apiKey) this.apiKey = apiKey;
        if (models && models.length > 0) this.fallbackModels = models;
        this.reset();
    }
};

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

    // 便捷方法：获取带 /v1 后缀的 endpoint
    getEndpointV1: function() {
        let ep = this.getEndpoint();
        return ep.endsWith('/v1') ? ep : ep.replace(/\/$/, '') + '/v1';
    }
};

// ==================== 模型列表 ====================
// 本地模型
const LOCAL_MODELS = [
    'qwen3.5:latest',
    'deepseek-r1:8b',
    'granite4:latest',
    'ministral-3:8b',
    'olmo-3:latest',
    'rnj-1:latest',
    'openchat:latest',
    'gemma3:12b',
    'qwen3:8b',
    'llama3.1:latest'
];

// 云端模型
const CLOUD_MODELS = [
    'minimax-m2.7:cloud',
    'qwen3-coder-next:cloud',
    'cogito-2.1:671b-cloud',
    'mistral-large-3:675b-cloud',
    'devstral-2:123b-cloud',
    'deepseek-v3.2:cloud',
    'deepseek-v3.1:671b-cloud',
    'gpt-oss:120b-cloud',
    'nemotron-3-nano:30b-cloud',
    'qwen3.5:397b-cloud',
    'ministral-3:14b-cloud',
    'kimi-k2.5:cloud',
    'glm-5:cloud'
];

// 全部模型
const AVAILABLE_MODELS = [...LOCAL_MODELS, ...CLOUD_MODELS];

// ==================== 动态填充模型下拉框 ====================
function populateModelSelect(selectElement, includeRandomRound = false, defaultModel) {
    selectElement.innerHTML = '';

    // 随机选项组
    const randomGroup = document.createElement('optgroup');
    randomGroup.label = '全部模型';
    [
        ['__random_all__', '🔀 随机(全部)'],
        ['__random_local__', '🏠 随机(本地)'],
        ['__random_cloud__', '☁️ 随机(云端)']
    ].forEach(([val, text]) => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        randomGroup.appendChild(opt);
    });
    if (includeRandomRound) {
        const opt = document.createElement('option');
        opt.value = '__random_round__';
        opt.textContent = '🎲 每轮随机(全部)';
        randomGroup.appendChild(opt);
    }
    selectElement.appendChild(randomGroup);

    // 本地模型组
    const localGroup = document.createElement('optgroup');
    localGroup.label = '本地模型';
    LOCAL_MODELS.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        localGroup.appendChild(opt);
    });
    selectElement.appendChild(localGroup);

    // 云端模型组
    const cloudGroup = document.createElement('optgroup');
    cloudGroup.label = '云端模型';
    CLOUD_MODELS.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        cloudGroup.appendChild(opt);
    });
    selectElement.appendChild(cloudGroup);

    // 设置默认选中
    if (defaultModel) {
        selectElement.value = defaultModel;
    }
}

// ==================== 随机模型选择 ====================
function getRandomModel() {
    return AVAILABLE_MODELS[Math.floor(Math.random() * AVAILABLE_MODELS.length)];
}

function getRandomLocalModel() {
    return LOCAL_MODELS[Math.floor(Math.random() * LOCAL_MODELS.length)];
}

function getRandomCloudModel() {
    return CLOUD_MODELS[Math.floor(Math.random() * CLOUD_MODELS.length)];
}

function resolveModel(model) {
    if (model === '__random__' || model === '__random_all__') {
        return getRandomModel();
    } else if (model === '__random_local__') {
        return getRandomLocalModel();
    } else if (model === '__random_cloud__') {
        return getRandomCloudModel();
    } else if (model === '__random_round__') {
        return getRandomModel();
    }
    return model;
}

function getDisplayModel(originalModel, actualModel) {
    if (originalModel === '__random__' || originalModel === '__random_all__') {
        return `随机(${actualModel})`;
    } else if (originalModel === '__random_local__') {
        return `随机本地(${actualModel})`;
    } else if (originalModel === '__random_cloud__') {
        return `随机云端(${actualModel})`;
    } else if (originalModel === '__random_round__') {
        return `每轮随机(${actualModel})`;
    }
    return actualModel;
}

// ==================== 云端备用 API 调用 ====================
// 内部实现 - 使用 CloudBase 云函数调用 Ollama
async function callCloudFallbackAPI_Impl(prompt, maxTokens = 500) {
    // 尝试使用 CloudBase SDK 调用云函数
    if (typeof cloudbase !== 'undefined') {
        try {
            const result = await cloudbase.callFunction({
                name: 'ollama-proxy',
                data: {
                    prompt: prompt,
                    model: 'deepseek-v3.2',
                    maxTokens: maxTokens
                }
            });

            if (result.result.success) {
                return result.result.content;
            } else {
                throw new Error(result.result.error);
            }
        } catch (error) {
            console.warn('云函数调用失败:', error.message);
            throw new Error('云端备用API失败: ' + error.message);
        }
    }

    // 如果没有 CloudBase SDK，使用 HTTP 代理（需要先开启 HTTP 服务）
    const CLOUD_FUNCTION_URL = 'https://xxjt-4gq22f9f00e67368.service.tcloudbase.com/proxy';
    
    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                model: 'deepseek-v3.2',
                maxTokens: maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`云端API失败: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            return data.content;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        throw new Error('云端备用API失败: ' + error.message);
    }
}

// 公开接口
async function callCloudFallbackAPI(prompt, maxTokens = 500, model = null) {
    return await callCloudFallbackAPI_Impl(prompt, maxTokens);
}

// ==================== 通用 API 调用 ====================
// 通用的 Ollama API 调用函数，支持本地和云端备用
async function callOllamaAPI(endpoint, apiKey, model, prompt, maxTokens = 500, useCloudFallback = true) {
    // 尝试本地 Ollama
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
        return data.choices[0].message.content;
    } catch (localError) {
        // 本地 Ollama 失败，检查是否启用云端备用
        if (!useCloudFallback || !CLOUD_FALLBACK_CONFIG.enabled) {
            throw localError;
        }

        console.warn('本地Ollama不可用，尝试使用云端备用API...');
        return await callCloudFallbackAPI(prompt, maxTokens);
    }
}

// ==================== 增强版 API 调用 ====================
async function callAPI({ endpoint, apiKey, model, messages, maxTokens = 500, timeout = 120000, stream = false, useCloudFallback = true }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const url = (endpoint || AppSettings.getEndpointV1()) + '/chat/completions';
    const key = apiKey || AppSettings.getApiKey();

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
        return data.choices[0].message.content;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('API请求超时，请检查Ollama是否运行');
        }

        if (!useCloudFallback || !CLOUD_FALLBACK_CONFIG.enabled) {
            throw error;
        }

        console.warn('本地API不可用，尝试云端备用...');
        // Extract prompt from messages for fallback
        const prompt = Array.isArray(messages) && messages.length > 0
            ? messages.map(m => m.content).join('\n')
            : '';
        return await callCloudFallbackAPI(prompt, maxTokens);
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
