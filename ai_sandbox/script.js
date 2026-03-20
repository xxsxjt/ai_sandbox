// ==================== 可用模型 ====================
// 本地模型
const LOCAL_MODELS = [
    'llama3.1:latest',
    'qwen3:8b',
    'deepseek-r1:8b',
    'gemma3:12b',
    'openchat:latest',
    'rnj-1:latest',
    'olmo-3:latest',
    'ministral-3:8b',
    'granite4:latest'
];

// 云端模型
const CLOUD_MODELS = [
    'deepseek-v3.1:671b-cloud',
    'deepseek-v3.2:cloud',
    'gpt-oss:120b-cloud',
    'minimax-m2.5:cloud',
    'cogito-2.1:671b-cloud',
    'mistral-large-3:675b-cloud',
    'devstral-2:123b-cloud',
    'nemotron-3-nano:30b-cloud',
    'qwen3.5:397b-cloud',
    'ministral-3:14b-cloud',
    'kimi-k2.5:cloud',
    'glm-5:cloud'
];

// 全部模型
const AVAILABLE_MODELS = [...LOCAL_MODELS, ...CLOUD_MODELS];

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
    if (model === '__random_all__') {
        return getRandomModel();
    } else if (model === '__random_local__') {
        return getRandomLocalModel();
    } else if (model === '__random_cloud__') {
        return getRandomCloudModel();
    } else if (model === '__random__') {
        return getRandomModel();
    } else if (model === '__random_round__') {
        return getRandomModel();
    }
    return model;
}

function getDisplayModel(originalModel, actualModel) {
    if (originalModel.startsWith('__random')) {
        const labels = {
            '__random_all__': '随机(全部)',
            '__random_local__': '随机(本地)',
            '__random_cloud__': '随机(云端)',
            '__random__': '随机',
            '__random_round__': '每轮随机'
        };
        return `${labels[originalModel] || '随机'}(${actualModel})`;
    }
    return actualModel;
}

// ==================== 状态管理 ====================
const state = {
    characters: [],
    messages: [],
    isRunning: false,
    isPaused: false,
    currentRound: 0,
    maxRounds: 10,
    intervalSeconds: 2,
    roundInterval: null,
    editingCharacterId: null,
    currentSpeakerIndex: 0,
    waitingForUser: false,
    aiKnowsModels: true,
    savedState: null  // 保存可恢复的状态
};

// ==================== DOM 元素 ====================
const elements = {
    // 角色相关
    charactersList: document.getElementById('characters-list'),
    addCharacterBtn: document.getElementById('add-character-btn'),
    characterModal: document.getElementById('character-modal'),
    characterForm: document.getElementById('character-form'),
    charName: document.getElementById('char-name'),
    charDescription: document.getElementById('char-description'),
    charModel: document.getElementById('char-model'),
    charCustomModel: document.getElementById('char-custom-model'),
    customModelGroup: document.getElementById('custom-model-group'),
    charEndpoint: document.getElementById('char-endpoint'),
    charApiKey: document.getElementById('char-api-key'),

    // 场景设置
    sceneBackground: document.getElementById('scene-background'),
    discussionTopic: document.getElementById('discussion-topic'),

    // 运行设置
    maxRounds: document.getElementById('max-rounds'),
    intervalSeconds: document.getElementById('interval-seconds'),
    waitUserTurn: document.getElementById('wait-user-turn'),
    showModelInfo: document.getElementById('show-model-info'),
    aiKnowsModels: document.getElementById('ai-knows-models'),

    // 控制按钮
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    stopSaveBtn: document.getElementById('stop-save-btn'),
    continueBtn: document.getElementById('continue-btn'),
    stopBtn: document.getElementById('stop-btn'),
    clearBtn: document.getElementById('clear-btn'),
    generateCharactersBtn: document.getElementById('generate-characters-btn'),
    generateCount: document.getElementById('generate-count'),
    generateModel: document.getElementById('generate-model'),
    savedStateIndicator: document.getElementById('saved-state-indicator'),

    // 对话区域
    chatMessages: document.getElementById('chat-messages'),
    userMsgInput: document.getElementById('user-msg-input'),
    sendUserMsgBtn: document.getElementById('send-user-msg-btn'),
    addUserMsgBtn: document.getElementById('add-user-msg-btn'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    clearBtn2: document.getElementById('clear-btn2'),
    importFile: document.getElementById('import-file'),

    // 用户消息模态框
    userMsgModal: document.getElementById('user-msg-modal'),
    userMessageContent: document.getElementById('user-message-content')
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadFromStorage();
    renderCharacters();
    renderMessages();
    updateNewControlButtons();

    // 检查URL参数，根据参数自动加载云模型
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'cloud') {
        // 云端模式 - 自动加载12个云端AI角色
        loadCloudModels();
    } else {
        // 检查是否有云模型配置需要加载（兼容性）
        loadCloudConfig();
    }

    // 检查是否有缓存的对话
    if (state.messages.length > 0) {
        const hasUnfinished = state.isRunning;
        if (hasUnfinished || confirm('检测到上次未完成的对话，是否继续？')) {
            if (state.isRunning) {
                elements.userMsgInput.disabled = false;
                elements.sendUserMsgBtn.disabled = false;
                updateControlButtons();
                startAutoSave();
                runRound();
            }
        } else {
            // 用户选择不继续，清除缓存的对话
            state.messages = [];
            saveToStorage();
            renderMessages();
        }
    }
});

// ==================== 云模型自动加载（内置，无需JSON文件）================
function loadCloudModels() {
    // 检查是否已经有角色
    if (state.characters.length > 0) {
        if (!confirm('检测到已有角色，是否清除并加载12个云端AI角色？')) {
            return;
        }
        state.characters = [];
    }
    
    // 云端模型配置（内置）
    const cloudCharacters = [
        {name: "DeepSeek-V3.1", description: "深度求索V3.1模型，擅长推理和编程", model: "deepseek-v3.1:671b-cloud"},
        {name: "DeepSeek-V3.2", description: "深度求索V3.2模型，全面升级版", model: "deepseek-v3.2:cloud"},
        {name: "GPT-OSS", description: "开源大模型GPT-OSS，120B参数", model: "gpt-oss:120b-cloud"},
        {name: "MiniMax-M2.5", description: "MiniMax M2.5模型，多模态能力强", model: "minimax-m2.5:cloud"},
        {name: "Cogito-2.1", description: "Cogito 2.1推理模型，671B参数", model: "cogito-2.1:671b-cloud"},
        {name: "Mistral-Large-3", description: "Mistral大型模型，675B参数", model: "mistral-large-3:675b-cloud"},
        {name: "Devstral-2", description: "开发者友好模型，123B参数", model: "devstral-2:123b-cloud"},
        {name: "Nemotron-3-Nano", description: "英伟达Nemotron模型，30B参数", model: "nemotron-3-nano:30b-cloud"},
        {name: "Qwen3.5", description: "阿里云千问3.5，397B参数", model: "qwen3.5:397b-cloud"},
        {name: "Ministral-3", description: "MistralMinistral系列，14B参数", model: "ministral-3:14b-cloud"},
        {name: "Kimi-K2.5", description: "月之暗面Kimi K2.5模型", model: "kimi-k2.5:cloud"},
        {name: "GLM-5", description: "智谱GLM-5模型", model: "glm-5:cloud"}
    ];
    
    // 添加默认配置
    const endpoint = 'http://localhost:11434/v1';
    const apiKey = 'ollama';
    
    cloudCharacters.forEach((char, index) => {
        char.id = (Date.now() + index).toString();
        char.customModel = '';
        char.endpoint = endpoint;
        char.apiKey = apiKey;
    });
    
    state.characters = cloudCharacters;
    saveToStorage();
    renderCharacters();
    updateControlButtons();
    
    console.log('已加载 ' + cloudCharacters.length + ' 个云端AI角色');
    alert('已自动加载12个云端AI角色！');
}

// ==================== 云模型配置加载 ====================
async function loadCloudConfig() {
    try {
        const response = await fetch('cloud_config.json');
        if (!response.ok) return;
        
        const config = await response.json();
        if (!config.autoLoadModels || !config.characters) return;
        
        // 检查是否已经有角色，避免重复加载
        if (state.characters.length > 0) {
            // 询问用户是否加载云模型配置
            if (!confirm('检测到云模型配置，是否加载12个云端AI角色？')) {
                return;
            }
            // 清除现有角色
            state.characters = [];
        }
        
        // 生成唯一ID
        config.characters.forEach(char => {
            char.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            char.customModel = '';
        });
        
        state.characters = config.characters;
        saveToStorage();
        renderCharacters();
        updateControlButtons();
        
        console.log('已加载 ' + config.characters.length + ' 个云端AI角色');
        
    } catch (e) {
        // 配置文件不存在或加载失败，静默处理
    }
}

// ==================== 事件监听 ====================
function initEventListeners() {
    // 添加角色
    elements.addCharacterBtn.addEventListener('click', () => openCharacterModal());

    // 表单提交
    elements.characterForm.addEventListener('submit', handleCharacterSubmit);

    // 模型选择
    elements.charModel.addEventListener('change', (e) => {
        elements.customModelGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // 控制按钮
    elements.startBtn.addEventListener('click', startSimulation);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.stopSaveBtn.addEventListener('click', stopAndSave);
    elements.continueBtn.addEventListener('click', continueSimulation);
    elements.stopBtn.addEventListener('click', stopSimulation);
    elements.clearBtn.addEventListener('click', clearAll);
    
    // 生成角色
    if (elements.generateCharactersBtn) {
        elements.generateCharactersBtn.addEventListener('click', generateMultipleCharacters);
    }

    // 用户消息
    elements.sendUserMsgBtn.addEventListener('click', sendUserMessage);
    elements.userMsgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });

    // 插入用户消息
    elements.addUserMsgBtn.addEventListener('click', () => {
        elements.userMsgModal.classList.add('show');
    });

    // 导出
    elements.exportBtn.addEventListener('click', exportConversation);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.clearBtn2.addEventListener('click', clearConversation);
    elements.importFile.addEventListener('change', importConversation);

    // 模态框关闭
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });
}

// ==================== 角色管理 ====================
function openCharacterModal(character = null) {
    state.editingCharacterId = character ? character.id : null;
    elements.characterModal.classList.add('show');

    if (character) {
        elements.charName.value = character.name;
        elements.charDescription.value = character.description;
        elements.charModel.value = character.model;
        elements.charCustomModel.value = character.customModel || '';
        elements.charEndpoint.value = character.endpoint;
        elements.charApiKey.value = character.apiKey;
        elements.customModelGroup.style.display = character.model === 'custom' ? 'block' : 'none';
    } else {
        elements.characterForm.reset();
        elements.charModel.value = 'qwen3:8b';
        elements.charEndpoint.value = 'http://localhost:11434/v1';
        elements.charApiKey.value = 'ollama';
        elements.customModelGroup.style.display = 'none';
    }
}

function handleCharacterSubmit(e) {
    e.preventDefault();

    const model = elements.charModel.value;
    const character = {
        id: state.editingCharacterId || Date.now().toString(),
        name: elements.charName.value.trim(),
        description: elements.charDescription.value.trim(),
        model: model,
        customModel: model === 'custom' ? elements.charCustomModel.value.trim() : '',
        endpoint: elements.charEndpoint.value.trim(),
        apiKey: elements.charApiKey.value.trim()
    };

    if (state.editingCharacterId) {
        const index = state.characters.findIndex(c => c.id === state.editingCharacterId);
        if (index !== -1) state.characters[index] = character;
    } else {
        state.characters.push(character);
    }

    saveToStorage();
    renderCharacters();
    closeAllModals();
    updateControlButtons();
}

function deleteCharacter(id) {
    state.characters = state.characters.filter(c => c.id !== id);
    saveToStorage();
    renderCharacters();
    updateControlButtons();
}

function moveCharacter(id, direction) {
    const index = state.characters.findIndex(c => c.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= state.characters.length) return;

    // 交换位置
    [state.characters[index], state.characters[newIndex]] = [state.characters[newIndex], state.characters[index]];
    saveToStorage();
    renderCharacters();
}

// ==================== 渲染角色列表 ====================
function renderCharacters() {
    if (state.characters.length === 0) {
        elements.charactersList.innerHTML = `
            <div class="empty-state" style="min-height: 100px; padding: 20px;">
                <p>暂无角色，点击"添加"创建AI角色</p>
            </div>
        `;
        return;
    }

    elements.charactersList.innerHTML = state.characters.map((char, index) => `
        <div class="character-card" data-id="${char.id}">
            <div class="char-name">
                <i class="fas fa-robot"></i>
                ${escapeHtml(char.name)}
                <span class="model-badge">${char.model === 'custom' ? char.customModel : char.model}</span>
            </div>
            <div class="char-desc">${escapeHtml(char.description)}</div>
            <div class="char-actions">
                <button class="char-action-btn move-up" onclick="moveCharacter('${char.id}', 'up')" title="上移" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="char-action-btn move-down" onclick="moveCharacter('${char.id}', 'down')" title="下移" ${index === state.characters.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="char-action-btn edit" onclick="openCharacterModal(getCharacterById('${char.id}'))" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="char-action-btn delete" onclick="deleteCharacter('${char.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getCharacterById(id) {
    return state.characters.find(c => c.id === id);
}

// ==================== 模拟控制 ====================
function updateControlButtons() {
    const hasCharacters = state.characters.length > 0;
    elements.startBtn.disabled = state.isRunning || !hasCharacters;
    elements.stopBtn.disabled = !state.isRunning;
    
    // 暂停按钮
    if (elements.pauseBtn) {
        if (!state.isRunning) {
            elements.pauseBtn.disabled = true;
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        } else if (state.isPaused) {
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        } else {
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }
}

function togglePause() {
    if (!state.isRunning) return;
    
    state.isPaused = !state.isPaused;
    
    if (state.isPaused) {
        // 暂停
        if (state.roundInterval) clearTimeout(state.roundInterval);
        addMessage({
            type: 'system',
            sender: '系统',
            text: '【模拟暂停】',
            time: new Date().toLocaleTimeString()
        });
    } else {
        // 继续
        addMessage({
            type: 'system',
            sender: '系统',
            text: '【模拟继续】',
            time: new Date().toLocaleTimeString()
        });
        runRound();
    }
    
    updateControlButtons();
}

function startSimulation() {
    if (state.characters.length === 0) {
        alert('请先添加至少一个AI角色');
        return;
    }

    state.isRunning = true;
    state.isPaused = false;
    state.currentRound = 0;
    state.currentSpeakerIndex = 0;
    state.waitingForUser = false;
    state.maxRounds = parseInt(elements.maxRounds.value) || 10;
    state.intervalSeconds = parseInt(elements.intervalSeconds.value) || 2;
    state.aiKnowsModels = elements.aiKnowsModels ? elements.aiKnowsModels.checked : false;

    // 启用用户输入
    elements.userMsgInput.disabled = false;
    elements.sendUserMsgBtn.disabled = false;
    elements.userMsgInput.placeholder = "输入用户消息...";
    elements.sendUserMsgBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';

    // 启动自动保存
    startAutoSave();

    updateControlButtons();

    // 添加系统消息
    const background = elements.sceneBackground.value.trim();
    const topic = elements.discussionTopic.value.trim();
    let systemPrompt = background ? `【场景背景】${background}` : '';
    if (topic) systemPrompt += `\n【讨论主题】${topic}`;

    if (systemPrompt && state.messages.length === 0) {
        addMessage({
            type: 'system',
            sender: '系统',
            text: systemPrompt,
            time: new Date().toLocaleTimeString()
        });
    }

    // 开始对话循环
    runRound();
}

function runRound() {
    if (!state.isRunning || state.currentRound >= state.maxRounds) {
        stopSimulation();
        return;
    }

    // 如果等待用户发言，且当前不是第一轮，则暂停
    if (elements.waitUserTurn.checked && state.currentRound > 0 && !state.waitingForUser) {
        // 让用户发言后再继续
        return;
    }

    state.currentRound++;
    // 按顺序轮流发言
    const character = state.characters[state.currentSpeakerIndex];
    state.currentSpeakerIndex = (state.currentSpeakerIndex + 1) % state.characters.length;
    generateAIResponse(character);
}

function generateAIResponse(character) {
    // 处理随机模型
    let actualModel = character.model;
    if (character.model === '__random__') {
        actualModel = getRandomModel();
    } else if (character.model === '__each_round__') {
        actualModel = getRandomModel();
    }

    // 添加加载消息
    const displayModel = getDisplayModel(character.model, actualModel);
    const loadingId = addMessage({
        type: 'ai',
        sender: character.name,
        model: displayModel,
        text: '正在思考...',
        time: new Date().toLocaleTimeString(),
        loading: true
    });

    // 构建提示词
    const prompt = buildPrompt(character);

    // 调用 API（使用实际模型）
    callOllamaAPI(character, prompt, actualModel)
        .then(response => {
            // 移除加载消息
            removeMessage(loadingId);
            // 添加实际响应
            addMessage({
                type: 'ai',
                sender: character.name,
                model: displayModel,
                text: response,
                time: new Date().toLocaleTimeString()
            });
        })
        .catch(error => {
            removeMessage(loadingId);
            addMessage({
                type: 'ai',
                sender: character.name,
                model: character.model,
                text: `错误: ${error.message}`,
                time: new Date().toLocaleTimeString()
            });
        })
        .finally(() => {
            if (!state.isRunning) return;

            // 检查是否需要等待用户发言
            if (elements.waitUserTurn.checked && state.currentRound > 0) {
                // 等待用户发言
                state.waitingForUser = true;
                elements.userMsgInput.placeholder = "请发言后按发送继续...";
                elements.sendUserMsgBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 继续';
                return;
            }

            state.roundInterval = setTimeout(runRound, state.intervalSeconds * 1000);
        });
}

function buildPrompt(character) {
    const background = elements.sceneBackground.value.trim();
    const topic = elements.discussionTopic.value.trim();
    
    // 重要提醒：场景设定大于角色设定
    let context = `【重要提醒】场景设定大于角色设定。角色设定只是你本身的性格特点，而场景设定才是你们需要共同参与的事情。\n\n`;
    
    // 场景背景（每次都要强调）
    if (background) {
        context += `【场景背景】（这是你们正在进行的事情，必须围绕这个场景进行对话）\n${background}\n\n`;
    }
    
    // 讨论主题（每次都要强调）
    if (topic) {
        context += `【讨论主题】（围绕这个主题展开讨论）\n${topic}\n\n`;
    }
    
    // 角色设定（只是个人性格）
    context += `【你的角色设定】\n你是: ${character.name}\n性格特点: ${character.description}\n注意：你的角色设定只是你个人的性格特征，不要脱离场景设定自顾自地说话。\n\n`;

    // 如果开启，AI能看到其他AI的模型信息
    if (state.aiKnowsModels) {
        const otherCharacters = state.characters.filter(c => c.id !== character.id).map(c => {
            let actualModel = c.model;
            if (c.model === '__random__' || c.model === '__each_round__') {
                actualModel = getRandomModel();
            }
            const displayModel = getDisplayModel(c.model, actualModel);
            return `${c.name}(${displayModel})`;
        });
        if (otherCharacters.length > 0) {
            context += `【其他参与者】${otherCharacters.join('、')}\n\n`;
        }
    }

    // 添加对话历史
    const historyMessages = state.messages.filter(msg => msg.type !== 'system' && msg.sender !== '系统');
    if (historyMessages.length > 0) {
        context += `【对话历史】\n`;
        historyMessages.forEach(msg => {
            context += `${msg.sender}: ${msg.text}\n`;
        });
        context += `\n`;
    }

    // 再次强调场景
    context += `【回复要求】\n`;
    context += `1. 必须围绕场景背景和讨论主题进行回应\n`;
    context += `2. 可以体现你的角色性格，但不要脱离场景\n`;
    context += `3. 与其他角色互动时，要针对他们说的话做出回应\n`;
    context += `4. 自然地参与讨论，不要总是重复自我介绍\n`;

    return context;
}

async function callOllamaAPI(character, prompt, forcedModel = null) {
    const model = forcedModel || (character.model === 'custom' ? character.customModel : character.model);

    const response = await fetch(`${character.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${character.apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function stopSimulation() {
    state.isRunning = false;
    state.isPaused = false;
    if (state.roundInterval) {
        clearTimeout(state.roundInterval);
        state.roundInterval = null;
    }

    // 停止自动保存
    stopAutoSave();

    // 禁用用户输入
    elements.userMsgInput.disabled = true;
    elements.sendUserMsgBtn.disabled = true;

    updateControlButtons();
}

function clearAll() {
    if (state.isRunning) {
        stopSimulation();
    }
    state.messages = [];
    renderMessages();
}

// ==================== 消息管理 ====================
function addMessage(message) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    state.messages.push({ id, ...message });
    renderMessages();
    scrollToBottom();
    saveToStorage();
    return id;
}

function removeMessage(id) {
    state.messages = state.messages.filter(m => m.id !== id);
    renderMessages();
    saveToStorage();
}

function renderMessages() {
    if (state.messages.length === 0) {
        elements.chatMessages.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>添加AI角色并设置场景后，点击"开始模拟"开始对话</p>
            </div>
        `;
        return;
    }

    elements.chatMessages.innerHTML = state.messages.map(msg => `
        <div class="message ${msg.type}-message ${msg.loading ? 'loading' : ''}" data-id="${msg.id}">
            <div class="message-avatar">
                <i class="fas ${msg.type === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-sender">
                    ${escapeHtml(msg.sender)}
                    ${msg.model && elements.showModelInfo.checked ? `<span class="model-tag">${msg.model}</span>` : ''}
                </div>
                <div class="message-text">${escapeHtml(msg.text)}</div>
                <div class="message-time">${msg.time}</div>
            </div>
        </div>
    `).join('');

    scrollToBottom();
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// ==================== 用户消息 ====================
function sendUserMessage() {
    const text = elements.userMsgInput.value.trim();
    if (!text) return;

    addMessage({
        type: 'user',
        sender: '用户',
        text: text,
        time: new Date().toLocaleTimeString()
    });

    elements.userMsgInput.value = '';

    // 如果正在等待用户发言，继续AI对话
    if (state.waitingForUser) {
        state.waitingForUser = false;
        elements.userMsgInput.placeholder = "输入用户消息...";
        elements.sendUserMsgBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        runRound();
    }
}

function insertUserMessage() {
    const content = elements.userMessageContent.value.trim();
    if (!content) return;

    addMessage({
        type: 'user',
        sender: '用户',
        text: content,
        time: new Date().toLocaleTimeString()
    });

    elements.userMessageContent.value = '';
    closeAllModals();
}

// ==================== 导出功能 ====================
function exportConversation() {
    if (state.messages.length === 0) {
        alert('没有可导出的对话内容');
        return;
    }

    const background = elements.sceneBackground.value.trim();
    const topic = elements.discussionTopic.value.trim();

    let content = '# AI模拟箱对话记录\n\n';

    // 添加角色列表
    if (state.characters.length > 0) {
        content += '## 角色列表\n';
        state.characters.forEach(char => {
            content += `- ${char.name} (模型: ${char.model})\n`;
        });
        content += '\n';
    }

    if (background) content += `## 场景背景\n${background}\n\n`;
    if (topic) content += `## 讨论主题\n${topic}\n\n`;
    content += '---\n\n';

    state.messages.forEach(msg => {
        const time = msg.time || '';
        let modelInfo = '';
        if (msg.model) modelInfo = ` [${msg.model}]`;
        content += `**${msg.sender}**${modelInfo} ${time ? `(${time})` : ''}\n${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai模拟对话_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearConversation() {
    if (state.isRunning) {
        stopSimulation();
    }
    if (confirm('确定要清空所有对话记录吗？')) {
        state.messages = [];
        saveToStorage();
        renderMessages();
    }
}

function importConversation(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        try {
            const lines = content.split('\n');
            let currentSender = '';
            let currentText = '';
            let currentModel = '';
            const importedMessages = [];

            lines.forEach(line => {
                const senderMatch = line.match(/^\*\*(.+?)\*\*(?:\[([^\]]+)\])?\s*(?:\(([^)]+)\))?$/);
                if (senderMatch) {
                    if (currentSender && currentText) {
                        importedMessages.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            type: currentSender === '系统' ? 'system' : 'ai',
                            sender: currentSender,
                            model: currentModel,
                            text: currentText.trim(),
                            time: ''
                        });
                    }
                    currentSender = senderMatch[1];
                    currentModel = senderMatch[2] || '';
                    currentText = '';
                } else if (line.trim() && !line.startsWith('---') && !line.startsWith('## ')) {
                    currentText += line + '\n';
                }
            });

            if (currentSender && currentText) {
                importedMessages.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    type: currentSender === '系统' ? 'system' : 'ai',
                    sender: currentSender,
                    model: currentModel,
                    text: currentText.trim(),
                    time: ''
                });
            }

            if (importedMessages.length > 0) {
                state.messages = importedMessages;
                saveToStorage();
                renderMessages();
                alert(`成功导入 ${importedMessages.length} 条记录`);
            } else {
                alert('无法解析文件内容');
            }
        } catch (err) {
            alert('导入失败: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ==================== 模态框 ====================
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    state.editingCharacterId = null;
}

// ==================== 本地存储 ====================
function saveToStorage() {
    const data = {
        characters: state.characters,
        messages: state.messages,
        settings: {
            background: elements.sceneBackground.value,
            topic: elements.discussionTopic.value,
            maxRounds: elements.maxRounds.value,
            intervalSeconds: elements.intervalSeconds.value,
            isRunning: state.isRunning,
            currentRound: state.currentRound,
            currentSpeakerIndex: state.currentSpeakerIndex,
            aiKnowsModels: elements.aiKnowsModels ? elements.aiKnowsModels.checked : true,
            showModelInfo: elements.showModelInfo ? elements.showModelInfo.checked : true
        }
    };
    localStorage.setItem('ai_sandbox_data', JSON.stringify(data));
}

// 自动保存定时器（每5秒自动保存一次）
let autoSaveInterval = null;

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        if (state.messages.length > 0) {
            saveToStorage();
            console.log('自动缓存已保存');
        }
    }, 5000);
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('ai_sandbox_data'));
        if (data) {
            state.characters = data.characters || [];
            state.messages = data.messages || [];
            if (data.settings) {
                elements.sceneBackground.value = data.settings.background || '';
                elements.discussionTopic.value = data.settings.topic || '';
                elements.maxRounds.value = data.settings.maxRounds || 10;
                elements.intervalSeconds.value = data.settings.intervalSeconds || 2;
                if (elements.aiKnowsModels) elements.aiKnowsModels.checked = data.settings.aiKnowsModels !== false;
                if (elements.showModelInfo) elements.showModelInfo.checked = data.settings.showModelInfo !== false;
            }
            // 检查是否有未完成的对话
            if (data.settings && data.settings.isRunning) {
                state.isRunning = true;
                state.currentRound = data.settings.currentRound || 0;
                state.currentSpeakerIndex = data.settings.currentSpeakerIndex || 0;
            }
        }
    } catch (e) {
        console.error('加载存储数据失败:', e);
    }
}

// ==================== 工具函数 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 全局函数（供HTML onclick调用）==================
window.openCharacterModal = openCharacterModal;
window.getCharacterById = getCharacterById;
window.deleteCharacter = deleteCharacter;
window.moveCharacter = moveCharacter;
window.closeModal = closeAllModals;
window.closeUserMsgModal = closeAllModals;
window.insertUserMessage = insertUserMessage;

// ==================== AI生成角色 ====================
async function generateCharacter() {
    const model = document.getElementById('char-model').value;
    const endpoint = document.getElementById('char-endpoint').value;
    const apiKey = document.getElementById('char-api-key').value;
    const nameInput = document.getElementById('char-name');
    const descInput = document.getElementById('char-description');
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    btn.disabled = true;

    let prompt;
    if (nameInput.value.trim() && descInput.value.trim()) {
        // 已有角色名和描述，基于它们生成更丰富的描述
        prompt = `请基于以下角色信息，生成更丰富的性格描述（100字左右，包含说话风格、语气特点、行为习惯）：

角色名: ${nameInput.value.trim()}
原有描述: ${descInput.value.trim()}

请直接返回性格描述，不要其他解释。`;
    } else {
        // 随机生成
        prompt = `请生成一个有趣的AI角色，用于多人对话模拟。
请直接返回以下格式的内容，不要其他解释：
角色名: xxx
性格描述: xxx（50字左右，描述说话风格和特点）`;
    }

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
                stream: false
            })
        });

        if (!response.ok) throw new Error('API调用失败');

        const data = await response.json();
        const text = data.choices[0].message.content;

        if (nameInput.value.trim() && descInput.value.trim()) {
            // 已有内容，只更新描述
            descInput.value = text.trim();
        } else {
            // 随机生成，解析全部
            const nameMatch = text.match(/角色名[:：]\s*(.+)/);
            const descMatch = text.match(/性格描述[:：]\s*(.+)/);
            if (nameMatch) nameInput.value = nameMatch[1].trim();
            if (descMatch) descInput.value = descMatch[1].trim();
        }

    } catch (e) {
        alert('生成失败: ' + e.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.generateCharacter = generateCharacter;

// ==================== 停止保存功能 ====================
// 停止并保存当前状态
function stopAndSave() {
    // 保存当前状态到savedState
    state.savedState = {
        characters: state.characters,
        messages: state.messages,
        currentRound: state.currentRound,
        currentSpeakerIndex: state.currentSpeakerIndex,
        maxRounds: state.maxRounds,
        intervalSeconds: state.intervalSeconds,
        aiKnowsModels: state.aiKnowsModels,
        waitingForUser: state.waitingForUser
    };
    
    // 保存到localStorage
    localStorage.setItem('ai_sandbox_saved_state', JSON.stringify(state.savedState));
    
    // 停止模拟
    state.isRunning = false;
    state.isPaused = false;
    if (state.roundInterval) {
        clearTimeout(state.roundInterval);
        state.roundInterval = null;
    }
    
    stopAutoSave();
    
    // 更新UI
    elements.userMsgInput.disabled = true;
    elements.sendUserMsgBtn.disabled = true;
    
    // 显示保存状态提示
    if (elements.savedStateIndicator) {
        elements.savedStateIndicator.style.display = 'flex';
    }
    
    // 添加系统消息
    addMessage({
        type: 'system',
        sender: '系统',
        text: '【模拟已保存】状态已保存，可以随时点击"继续"从当前位置恢复',
        time: new Date().toLocaleTimeString()
    });
    
    updateControlButtons();
    updateNewControlButtons();
}

// 继续从保存的状态
function continueSimulation() {
    if (!state.savedState) {
        // 尝试从localStorage加载
        try {
            const savedData = localStorage.getItem('ai_sandbox_saved_state');
            if (savedData) {
                state.savedState = JSON.parse(savedData);
            }
        } catch (e) {
            console.error('加载保存状态失败:', e);
        }
    }
    
    if (!state.savedState) {
        alert('没有保存的状态');
        return;
    }
    
    // 恢复状态
    state.characters = state.savedState.characters;
    state.messages = state.savedState.messages;
    state.currentRound = state.savedState.currentRound;
    state.currentSpeakerIndex = state.savedState.currentSpeakerIndex;
    state.maxRounds = state.savedState.maxRounds;
    state.intervalSeconds = state.savedState.intervalSeconds;
    state.aiKnowsModels = state.savedState.aiKnowsModels;
    state.waitingForUser = state.savedState.waitingForUser;
    
    state.isRunning = true;
    state.isPaused = false;
    
    // 更新UI设置
    elements.maxRounds.value = state.maxRounds;
    elements.intervalSeconds.value = state.intervalSeconds;
    if (elements.aiKnowsModels) elements.aiKnowsModels.checked = state.aiKnowsModels;
    
    // 重新渲染
    renderCharacters();
    renderMessages();
    
    // 启用用户输入
    elements.userMsgInput.disabled = false;
    elements.sendUserMsgBtn.disabled = false;
    elements.userMsgInput.placeholder = "输入用户消息...";
    elements.sendUserMsgBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    
    // 隐藏保存状态提示
    if (elements.savedStateIndicator) {
        elements.savedStateIndicator.style.display = 'none';
    }
    
    // 启动自动保存
    startAutoSave();
    
    updateControlButtons();
    updateNewControlButtons();
    
    // 添加继续消息
    addMessage({
        type: 'system',
        sender: '系统',
        text: `【模拟继续】从第${state.currentRound}轮继续，当前角色：${state.characters[state.currentSpeakerIndex]?.name || '未知'}`,
        time: new Date().toLocaleTimeString()
    });
    
    // 继续对话
    runRound();
}

// 更新新按钮的状态
function updateNewControlButtons() {
    const hasCharacters = state.characters.length > 0;
    
    // 停止保存按钮
    if (elements.stopSaveBtn) {
        elements.stopSaveBtn.disabled = !state.isRunning;
    }
    
    // 继续按钮 - 有保存状态时启用
    if (elements.continueBtn) {
        elements.continueBtn.disabled = state.isRunning;
        // 检查是否有保存的状态
        const hasSavedState = state.savedState || localStorage.getItem('ai_sandbox_saved_state');
        elements.continueBtn.disabled = state.isRunning || !hasSavedState;
    }
    
    // 显示/隐藏保存状态提示
    if (elements.savedStateIndicator) {
        const hasSavedState = state.savedState || localStorage.getItem('ai_sandbox_saved_state');
        elements.savedStateIndicator.style.display = hasSavedState && !state.isRunning ? 'flex' : 'none';
    }
}

// ==================== AI批量生成角色 ====================
async function generateMultipleCharacters() {
    const count = parseInt(elements.generateCount ? elements.generateCount.value : 3);
    // 使用用户选择的生成模型
    const model = elements.generateModel ? elements.generateModel.value : 'qwen3:8b';
    const endpoint = document.getElementById('char-endpoint').value;
    const apiKey = document.getElementById('char-api-key').value;
    const btn = elements.generateCharactersBtn;
    
    const background = elements.sceneBackground.value.trim();
    const topic = elements.discussionTopic.value.trim();
    
    if (!background && !topic) {
        alert('请先填写背景描述或讨论主题，以便AI生成符合场景的角色');
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    btn.disabled = true;
    
    // 构建提示词
    let prompt = `请根据以下场景信息，生成${count}个多样化且有趣的角色用于多人对话模拟。\n`;
    if (background) prompt += `【场景背景】${background}\n`;
    if (topic) prompt += `【讨论主题】${topic}\n`;
    prompt += `\n请直接返回以下格式的内容（每个角色一行，不要其他解释）：\n`;
    
    // 添加角色类型示例，让AI生成多样化的角色
    const roles = ['理性分析者', '情感丰富者', '幽默风趣者', '严肃认真者', '乐观积极者', '悲观怀疑者', '领导者', '追随者', '创新者', '保守者'];
    prompt += `角色名: xxx | 性格描述: xxx（50字左右，描述说话风格和特点）\n`;
    prompt += `角色名: xxx | 性格描述: xxx\n`.repeat(count - 1);
    
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
                stream: false
            })
        });
        
        if (!response.ok) throw new Error('API调用失败');
        
        const data = await response.json();
        const text = data.choices[0].message.content;
        
        // 解析生成的角色
        const lines = text.split('\n').filter(line => line.trim());
        let generatedCount = 0;
        
        for (const line of lines) {
            if (generatedCount >= count) break;
            
            const nameMatch = line.match(/角色名[:：]\s*(.+?)(?:\s*[|]\s*|$)/);
            const descMatch = line.match(/性格描述[:：]\s*(.+)/);
            
            if (nameMatch && descMatch) {
                const character = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: nameMatch[1].trim(),
                    description: descMatch[1].trim(),
                    model: model,
                    customModel: '',
                    endpoint: endpoint,
                    apiKey: apiKey
                };
                state.characters.push(character);
                generatedCount++;
            }
        }
        
        // 如果解析失败，手动生成默认角色
        if (generatedCount === 0) {
            const defaultRoles = ['理性博士', '情感小姐', '幽默大师', '严肃老者', '乐观少年', '创新者', '保守者', '领导者'];
            for (let i = 0; i < count; i++) {
                const character = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: defaultRoles[i] || `角色${i+1}`,
                    description: `一个有趣的对话角色，性格${['理性', '感性', '幽默', '严肃'][i % 4]}，说话风格独特`,
                    model: model,
                    customModel: '',
                    endpoint: endpoint,
                    apiKey: apiKey
                };
                state.characters.push(character);
            }
        }
        
        saveToStorage();
        renderCharacters();
        updateControlButtons();
        updateNewControlButtons();
        
        alert(`成功生成 ${state.characters.length} 个角色`);
        
    } catch (e) {
        alert('生成失败: ' + e.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 将新函数暴露到全局
window.stopAndSave = stopAndSave;
window.continueSimulation = continueSimulation;
window.generateMultipleCharacters = generateMultipleCharacters;
window.loadCloudModels = loadCloudModels;
