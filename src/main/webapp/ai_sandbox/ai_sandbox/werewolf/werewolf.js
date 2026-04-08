// ==================== 狼人杀游戏逻辑 - 主持人模式 ====================

const AVAILABLE_MODELS = ['llama3.1', 'qwen3:8b', 'deepseek-r1:8b', 'gemma3:12b'];

function getRandomModel() {
    return AVAILABLE_MODELS[Math.floor(Math.random() * AVAILABLE_MODELS.length)];
}

function resolveModel(model) {
    if (model === '__random__') return getRandomModel();
    if (model === '__each_round__') return getRandomModel();
    return model;
}

function getDisplayModel(originalModel, actualModel) {
    if (originalModel === '__random__' || originalModel === '__each_round__') {
        return `随机(${actualModel})`;
    }
    return actualModel;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const PHASE = {
    SETUP: 'setup',
    NIGHT: 'night',
    DAY_ANNOUNCE: 'day_announce',
    DAY_SPEAK: 'day_speak',
    DAY_VOTE: 'day_vote',
    GAME_END: 'game_end'
};

const gameState = {
    players: [],
    messages: [],
    isRunning: false,
    isPaused: false,
    phase: PHASE.SETUP,
    day: 0,
    currentSpeakerIndex: 0,
    speakingOrder: [],
    votes: {},
    deadPlayers: [],
    nightKill: null,
    witchSaved: false,
    witchPoisoned: null,
    seerResult: null,
    userParticipating: false,
    randomSpeakOrder: false,
    aiKnowsModels: true,
    showModelInfo: true,
    intervalSeconds: 3,
    gameModel: 'llama3.1',
    hostModel: 'llama3.1',
    playerDefaultModel: '__random__',
    gameApiKey: 'ollama',
    gameEndpoint: 'http://localhost:11434/v1',
    phaseInterval: null,
    editingPlayerId: null,
    hostSelectedPlayerId: null,
    privateMessages: {},
    nightActions: {},  // 夜间行动决定
    currentNightActor: null  // 当前夜间行动的玩家
};

const elements = {
    playersList: document.getElementById('players-list'),
    addPlayerBtn: document.getElementById('add-player-btn'),
    generatePlayersBtn: document.getElementById('generate-players-btn'),
    playerModal: document.getElementById('player-modal'),
    playerForm: document.getElementById('player-form'),
    playerName: document.getElementById('player-name'),
    playerRole: document.getElementById('player-role'),
    playerDesc: document.getElementById('player-desc'),
    playerModel: document.getElementById('player-model'),
    playerEndpoint: document.getElementById('player-endpoint'),
    playerApiKey: document.getElementById('player-api-key'),
    intervalSeconds: document.getElementById('interval-seconds'),
    gameModel: document.getElementById('host-model'),
    playerDefaultModel: document.getElementById('player-default-model'),
    randomOrder: document.getElementById('random-order'),
    userJoin: document.getElementById('user-join'),
    aiKnowsModels: document.getElementById('ai-knows-models'),
    showModelInfo: document.getElementById('show-model-info'),
    hostMode: document.getElementById('host-mode'),
    hostPanelBtn: document.getElementById('host-panel-btn'),
    hostModal: document.getElementById('host-modal'),
    hostPlayersList: document.getElementById('host-players-list'),
    hostChatArea: document.getElementById('host-chat-area'),
    hostMsgInput: document.getElementById('host-msg-input'),
    hostMsgType: document.getElementById('host-msg-type'),
    hostSendBtn: document.getElementById('host-send-btn'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    stopBtn: document.getElementById('stop-btn'),
    nextPhaseBtn: document.getElementById('next-phase-btn'),
    phaseDisplay: document.getElementById('phase-display'),
    dayDisplay: document.getElementById('day-display'),
    gameMessages: document.getElementById('game-messages'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    clearBtn: document.getElementById('clear-btn'),
    importFile: document.getElementById('import-file'),
    userMsgInput: document.getElementById('user-msg-input'),
    sendUserMsgBtn: document.getElementById('send-user-msg-btn')
};

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadFromStorage();
    renderPlayers();
    renderMessages();
});

function initEventListeners() {
    elements.addPlayerBtn.addEventListener('click', () => openPlayerModal());
    elements.generatePlayersBtn.addEventListener('click', generateMultiplePlayers);
    elements.playerForm.addEventListener('submit', handlePlayerSubmit);
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.stopBtn.addEventListener('click', stopGame);
    elements.nextPhaseBtn.addEventListener('click', nextPhase);
    elements.exportBtn.addEventListener('click', exportGame);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.clearBtn.addEventListener('click', clearGame);
    elements.importFile.addEventListener('change', importGame);

    if (elements.userMsgInput) {
        elements.userMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserMessage();
        });
        if (elements.sendUserMsgBtn) {
            elements.sendUserMsgBtn.addEventListener('click', sendUserMessage);
        }
    }

    // 主持人后台事件
    if (elements.hostPanelBtn) {
        elements.hostPanelBtn.addEventListener('click', openHostModal);
    }
    if (elements.hostSendBtn) {
        elements.hostSendBtn.addEventListener('click', sendHostMessage);
    }
    if (elements.hostMsgInput) {
        elements.hostMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendHostMessage();
        });
    }

    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });
}

// ==================== 玩家管理 ====================
function openPlayerModal(player = null) {
    gameState.editingPlayerId = player ? player.id : null;
    elements.playerModal.classList.add('show');

    if (player) {
        elements.playerName.value = player.name;
        elements.playerRole.value = player.role;
        elements.playerDesc.value = player.description;
        elements.playerModel.value = player.model;
        elements.playerEndpoint.value = player.endpoint;
        elements.playerApiKey.value = player.apiKey;
    } else {
        elements.playerForm.reset();
        elements.playerModel.value = gameState.gameModel;
        elements.playerEndpoint.value = gameState.gameEndpoint;
        elements.playerApiKey.value = gameState.gameApiKey;
    }
}

function handlePlayerSubmit(e) {
    e.preventDefault();
    const player = {
        id: gameState.editingPlayerId || Date.now().toString(),
        name: elements.playerName.value.trim(),
        role: elements.playerRole.value || '平民',
        description: elements.playerDesc.value.trim(),
        model: elements.playerModel.value,
        endpoint: elements.playerEndpoint.value.trim(),
        apiKey: elements.playerApiKey.value.trim(),
        alive: true,
        isUser: false
    };

    if (gameState.editingPlayerId) {
        const index = gameState.players.findIndex(p => p.id === gameState.editingPlayerId);
        if (index !== -1) gameState.players[index] = player;
    } else {
        gameState.players.push(player);
    }

    saveToStorage();
    renderPlayers();
    closeAllModals();
    updateControlButtons();
}

function deletePlayer(id) {
    gameState.players = gameState.players.filter(p => p.id !== id);
    saveToStorage();
    renderPlayers();
    updateControlButtons();
}

function movePlayer(id, direction) {
    const index = gameState.players.findIndex(p => p.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= gameState.players.length) return;
    [gameState.players[index], gameState.players[newIndex]] = [gameState.players[newIndex], gameState.players[index]];
    saveToStorage();
    renderPlayers();
}

function renderPlayers() {
    if (gameState.players.length === 0) {
        elements.playersList.innerHTML = `<div class="empty-state" style="min-height:80px;padding:15px;"><p>暂无玩家，点击"添加"</p></div>`;
        return;
    }

    elements.playersList.innerHTML = gameState.players.map((player, index) => {
        const roleIcon = {'预言家':'fa-eye','女巫':'fa-flask','猎人':'fa-crosshairs','平民':'fa-user','狼人':'fa-skull'}[player.role] || 'fa-user';
        const statusClass = player.alive ? '' : 'dead';
        const userTag = player.isUser ? '<span class="role-badge" style="background:#10b981">用户</span>' : '';
        return `
            <div class="player-card ${statusClass}" data-id="${player.id}">
                <div class="player-info">
                    <div class="player-name"><i class="fas ${roleIcon}"></i>${escapeHtml(player.name)}${userTag}<span class="role-badge">${player.role}</span></div>
                    <div class="player-desc">${escapeHtml(player.description)}</div>
                </div>
                <div class="player-actions">
                    <button class="char-action-btn move-up" onclick="movePlayer('${player.id}','up')" ${index===0?'disabled':''}><i class="fas fa-arrow-up"></i></button>
                    <button class="char-action-btn move-down" onclick="movePlayer('${player.id}','down')" ${index===gameState.players.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button>
                    <button class="char-action-btn edit" onclick="openPlayerModal(getPlayerById('${player.id}'))"><i class="fas fa-edit"></i></button>
                    <button class="char-action-btn delete" onclick="deletePlayer('${player.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');
}

function getPlayerById(id) { return gameState.players.find(p => p.id === id); }

// ==================== 游戏控制 ====================
function updateControlButtons() {
    const hasPlayers = gameState.players.length >= 4;
    elements.startBtn.disabled = gameState.isRunning || !hasPlayers;
    elements.stopBtn.disabled = !gameState.isRunning;
    elements.nextPhaseBtn.disabled = !gameState.isRunning;
    
    // 暂停按钮
    if (elements.pauseBtn) {
        if (!gameState.isRunning) {
            elements.pauseBtn.disabled = true;
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        } else if (gameState.isPaused) {
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        } else {
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }
    
    if (elements.userMsgInput) {
        elements.userMsgInput.disabled = !gameState.isRunning || !gameState.userParticipating || gameState.isPaused;
        if (elements.sendUserMsgBtn) {
            elements.sendUserMsgBtn.disabled = !gameState.isRunning || !gameState.userParticipating || gameState.isPaused;
        }
    }
}

function togglePause() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        // 暂停
        if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
        addGameMessage('system', '主持人', '【游戏暂停】');
    } else {
        // 继续
        addGameMessage('system', '主持人', '【游戏继续】');
        // 根据当前阶段继续
        if (gameState.phase === PHASE.NIGHT) {
            // 夜间暂停后继续，不需要特殊处理
        } else if (gameState.phase === PHASE.DAY_SPEAK) {
            handleDaySpeak();
        } else if (gameState.phase === PHASE.DAY_VOTE) {
            handleOneVote();
        }
    }
    
    updateControlButtons();
}

function updatePhaseDisplay() {
    const names = {
        [PHASE.SETUP]: '等待开始',
        [PHASE.NIGHT]: '夜晚',
        [PHASE.DAY_ANNOUNCE]: '公布死亡',
        [PHASE.DAY_SPEAK]: '白天发言',
        [PHASE.DAY_VOTE]: '投票阶段',
        [PHASE.GAME_END]: '游戏结束'
    };
    elements.phaseDisplay.textContent = names[gameState.phase] || gameState.phase;
    elements.dayDisplay.textContent = `第${gameState.day}天`;
}

function startGame() {
    if (gameState.players.length < 4) { alert('至少需要4名玩家'); return; }

    // 重置游戏状态
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.phase = PHASE.NIGHT;
    gameState.day = 1;
    gameState.currentSpeakerIndex = 0;
    gameState.speakingOrder = [];
    gameState.votes = {};
    gameState.deadPlayers = [];
    gameState.nightKill = null;
    gameState.witchSaved = false;
    gameState.witchPoisoned = null;
    gameState.seerResult = null;
    gameState.userParticipating = elements.userJoin ? elements.userJoin.checked : false;
    gameState.randomSpeakOrder = elements.randomOrder ? elements.randomOrder.checked : false;
    gameState.aiKnowsModels = elements.aiKnowsModels ? elements.aiKnowsModels.checked : false;
    gameState.hostMode = elements.hostMode ? elements.hostMode.checked : false;
    gameState.hostModel = elements.gameModel ? elements.gameModel.value : 'llama3.1';
    gameState.playerDefaultModel = elements.playerDefaultModel ? elements.playerDefaultModel.value : '__random__';
    gameState.intervalSeconds = parseInt(elements.intervalSeconds.value) || 3;
    gameState.gameApiKey = 'ollama';
    gameState.gameEndpoint = 'http://localhost:11434/v1';

    // 随机分配身份
    assignRoles();

    // 初始化玩家状态
    gameState.players.forEach(p => { p.alive = true; });

    // 添加用户玩家
    if (gameState.userParticipating && !gameState.players.find(p => p.isUser)) {
        gameState.players.push({
            id: 'user_player',
            name: '你',
            role: '平民',
            description: '参与游戏的用户',
            model: 'llama3.1',
            endpoint: gameState.gameEndpoint,
            apiKey: gameState.gameApiKey,
            alive: true,
            isUser: true
        });
    }

    addGameMessage('system', '主持人', '========== 狼人杀游戏开始 ==========\n游戏规则：好人找出狼人，狼人杀光好人。');

    // 显示身份分配（仅主持人可见，不显示给玩家）
    addGameMessage('system', '主持人', `【玩家身份】${gameState.players.map(p => `${p.name}(${p.role})`).join('、')}`);

    updateControlButtons();
    updatePhaseDisplay();

    // 开始夜晚阶段
    runNightPhase();
}

function assignRoles() {
    const roles = ['狼人', '狼人', '预言家', '女巫', '猎人'];
    const civilians = Math.max(0, gameState.players.length - roles.length);
    for (let i = 0; i < civilians; i++) roles.push('平民');

    shuffleArray(roles);

    gameState.players.forEach((p, i) => {
        p.role = roles[i];
    });
}

function stopGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
    updateControlButtons();
    addGameMessage('system', '主持人', '游戏已终止');
}

function nextPhase() {
    if (!gameState.isRunning) return;
    // 手动跳过当前阶段
}

// ==================== 夜晚阶段 ====================
async function runNightPhase() {
    if (!gameState.isRunning || gameState.isPaused) return;

    gameState.phase = PHASE.NIGHT;
    gameState.nightActions = {};
    updatePhaseDisplay();
    addGameMessage('system', '主持人', '============== 天黑请闭眼 ==============\n请通过主持人后台与各身份进行私聊，收集他们的决定。');

    const alive = gameState.players.filter(p => p.alive);
    const wolves = alive.filter(p => p.role === '狼人');

    // 初始化夜间行动
    gameState.nightActions = {
        wolfKill: null,
        seerCheck: null,
        witchSave: false,
        witchPoison: null,
        guardProtect: null
    };

    // 如果有狼人，发送私聊提示
    if (wolves.length > 0 && !gameState.hostMode) {
        // 自动模式：直接调用AI
        const targets = alive.filter(p => !wolves.some(w => w.id === p.id));
        if (targets.length > 0) {
            addGameMessage('system', '主持人', '【狼人团队】请选择要杀死的玩家...');
            const prompt = buildNightWolfPrompt(wolves, targets);
            const response = await callGameAI(prompt);
            const targetName = parseName(response, targets.map(t => t.name));
            gameState.nightActions.wolfKill = targets.find(t => t.name === targetName) || targets[Math.floor(Math.random() * targets.length)];
            
            // 记录私聊
            recordNightPrivateMessage(wolves, `选择杀 ${gameState.nightActions.wolfKill.name}`);
        }
    }

    // 女巫
    const witch = alive.find(p => p.role === '女巫');
    if (witch && gameState.nightActions.wolfKill && !gameState.hostMode) {
        addGameMessage('system', '主持人', '【女巫】请选择是否救人...');
        const prompt = buildNightWitchPrompt(witch, gameState.nightActions.wolfKill);
        const response = await callGameAI(prompt);
        if (response.includes('救')) {
            gameState.nightActions.witchSave = true;
            recordNightPrivateMessage([witch], '选择救人');
        }
    }

    // 预言家
    const seer = alive.find(p => p.role === '预言家');
    if (seer && !gameState.hostMode) {
        addGameMessage('system', '主持人', '【预言家】请选择要查验的玩家...');
        const checkTargets = alive.filter(p => p.id !== seer.id);
        if (checkTargets.length > 0) {
            const target = checkTargets[Math.floor(Math.random() * checkTargets.length)];
            gameState.nightActions.seerCheck = { name: target.name, isWolf: target.role === '狼人' };
            recordNightPrivateMessage([seer], `查验 ${target.name}，他是${target.role === '狼人' ? '狼人' : '好人'}`);
        }
    }

    // 守卫
    const guard = alive.find(p => p.role === '守卫');
    if (guard && !gameState.hostMode) {
        const protectTargets = alive.filter(p => p.id !== guard.id);
        if (protectTargets.length > 0) {
            const target = protectTargets[Math.floor(Math.random() * protectTargets.length)];
            gameState.nightActions.guardProtect = target;
            recordNightPrivateMessage([guard], `选择守护 ${target.name}`);
        }
    }

    // 进入白天
    setTimeout(showDayAnnounce, 1000);
}

// 记录夜间私聊
function recordNightPrivateMessage(players, text) {
    const time = new Date().toLocaleTimeString();
    players.forEach(player => {
        const playerId = player.id;
        if (!gameState.privateMessages[playerId]) {
            gameState.privateMessages[playerId] = [];
        }
        gameState.privateMessages[playerId].push({
            sender: '主持人',
            text: text,
            time: time,
            type: 'private'
        });
    });
}

function buildNightWolfPrompt(wolves, targets) {
    return `你是狼人${wolves.length > 1 ? '团队' : ''}。请选择要杀死的玩家。

存活好人：${targets.map(t => t.name).join('、')}

直接说玩家名字，不要其他话。`;
}

function buildNightWitchPrompt(witch, killed) {
    return `你是女巫。昨晚${killed.name}被杀。

是否使用解药救他？请回答"救"或"不救"。`;
}

async function callGameAI(prompt) {
    const model = resolveModel(gameState.hostModel);
    try {
        const response = await fetch(`${gameState.gameEndpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gameState.gameApiKey}` },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }], stream: false })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) {
        console.error('AI调用失败:', e);
        return '';
    }
}

function parseName(text, names) {
    for (const name of names) {
        if (text.includes(name)) return name;
    }
    return names[0];
}

// ==================== 白天阶段 ====================
function showDayAnnounce() {
    if (!gameState.isRunning || gameState.isPaused) return;

    gameState.phase = PHASE.DAY_ANNOUNCE;
    updatePhaseDisplay();

    let dead = [];
    const actions = gameState.nightActions || {};
    
    // 检查被杀的是否被守卫保护
    const killed = actions.wolfKill;
    const guarded = actions.guardProtect;
    const wasSaved = actions.witchSave;
    
    // 如果守卫守护了被杀的人，且女巫没有救人，则不死
    if (killed && guarded && killed.id === guarded.id) {
        // 被守卫保护，不死
    } else if (killed && !wasSaved) {
        dead.push(killed);
    }
    
    if (actions.witchPoisoned) dead.push(actions.witchPoisoned);

    dead.forEach(p => { p.alive = false; gameState.deadPlayers.push(p); });

    if (dead.length === 0) {
        addGameMessage('system', '主持人', '============== 天亮了 ==============\n昨晚是平安夜，没有人死亡。');
    } else {
        addGameMessage('system', '主持人', `============== 天亮了 ==============\n昨晚死亡的有：${dead.map(p => p.name).join('、')}`);
    }

    gameState.phaseInterval = setTimeout(startDaySpeak, gameState.intervalSeconds * 1000);
}

function startDaySpeak() {
    if (!gameState.isRunning || gameState.isPaused) return;

    gameState.phase = PHASE.DAY_SPEAK;
    updatePhaseDisplay();
    addGameMessage('system', '主持人', '============== 白天发言阶段 ==============');

    // 设置发言顺序
    const alive = gameState.players.filter(p => p.alive);
    gameState.speakingOrder = [...alive];
    if (gameState.randomSpeakOrder) {
        shuffleArray(gameState.speakingOrder);
    }
    gameState.currentSpeakerIndex = 0;

    handleDaySpeak();
}

async function handleDaySpeak() {
    if (!gameState.isRunning || gameState.isPaused) return;

    const alive = gameState.speakingOrder.filter(p => p.alive);

    if (gameState.currentSpeakerIndex >= alive.length) {
        handleVote();
        return;
    }

    const speaker = alive[gameState.currentSpeakerIndex];

    // 用户发言
    if (speaker.isUser) {
        addGameMessage('system', '主持人', `【发言】轮到你发言了`);
        elements.userMsgInput.placeholder = "请输入你的发言...";
        elements.userMsgInput.focus();
        gameState.waitingForUser = true;
        return;
    }

    addGameMessage('system', '主持人', `【发言】请 ${speaker.name} 发言`);

    const prompt = buildDaySpeakPrompt(speaker, alive);

    try {
        const response = await callPlayerAI(speaker, prompt);
        const model = resolveModel(speaker.model);
        const displayModel = getDisplayModel(speaker.model, model);
        addGameMessage('ai', speaker.name, response, displayModel);
    } catch (e) {
        const model = resolveModel(speaker.model);
        const displayModel = getDisplayModel(speaker.model, model);
        addGameMessage('ai', speaker.name, '（发言失败）', displayModel);
    }

    gameState.currentSpeakerIndex++;
    gameState.phaseInterval = setTimeout(handleDaySpeak, gameState.intervalSeconds * 1000);
}

function buildDaySpeakPrompt(speaker, alive) {
    const history = getGameHistory();
    let secretInfo = '';

    if (speaker.role === '预言家' && gameState.nightActions && gameState.nightActions.seerCheck) {
        const check = gameState.nightActions.seerCheck;
        secretInfo = `\n（你昨晚查验了${check.name}，他是${check.isWolf ? '狼人' : '好人'}）`;
    }

    // 如果开启，AI能看到其他玩家的模型信息
    let modelInfo = '';
    if (gameState.aiKnowsModels) {
        const otherPlayers = alive.filter(p => p.id !== speaker.id).map(p => {
            const model = resolveModel(p.model);
            const displayModel = getDisplayModel(p.model, model);
            return `${p.name}(${displayModel})`;
        });
        if (otherPlayers.length > 0) {
            modelInfo = `\n【其他玩家模型】${otherPlayers.join('、')}`;
        }
    }

    return `${speaker.name}，你是${speaker.role}。
${speaker.description}

【存活玩家】${alive.map(p => p.name).join('、')}
【死亡玩家】${gameState.deadPlayers.map(p => p.name).join('、') || '无'}${modelInfo}
${secretInfo}

【之前的发言】
${history}

请进行发言，分析局势，怀疑谁是狼人。`;
}

async function callPlayerAI(player, prompt) {
    const model = resolveModel(player.model);
    try {
        const response = await fetch(`${player.endpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${player.apiKey}` },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }], stream: false })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) {
        return '';
    }
}

function sendUserMessage() {
    if (!gameState.waitingForUser) return;

    const text = elements.userMsgInput.value.trim();
    if (!text) return;

    addGameMessage('user', '你', text);
    elements.userMsgInput.value = '';
    gameState.waitingForUser = false;

    gameState.currentSpeakerIndex++;
    gameState.phaseInterval = setTimeout(handleDaySpeak, 500);
}

// ==================== 投票阶段 ====================
function handleVote() {
    if (!gameState.isRunning || gameState.isPaused) return;

    gameState.phase = PHASE.DAY_VOTE;
    updatePhaseDisplay();
    addGameMessage('system', '主持人', '============== 发言结束，开始投票 ==============');

    gameState.votes = {};
    gameState.currentSpeakerIndex = 0;
    handleOneVote();
}

async function handleOneVote() {
    if (!gameState.isRunning || gameState.isPaused) return;

    const alive = gameState.speakingOrder.filter(p => p.alive);

    if (gameState.currentSpeakerIndex >= alive.length) {
        countVotes();
        return;
    }

    const voter = alive[gameState.currentSpeakerIndex];
    const targets = alive.filter(p => p.id !== voter.id);

    if (voter.isUser) {
        addGameMessage('system', '主持人', `【投票】轮到你投票了`);
        elements.userMsgInput.placeholder = "输入你要投票的玩家名字...";
        elements.userMsgInput.focus();
        gameState.waitingForUserVote = true;
        return;
    }

    addGameMessage('system', '主持人', `【投票】请 ${voter.name} 投票`);

    const prompt = buildVotePrompt(voter, targets);

    try {
        const response = await callPlayerAI(voter, prompt);
        const targetName = parseName(response, targets.map(t => t.name));
        const target = targets.find(t => t.name === targetName) || targets[Math.floor(Math.random() * targets.length)];
        gameState.votes[voter.id] = target.id;
        const model = resolveModel(voter.model);
        const displayModel = getDisplayModel(voter.model, model);
        addGameMessage('ai', voter.name, `投票给 ${target.name}`, displayModel);
    } catch (e) {
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        gameState.votes[voter.id] = randomTarget.id;
        const model = resolveModel(voter.model);
        const displayModel = getDisplayModel(voter.model, model);
        addGameMessage('ai', voter.name, `投票给 ${randomTarget.name}`, displayModel);
    }

    gameState.currentSpeakerIndex++;
    gameState.phaseInterval = setTimeout(handleOneVote, 500);
}

function buildVotePrompt(voter, targets) {
    const history = getGameHistory();
    
    // 如果开启，AI能看到其他玩家的模型信息
    let modelInfo = '';
    if (gameState.aiKnowsModels) {
        const otherPlayers = targets.map(p => {
            const model = resolveModel(p.model);
            const displayModel = getDisplayModel(p.model, model);
            return `${p.name}(${displayModel})`;
        });
        if (otherPlayers.length > 0) {
            modelInfo = `\n【其他玩家模型】${otherPlayers.join('、')}`;
        }
    }

    return `${voter.name}（${voter.role}），请投票。

【存活玩家】${targets.map(p => p.name).join('、')}${modelInfo}

【之前的发言】
${history}

直接说玩家名字。`;
}

function countVotes() {
    const voteCount = {};
    Object.values(gameState.votes).forEach(id => { voteCount[id] = (voteCount[id] || 0) + 1; });

    let result = '【投票结果】\n';
    gameState.speakingOrder.filter(p => p.alive).forEach(p => {
        result += `${p.name}: ${voteCount[p.id] || 0}票\n`;
    });

    addGameMessage('system', '主持人', result);

    let maxVotes = 0, tied = [];
    Object.entries(voteCount).forEach(([id, count]) => {
        if (count > maxVotes) { maxVotes = count; tied = [id]; }
        else if (count === maxVotes) tied.push(id);
    });

    if (tied.length === 1) {
        const eliminated = gameState.players.find(p => p.id === tied[0]);
        eliminated.alive = false;
        gameState.deadPlayers.push(eliminated);
        addGameMessage('system', '主持人', `${eliminated.name} 被投出，他的身份是 ${eliminated.role}`);

        if (eliminated.role === '猎人') {
            const alive = gameState.players.filter(p => p.alive);
            if (alive.length > 1) {
                const shot = alive[Math.floor(Math.random() * alive.length)];
                shot.alive = false;
                gameState.deadPlayers.push(shot);
                addGameMessage('system', '主持人', `${eliminated.name} 发动猎人技能，带走了 ${shot.name}`);
            }
        }
    } else {
        addGameMessage('system', '主持人', '平票，进入下一晚');
    }

    checkWinCondition();

    if (gameState.isRunning) {
        gameState.phaseInterval = setTimeout(() => {
            gameState.day++;
            runNightPhase();
        }, gameState.intervalSeconds * 1000);
    }
}

function checkWinCondition() {
    const alive = gameState.players.filter(p => p.alive);
    const wolves = alive.filter(p => p.role === '狼人');
    const goods = alive.filter(p => p.role !== '狼人');

    if (wolves.length === 0) endGame('好人胜利！狼人全部出局！');
    else if (wolves.length >= goods.length) endGame('狼人胜利！好人已经无法对抗狼人！');
}

function endGame(result) {
    gameState.isRunning = false;
    gameState.phase = PHASE.GAME_END;
    if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
    addGameMessage('system', '主持人', `============== 游戏结束：${result} ==============`);
    updateControlButtons();
    updatePhaseDisplay();
}

// ==================== 消息 ====================
function addGameMessage(type, sender, text, model = null) {
    const msg = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type, sender, text, time: new Date().toLocaleTimeString(), model };
    gameState.messages.push(msg);
    renderMessages();
    scrollToBottom();
    saveToStorage();
}

function renderMessages() {
    if (gameState.messages.length === 0) {
        elements.gameMessages.innerHTML = `<div class="empty-state"><i class="fas fa-scroll"></i><p>添加AI玩家并设置后，点击"开始游戏"</p></div>`;
        return;
    }

    const showModel = elements.showModelInfo && elements.showModelInfo.checked;

    elements.gameMessages.innerHTML = gameState.messages.map(msg => {
        const icon = msg.type === 'system' ? 'fa-crown' : (msg.type === 'user' ? 'fa-user' : 'fa-robot');
        const modelTag = msg.model && showModel ? `<span class="model-tag">${msg.model}</span>` : '';
        return `<div class="message ${msg.type}-message"><div class="message-avatar"><i class="fas ${icon}"></i></div><div class="message-content"><div class="message-sender">${escapeHtml(msg.sender)}${modelTag}</div><div class="message-text">${escapeHtml(msg.text)}</div><div class="message-time">${msg.time}</div></div></div>`;
    }).join('');
}

function scrollToBottom() { elements.gameMessages.scrollTop = elements.gameMessages.scrollHeight; }

function getGameHistory() {
    return gameState.messages.slice(-20).map(m => `${m.sender}: ${m.text}`).join('\n');
}

// ==================== 导入导出 ====================
function exportGame() {
    if (gameState.messages.length === 0) { alert('没有可导出的内容'); return; }

    let content = '# 狼人杀游戏记录\n\n';
    if (gameState.players.length > 0) {
        content += '## 玩家列表\n';
        gameState.players.forEach(p => content += `- ${p.name} (${p.role}, 模型: ${p.model})\n`);
        content += '\n---\n\n';
    }

    gameState.messages.forEach(msg => {
        const modelInfo = msg.model ? ` [${msg.model}]` : '';
        content += `## ${msg.sender}${modelInfo}\n${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `狼人杀_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearGame() {
    if (gameState.isRunning) stopGame();
    if (confirm('确定要清空所有游戏记录吗？')) {
        gameState.messages = [];
        gameState.players.forEach(p => p.alive = true);
        saveToStorage();
        renderMessages();
        renderPlayers();
    }
}

function importGame(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        const lines = content.split('\n');
        let currentSender = '', currentText = '', imported = [];

        lines.forEach(line => {
            const match = line.match(/^##\s+(.+)$/);
            if (match) {
                if (currentSender && currentText) imported.push({ id: Date.now().toString(), type: currentSender === '主持人' ? 'system' : 'ai', sender: currentSender, text: currentText.trim(), time: '' });
                currentSender = match[1]; currentText = '';
            } else if (line.trim()) currentText += line + '\n';
        });
        if (currentSender && currentText) imported.push({ id: Date.now().toString(), type: currentSender === '主持人' ? 'system' : 'ai', sender: currentSender, text: currentText.trim(), time: '' });

        if (imported.length > 0) { gameState.messages = imported; saveToStorage(); renderMessages(); alert(`成功导入 ${imported.length} 条记录`); }
        else alert('无法解析文件内容');
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ==================== 存储 ====================
function saveToStorage() {
    localStorage.setItem('werewolf_data', JSON.stringify({
        players: gameState.players,
        messages: gameState.messages,
        settings: {
            intervalSeconds: elements.intervalSeconds.value,
            gameModel: elements.gameModel.value,
            randomOrder: elements.randomOrder ? elements.randomOrder.checked : false,
            userJoin: elements.userJoin ? elements.userJoin.checked : false,
            aiKnowsModels: elements.aiKnowsModels ? elements.aiKnowsModels.checked : false,
            showModelInfo: elements.showModelInfo ? elements.showModelInfo.checked : false
        }
    }));
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('werewolf_data'));
        if (data) {
            gameState.players = data.players || [];
            gameState.messages = data.messages || [];
            if (data.settings) {
                elements.intervalSeconds.value = data.settings.intervalSeconds || 3;
                elements.gameModel.value = data.settings.gameModel || 'llama3.1';
                if (elements.randomOrder) elements.randomOrder.checked = data.settings.randomOrder || false;
                if (elements.userJoin) elements.userJoin.checked = data.settings.userJoin || false;
                if (elements.aiKnowsModels) elements.aiKnowsModels.checked = data.settings.aiKnowsModels !== false;
                if (elements.showModelInfo) elements.showModelInfo.checked = data.settings.showModelInfo !== false;
            }
        }
    } catch (e) { console.error('加载失败:', e); }
}

function escapeHtml(text) {
    const div = document.createElement('div'); div.textContent = text; return div.innerHTML;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    gameState.editingPlayerId = null;
}

// ==================== 主持人后台 ====================
function openHostModal() {
    elements.hostModal.classList.add('show');
    renderHostPlayersList();
}

function closeHostModal() {
    elements.hostModal.classList.remove('show');
    gameState.hostSelectedPlayerId = null;
}

function renderHostPlayersList() {
    if (gameState.players.length === 0) {
        elements.hostPlayersList.innerHTML = '<p style="font-size:0.8rem;color:#999;">暂无玩家</p>';
        return;
    }

    elements.hostPlayersList.innerHTML = gameState.players.map(player => {
        const roleClass = {'狼人':'wolf','预言家':'seer','女巫':'witch','猎人':'hunter'}[player.role] || 'civilian';
        const statusIcon = player.alive ? '' : ' <i class="fas fa-skull" style="color:#999;"></i>';
        return `
            <div class="host-player-item ${gameState.hostSelectedPlayerId === player.id ? 'active' : ''}" 
                 onclick="selectHostPlayer('${player.id}')">
                <div class="player-name">${escapeHtml(player.name)}${statusIcon}</div>
                <div class="player-role">
                    <span class="role-badge ${roleClass}">${player.role || '平民'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function selectHostPlayer(playerId) {
    gameState.hostSelectedPlayerId = playerId;
    renderHostPlayersList();
    renderHostChat();
}

function renderHostChat() {
    if (!gameState.hostSelectedPlayerId) {
        elements.hostChatArea.innerHTML = '<div class="empty-state"><i class="fas fa-hand-point-left"></i><p>选择一名玩家查看私聊记录</p></div>';
        return;
    }

    const player = gameState.players.find(p => p.id === gameState.hostSelectedPlayerId);
    if (!player) return;

    // 获取该玩家的私聊消息
    const privateMsgs = gameState.privateMessages[gameState.hostSelectedPlayerId] || [];
    const roleClass = {'狼人':'wolf','预言家':'seer','女巫':'witch','猎人':'hunter'}[player.role] || 'civilian';

    let html = `
        <div style="margin-bottom:10px;padding:10px;background:#fff;border-radius:8px;">
            <strong>${escapeHtml(player.name)}</strong>
            <span class="role-badge ${roleClass}">${player.role || '平民'}</span>
            <span style="color:#666;margin-left:10px;">模型: ${player.model}</span>
        </div>
    `;

    if (privateMsgs.length === 0) {
        html += '<div class="empty-state"><p>暂无私聊消息</p></div>';
    } else {
        html += privateMsgs.map(msg => `
            <div class="host-message ${msg.type}">
                <div class="msg-sender">${escapeHtml(msg.sender)} ${msg.type === 'private' ? '(私聊)' : ''}</div>
                <div class="msg-text">${escapeHtml(msg.text)}</div>
                <div class="msg-time">${msg.time}</div>
            </div>
        `).join('');
    }

    elements.hostChatArea.innerHTML = html;
    elements.hostChatArea.scrollTop = elements.hostChatArea.scrollHeight;
}

function sendHostMessage() {
    const text = elements.hostMsgInput.value.trim();
    if (!text) return;

    const msgType = elements.hostMsgType.value;
    const time = new Date().toLocaleTimeString();

    if (msgType === 'public') {
        // 公开发言 - 显示给所有玩家
        addGameMessage('system', '主持人', `【公开发言】${text}`);
    } else if (gameState.hostSelectedPlayerId) {
        // 私聊消息 - 只发送给选中的玩家
        const player = gameState.players.find(p => p.id === gameState.hostSelectedPlayerId);
        if (player) {
            const playerId = player.id;
            if (!gameState.privateMessages[playerId]) {
                gameState.privateMessages[playerId] = [];
            }
            gameState.privateMessages[playerId].push({
                sender: '主持人',
                text: text,
                time: time,
                type: 'private'
            });
            
            // 同时也添加一条系统消息让主持人看到
            addGameMessage('system', '主持人', `【私聊${player.name}】${text}`);
            
            renderHostChat();
        }
    }

    elements.hostMsgInput.value = '';
}

window.openPlayerModal = openPlayerModal;
window.getPlayerById = getPlayerById;
window.deletePlayer = deletePlayer;
window.movePlayer = movePlayer;
window.closeModal = closeAllModals;
window.closeHostModal = closeHostModal;
window.selectHostPlayer = selectHostPlayer;

// ==================== 夜间行动函数 ====================
async function triggerWolfKill() {
    if (!gameState.isRunning || gameState.phase !== PHASE.NIGHT) {
        alert('现在不是夜晚阶段');
        return;
    }

    const alive = gameState.players.filter(p => p.alive);
    const wolves = alive.filter(p => p.role === '狼人');
    const targets = alive.filter(p => !wolves.some(w => w.id === p.id));

    if (wolves.length === 0 || targets.length === 0) {
        alert('没有狼人或可杀目标');
        return;
    }

    // 构建狼人杀人的prompt，包含之前的私聊历史
    const history = getNightHistory('狼人');
    const prompt = `你是狼人团队。请选择要杀死的玩家。

存活好人：${targets.map(t => t.name).join('、')}

【之前的对话】
${history}

直接说玩家名字，不要其他话。`;

    // 调用狼人AI
    if (wolves.length === 1) {
        // 单狼
        const response = await callPlayerAI(wolves[0], prompt);
        const targetName = parseName(response, targets.map(t => t.name));
        gameState.nightActions.wolfKill = targets.find(t => t.name === targetName) || targets[0];
    } else {
        // 狼人团队
        const response = await callGameAI(prompt);
        const targetName = parseName(response, targets.map(t => t.name));
        gameState.nightActions.wolfKill = targets.find(t => t.name === targetName) || targets[0];
    }

    // 记录私聊
    const killTarget = gameState.nightActions.wolfKill;
    recordNightPrivateMessage(wolves, `选择杀 ${killTarget ? killTarget.name : '未知'}`);
    addGameMessage('system', '主持人', `【狼人团队】已做出选择`);
    
    alert(`狼人选择杀死 ${killTarget ? killTarget.name : '未知'}`);
}

async function triggerSeerCheck() {
    if (!gameState.isRunning || gameState.phase !== PHASE.NIGHT) {
        alert('现在不是夜晚阶段');
        return;
    }

    const alive = gameState.players.filter(p => p.alive);
    const seer = alive.find(p => p.role === '预言家');

    if (!seer) {
        alert('没有预言家');
        return;
    }

    const targets = alive.filter(p => p.id !== seer.id);
    if (targets.length === 0) {
        alert('没有可查验的目标');
        return;
    }

    const history = getNightHistory('预言家');
    const prompt = `你是预言家。请选择要查验的玩家。

存活玩家：${targets.map(t => t.name).join('、')}

【之前的对话】
${history}

直接说玩家名字，不要其他话。`;

    const response = await callPlayerAI(seer, prompt);
    const targetName = parseName(response, targets.map(t => t.name));
    const target = targets.find(t => t.name === targetName) || targets[0];
    
    gameState.nightActions.seerCheck = { name: target.name, isWolf: target.role === '狼人' };
    recordNightPrivateMessage([seer], `查验 ${target.name}，他是${target.role === '狼人' ? '狼人' : '好人'}`);
    
    addGameMessage('system', '主持人', `【预言家】已做出选择`);
    alert(`预言家查验 ${target.name}，他是 ${target.role === '狼人' ? '狼人' : '好人'}`);
}

async function triggerWitchAction() {
    if (!gameState.isRunning || gameState.phase !== PHASE.NIGHT) {
        alert('现在不是夜晚阶段');
        return;
    }

    const alive = gameState.players.filter(p => p.alive);
    const witch = alive.find(p => p.role === '女巫');

    if (!witch) {
        alert('没有女巫');
        return;
    }

    const killed = gameState.nightActions.wolfKill;
    if (!killed) {
        alert('还没有狼人杀人');
        return;
    }

    // 检查女巫是否还有药
    const history = getNightHistory('女巫');
    const prompt = `你是女巫。昨晚 ${killed.name} 被杀。

是否使用解药救他？请回答"救"或"不救"。

【之前的对话】
${history}

直接回答，不要其他话。`;

    const response = await callPlayerAI(witch, prompt);
    if (response.includes('救')) {
        gameState.nightActions.witchSave = true;
        recordNightPrivateMessage([witch], '选择救人');
        addGameMessage('system', '主持人', `【女巫】使用了解药`);
        alert('女巫选择救人');
    } else {
        recordNightPrivateMessage([witch], '选择不救');
        addGameMessage('system', '主持人', `【女巫】选择不救`);
        alert('女巫选择不救');
    }
}

async function triggerGuardProtect() {
    if (!gameState.isRunning || gameState.phase !== PHASE.NIGHT) {
        alert('现在不是夜晚阶段');
        return;
    }

    const alive = gameState.players.filter(p => p.alive);
    const guard = alive.find(p => p.role === '守卫');

    if (!guard) {
        alert('没有守卫');
        return;
    }

    const targets = alive.filter(p => p.id !== guard.id);
    if (targets.length === 0) {
        alert('没有可守护的目标');
        return;
    }

    const history = getNightHistory('守卫');
    const prompt = `你是守卫。请选择要守护的玩家。

存活玩家：${targets.map(t => t.name).join('、')}

【之前的对话】
${history}

直接说玩家名字，不要其他话。`;

    const response = await callPlayerAI(guard, prompt);
    const targetName = parseName(response, targets.map(t => t.name));
    const target = targets.find(t => t.name === targetName) || targets[0];
    
    gameState.nightActions.guardProtect = target;
    recordNightPrivateMessage([guard], `选择守护 ${target.name}`);
    
    addGameMessage('system', '主持人', `【守卫】已做出选择`);
    alert(`守卫选择守护 ${target.name}`);
}

function finishNightPhase() {
    if (!gameState.isRunning || gameState.phase !== PHASE.NIGHT) {
        alert('现在不是夜晚阶段');
        return;
    }

    closeHostModal();
    showDayAnnounce();
}

function getNightHistory(role) {
    const players = gameState.players.filter(p => p.role === role);
    if (players.length === 0) return '';
    
    const playerId = players[0].id;
    const msgs = gameState.privateMessages[playerId] || [];
    return msgs.map(m => `${m.sender}: ${m.text}`).join('\n');
}

// ==================== 一键生成玩家 ====================
async function generateMultiplePlayers() {
    const count = 8;
    const roles = ['预言家', '女巫', '猎人', '守卫', '平民', '平民', '狼人', '狼人'];
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    const model = elements.gameModel.value === '__random__' ? 'llama3.1' : elements.gameModel.value;

    // 获取随机模型
    const getRandomModel = () => {
        const models = ['llama3.1', 'qwen3:8b', 'deepseek-r1:8b', 'gemma3:12b'];
        return models[Math.floor(Math.random() * models.length)];
    };

    // AI生成角色信息
    const prompt = `你需要生成${count}个狼人杀游戏中的AI玩家角色。
要求：
1. 每个角色有独特的名字和性格描述
2. 名字要中文名，看起来像真实玩家
3. 性格描述要体现玩家的发言风格和策略特点（50字以内）
4. 输出格式为JSON数组，每个元素格式：{"name":"名字","desc":"性格描述"}

只输出JSON，不要其他内容。`;

    elements.generatePlayersBtn.disabled = true;
    elements.generatePlayersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';

    try {
        const response = await fetch(`${gameState.gameEndpoint}/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${gameState.gameApiKey}` 
            },
            body: JSON.stringify({ 
                model: model,
                messages: [{ role: 'user', content: prompt }], 
                stream: false 
            })
        });
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // 解析JSON
        let characters;
        try {
            characters = JSON.parse(content);
        } catch (e) {
            // JSON解析失败，尝试提取数组部分
            const match = content.match(/\[[\s\S]*\]/);
            if (match) {
                characters = JSON.parse(match[0]);
            } else {
                throw new Error('无法解析AI返回的角色数据');
            }
        }

        // 确保生成足够的角色
        while (characters.length < count) {
            characters.push({
                name: `玩家${characters.length + 1}`,
                desc: '普通玩家，有自己的策略风格'
            });
        }

        // 创建玩家
        for (let i = 0; i < count; i++) {
            const char = characters[i] || {};
            const player = {
                id: Date.now().toString() + i,
                name: char.name || `玩家${i+1}`,
                role: shuffledRoles[i] || '平民',
                description: char.desc || '普通玩家',
                model: gameState.playerDefaultModel || '__random__',
                endpoint: 'http://localhost:11434/v1',
                apiKey: 'ollama',
                alive: true,
                isUser: false
            };
            gameState.players.push(player);
        }

        saveToStorage();
        renderPlayers();
        updateControlButtons();
        alert(`已生成 ${count} 名AI玩家`);

    } catch (e) {
        alert('生成失败: ' + e.message);
        console.error(e);
    } finally {
        elements.generatePlayersBtn.disabled = false;
        elements.generatePlayersBtn.innerHTML = '<i class="fas fa-magic"></i> 生成';
    }
}

// 导出夜间行动函数到全局
window.triggerWolfKill = triggerWolfKill;
window.triggerSeerCheck = triggerSeerCheck;
window.triggerWitchAction = triggerWitchAction;
window.triggerGuardProtect = triggerGuardProtect;
window.finishNightPhase = finishNightPhase;
