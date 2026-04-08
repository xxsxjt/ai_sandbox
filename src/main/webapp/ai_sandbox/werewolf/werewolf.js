// ==================== 狼人杀游戏逻辑 - 主持人模式 ====================
// 模型和API函数已在 shared.js 中定义
// 高级角色系统在 roles.js 中定义

// 引入角色能力系统和AI增强系统
let roleAbilitySystem = null;
let aiImprovements = null;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 高级角色配置
const ADVANCED_ROLES = {
    elder: {
        name: '长老',
        team: 'good',
        description: '投票被淘汰时存活一次，需再次投票'
    },
    silencer: {
        name: '禁言长老',
        team: 'good',
        description: '每晚可禁言一名玩家'
    },
    knight: {
        name: '骑士',
        team: 'good',
        description: '每天可守护一名玩家免受狼击'
    },
    magician: {
        name: '魔术师',
        team: 'good',
        description: '可复活一名死亡的玩家'
    },
    dreamEater: {
        name: '摄梦人',
        team: 'neutral',
        description: '可修改投票结果'
    },
    whiteWolfKing: {
        name: '白狼王',
        team: 'wolf',
        description: '自爆时可以带走一名玩家'
    },
    wolfBeauty: {
        name: '狼美人',
        team: 'wolf',
        description: '击杀目标后获得护身符'
    }
};

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
    randomSpeakOrder: false,
    aiKnowsModels: true,
    showModelInfo: true,
    intervalSeconds: 3,
    gameModel: 'llama3.1',
    hostModel: 'llama3.1',
    playerDefaultModel: '__random_all__',
    gameApiKey: AppSettings.getApiKey(),
    gameEndpoint: AppSettings.getEndpointV1(),
    phaseInterval: null,
    editingPlayerId: null,
    hostSelectedPlayerId: null,
    hostTab: 'players',  // 'players' 或 'wolf-team'
    privateMessages: {},
    wolfTeamMessages: [],  // 狼人团队聊天记录
    nightRoundRecords: [],  // 每轮夜间记录（用于导出）
    nightActions: {},  // 夜间行动决定
    currentNightActor: null,  // 当前夜间行动的玩家
    currentNightRecord: [],  // 当前夜晚行动记录
    suspicionMap: new Map(),  // 玩家可疑度
    dreamEaterUsed: false,  // 摄梦人是否已使用能力
    elderLivedOnce: false,  // 长老是否已触发过
    magicianRevived: false,  // 魔术师是否已复活
    knightProtected: null,  // 骑士守护目标
    voteOverride: null,  // 摄梦人修改投票
    wolfBeautyAlive: false  // 狼美人护身符状态
};

const elements = {
    playersList: document.getElementById('players-list'),
    addPlayerBtn: document.getElementById('add-player-btn'),
    generatePlayersBtn: document.getElementById('generate-players-btn'),
    generateModel: document.getElementById('generate-model'),
    generateCount: document.getElementById('generate-count'),
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
    aiKnowsModels: document.getElementById('ai-knows-models'),
    showModelInfo: document.getElementById('show-model-info'),
    autoAssignRoles: document.getElementById('auto-assign-roles'),
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
    sendUserMsgBtn: document.getElementById('send-user-msg-btn'),
    userPanelBtn: document.getElementById('user-panel-btn'),
    userModal: document.getElementById('user-modal'),
    userRoleBadge: document.getElementById('user-role-badge'),
    userMyRole: document.getElementById('user-my-role'),
    userAliveStatus: document.getElementById('user-alive-status'),
    userSecretContent: document.getElementById('user-secret-content'),
    userNightActionArea: document.getElementById('user-night-action-area'),
    userNightResults: document.getElementById('user-night-results'),
    userNightHistory: document.getElementById('user-night-history'),
    userWolfTeamChat: document.getElementById('user-wolf-team-chat'),
    userTeamMsgInput: document.getElementById('user-team-msg-input'),
    userTeamSendBtn: document.getElementById('user-team-send-btn'),

    userActionButtons: document.getElementById('user-action-buttons'),
    userActionBtn: document.getElementById('user-action-btn'),
    waitingForUserAction: false,
    userCurrentAction: null  // 当前用户需要做的行动
};

document.addEventListener('DOMContentLoaded', () => {
    // 动态填充模型下拉框
    populateModelSelect(document.getElementById('generate-model'), false, 'llama3.1:latest');
    populateModelSelect(document.getElementById('host-model'), false);
    populateModelSelect(document.getElementById('player-default-model'), true);
    populateModelSelect(document.getElementById('player-model'), true);

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

    // 用户后台事件
    if (elements.userPanelBtn) {
        elements.userPanelBtn.addEventListener('click', openUserModal);
    }
    if (elements.userTeamSendBtn) {
        elements.userTeamSendBtn.addEventListener('click', sendUserTeamMessage);
    }
    if (elements.userTeamMsgInput) {
        elements.userTeamMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserTeamMessage();
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
        elements.userMsgInput.disabled = !gameState.isRunning || gameState.isPaused;
        if (elements.sendUserMsgBtn) {
            elements.sendUserMsgBtn.disabled = !gameState.isRunning || gameState.isPaused;
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
    // 检查最少玩家数量
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
    gameState.randomSpeakOrder = elements.randomOrder ? elements.randomOrder.checked : false;
    gameState.aiKnowsModels = elements.aiKnowsModels ? elements.aiKnowsModels.checked : false;
    gameState.hostModel = elements.gameModel ? elements.gameModel.value : 'llama3.1';
    gameState.playerDefaultModel = elements.playerDefaultModel ? elements.playerDefaultModel.value : '__random__';
    gameState.intervalSeconds = parseInt(elements.intervalSeconds.value) || 3;
    gameState.gameApiKey = AppSettings.getApiKey();
    gameState.gameEndpoint = AppSettings.getEndpointV1();

    // 清除所有玩家角色，准备重新分配
    gameState.players.forEach(p => { p.role = ''; });
    
    // 随机分配身份（用户玩家也会参与）
    assignRoles();

    // 初始化玩家状态
    gameState.players.forEach(p => { p.alive = true; });

    addGameMessage('system', '主持人', '========== 狼人杀游戏开始 ==========\n游戏规则：好人找出狼人，狼人杀光好人。');

    // 身份分配只记录到私有消息（主持人可见）
    const hostMsg = gameState.players.map(p => `${p.name}(${p.role})`).join('、');
    if (!gameState.privateMessages['host']) gameState.privateMessages['host'] = [];
    gameState.privateMessages['host'].push({
        sender: '主持人',
        text: `【玩家身份】${hostMsg}`,
        time: new Date().toLocaleTimeString()
    });

    updateControlButtons();
    updatePhaseDisplay();

    // 开始夜晚阶段
    runNightPhase();
}

function assignRoles() {
    // 检查是否已有预设身份，如果有则保留
    const validRoles = ['预言家', '女巫', '猎人', '守卫', '白痴', '长老', '禁言长老', '摄梦人', '魔术师', '骑士', '平民', '狼人', '白狼王', '狼美人'];
    // 检查开关是否启用
    if (elements.autoAssignRoles && !elements.autoAssignRoles.checked) {
        // 开关关闭，不分配身份
        return;
    }

    const hasPresets = gameState.players.every(p => validRoles.includes(p.role));

    if (hasPresets) {
        // 已有预设身份，不再重新分配
        return;
    }

    // 根据玩家数量自动计算角色配置
    const count = gameState.players.length;
    const roles = generateRoleConfig(count);

    shuffleArray(roles);

    gameState.players.forEach((p, i) => {
        p.role = roles[i];
    });
}

// 根据人数生成角色配置
function generateRoleConfig(count) {
    // 扩展神职池
    const allGods = [
        '预言家', '女巫', '猎人', '守卫', '白痴',  // 基础神职
        '长老', '禁言长老', '摄梦人', '魔术师', '骑士'  // 进阶神职
    ];
    
    let wolfCount, godCount;
    
    // 根据人数计算狼人和神职数量
    if (count <= 5) {
        // 5人局：2狼 + 1神 + 2平民
        wolfCount = 2;
        godCount = 1;
    } else if (count <= 6) {
        // 6人局：2狼 + 2神 + 2平民
        wolfCount = 2;
        godCount = 2;
    } else if (count <= 8) {
        // 7-8人局：2-3狼 + 3-4神 + 2-3平民
        wolfCount = count - 6;  // 2-3狼
        godCount = 4;  // 3-4神
    } else if (count <= 10) {
        // 9-10人局：3-4狼 + 4-5神 + 2-3平民
        wolfCount = Math.floor(count * 0.35);
        godCount = Math.floor(count * 0.4);
    } else if (count <= 12) {
        // 11-12人局：4狼 + 4-5神 + 2-4平民
        wolfCount = 4;
        godCount = Math.floor(count * 0.4);
    } else if (count === 13) {
        // 13人局：4狼 + 5神 + 1白狼王 + 3平民
        wolfCount = 4;
        godCount = 5;
    } else if (count === 14) {
        // 14人局：4狼 + 5神 + 1白狼王 + 1狼美人 + 3平民
        wolfCount = 4;
        godCount = 5;
    } else if (count === 15) {
        // 15人局：5狼 + 5神 + 1白狼王 + 1狼美人 + 3平民
        wolfCount = 5;
        godCount = 5;
    } else {
        // 16人以上
        wolfCount = Math.min(6, Math.ceil(count * 0.3));
        godCount = Math.min(6, Math.ceil(count * 0.3));
    }
    
    const civilianCount = count - wolfCount - godCount;
    
    let roles = [];
    
    // 分配特殊狼
    let hasWhiteWolf = false;
    let hasWolfBeauty = false;
    
    if (count >= 9 && wolfCount >= 3) hasWhiteWolf = true;
    if (count >= 12 && wolfCount >= 4) hasWolfBeauty = true;
    
    if (hasWhiteWolf) roles.push('白狼王');
    if (hasWolfBeauty) roles.push('狼美人');
    
    // 剩余普通狼人
    const normalWolves = wolfCount - (hasWhiteWolf ? 1 : 0) - (hasWolfBeauty ? 1 : 0);
    for (let i = 0; i < normalWolves; i++) {
        roles.push('狼人');
    }
    
    // 分配神职（从扩展池中随机选择）
    const shuffledGods = [...allGods].sort(() => Math.random() - 0.5);
    for (let i = 0; i < godCount; i++) {
        roles.push(shuffledGods[i % shuffledGods.length]);
    }
    
    // 分配平民
    for (let i = 0; i < civilianCount; i++) {
        roles.push('平民');
    }
    
    return roles;
}

function stopGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.wolfTeamMessages = [];  // 清空狼人团队消息
    gameState.nightRoundRecords = [];  // 清空夜间记录
    gameState.currentNightRecord = null;
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
    gameState.currentNightRecord = {  // 初始化本轮夜间记录
        day: gameState.day,
        privateMessages: {},
        wolfTeamMessages: [],
        nightActions: {}
    };
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

    // 如果有狼人，进行狼人讨论和投票
    if (wolves.length > 0) {
        // 自动模式：狼人讨论+投票
        const targets = alive.filter(p => !wolves.some(w => w.id === p.id));
        if (targets.length > 0) {
            addGameMessage('system', '主持人', '【狼人团队】正在讨论...');

            let discussionLog = '';

            if (wolves.length === 1) {
                // 单狼直接决策
                const prompt = `你是狼人${wolves[0].name}。请分析局势，选择要杀死的玩家。

存活好人：${targets.map(t => `${t.name}(${t.description ? t.description.substring(0, 20) : '平民'})`).join('、')}

请直接说玩家名字，不要其他话。`;

                const response = await callPlayerAI(wolves[0], prompt);
                const targetName = parseName(response, targets.map(t => t.name));
                gameState.nightActions.wolfKill = targets.find(t => t.name === targetName) || targets[0];
            } else {
                // 多狼人讨论 - 只记录到主持人后台，不在公开界面显示
                const wolfOrder = [...wolves].map((wolf, index) => ({
                    name: `玩家${index + 1}`,
                    id: wolf.id,
                    realName: wolf.name
                }));
                
                // 获取白天的公开讨论记录
                const dayHistory = getDayHistory();
                
                // 记录开始讨论
                recordWolfTeamMessage('系统', '开始狼人团队讨论...');
                
                for (let i = 0; i < wolfOrder.length; i++) {
                    const speaker = wolfOrder[i];
                    const wolf = wolves.find(w => w.id === speaker.id);

                    const discussPrompt = `你是狼人${wolf.name}。你们狼人团队正在讨论要杀谁，请发表你的看法。

存活好人：${targets.map(t => t.name).join('、')}

【今天的公开讨论】（供你参考）
${dayHistory}

【狼人团队之前的讨论】
${discussionLog || '暂无'}

**注意：发言控制在30字以内，简短有力。最后说玩家名字。**`;

                    const response = await callPlayerAI(wolf, discussPrompt);
                    const targetName = parseName(response, targets.map(t => t.name));

                    discussionLog += `\n${speaker.name}: ${response}`;
                    // 只记录到主持人后台
                    recordWolfTeamMessage(speaker.name, response);
                }

                // 讨论结束，开始投票
                recordWolfTeamMessage('系统', '讨论结束，开始投票...');

                const votes = {};
                for (let i = 0; i < wolfOrder.length; i++) {
                    const speaker = wolfOrder[i];
                    const wolf = wolves.find(w => w.id === speaker.id);

                    const votePrompt = `你是狼人${wolf.name}。基于刚才的讨论，请投票决定要杀死的玩家。

存活好人：${targets.map(t => t.name).join('、')}

【今天的公开讨论】（供你参考）
${dayHistory}

【狼人团队讨论】
${discussionLog}

这是投票，直接说玩家名字，不要其他话。`;

                    const response = await callPlayerAI(wolf, votePrompt);
                    const targetName = parseName(response, targets.map(t => t.name));
                    votes[targetName] = (votes[targetName] || 0) + 1;

                    // 只记录到主持人后台
                    recordWolfTeamMessage(`${speaker.name}的投票`, targetName);
                }

                // 统计票数
                let maxVotes = 0;
                let killTarget = targets[0];
                Object.entries(votes).forEach(([name, count]) => {
                    if (count > maxVotes) {
                        maxVotes = count;
                        killTarget = targets.find(t => t.name === name);
                    }
                });

                gameState.nightActions.wolfKill = killTarget || targets[0];
            }

            // 记录私聊
            recordNightPrivateMessage(wolves, `最终决定杀 ${gameState.nightActions.wolfKill.name}`);
        }
    }

    // 女巫 - AI决策（在预言家之后，狼人杀人之后）
    const witch = alive.find(p => p.role === '女巫');
    if (witch && gameState.nightActions.wolfKill) {
        addGameMessage('system', '主持人', '【女巫】请选择是否救人...');

        // 构建女巫的决策prompt
        const prompt = `你是女巫。昨晚 ${gameState.nightActions.wolfKill.name} 被杀。

存活玩家：${alive.map(p => p.name).join('、')}

【今天的公开讨论】
${getDayHistory()}

根据局势分析，你是否使用解药救他？请回答"救"或"不救"，不要其他话。`;

        try {
            const response = await callPlayerAI(witch, prompt);
            if (response.includes('救')) {
                gameState.nightActions.witchSave = true;
                recordNightPrivateMessage([witch], '选择救人');
            } else {
                recordNightPrivateMessage([witch], '选择不救');
            }

            // 女巫毒药决策
            const poisonTargets = alive.filter(p => p.id !== witch.id && p.id !== gameState.nightActions.wolfKill.id);
            if (poisonTargets.length > 0) {
                const poisonPrompt = `你是女巫。你还有毒药。

可毒的玩家：${poisonTargets.map(t => t.name).join('、')}

【今天的公开讨论】
${getDayHistory()}

是否使用毒药？请回答玩家名字或"不毒"。`;

                try {
                    const poisonResponse = await callPlayerAI(witch, poisonPrompt);
                    const targetName = parseName(poisonResponse, poisonTargets.map(t => t.name));

                    if (targetName && !poisonResponse.includes('不毒')) {
                        const poisonTarget = poisonTargets.find(t => t.name === targetName);
                        if (poisonTarget) {
                            gameState.nightActions.witchPoison = poisonTarget;
                            recordNightPrivateMessage([witch], `选择毒 ${poisonTarget.name}`);
                        }
                    }
                } catch (e) {
                    // 毒药决策失败，不使用
                }
            }
        } catch (e) {
            // 随机决定
            if (Math.random() > 0.5) {
                gameState.nightActions.witchSave = true;
                recordNightPrivateMessage([witch], '选择救人（随机）');
            }
        }
    }

    // 预言家 - AI决策
    const seer = alive.find(p => p.role === '预言家');
    if (seer) {
        addGameMessage('system', '主持人', '【预言家】请选择要查验的玩家...');
        const checkTargets = alive.filter(p => p.id !== seer.id);
        if (checkTargets.length > 0) {
            const prompt = `你是预言家。请选择要查验的玩家。

存活玩家：${checkTargets.map(t => t.name).join('、')}

【今天的公开讨论】
${getDayHistory()}

请直接说玩家名字，不要其他话。`;

            try {
                const response = await callPlayerAI(seer, prompt);
                const targetName = parseName(response, checkTargets.map(t => t.name));
                const target = checkTargets.find(t => t.name === targetName) || checkTargets[0];
                gameState.nightActions.seerCheck = { name: target.name, isWolf: target.role === '狼人' || target.role === '白狼王' || target.role === '狼美人' };
                recordNightPrivateMessage([seer], `查验 ${target.name}，他是${target.role === '狼人' || target.role === '白狼王' || target.role === '狼美人' ? '狼人' : '好人'}`);
            } catch (e) {
                // 随机选择
                const target = checkTargets[Math.floor(Math.random() * checkTargets.length)];
                gameState.nightActions.seerCheck = { name: target.name, isWolf: target.role === '狼人' };
                recordNightPrivateMessage([seer], `查验 ${target.name}，他是${target.role === '狼人' ? '狼人' : '好人'}`);
            }
        }
    }

    // 守卫 - AI决策
    const guard = alive.find(p => p.role === '守卫');
    if (guard) {
        const protectTargets = alive.filter(p => p.id !== guard.id);
        if (protectTargets.length > 0) {
            const prompt = `你是守卫。请选择要守护的玩家。

存活玩家：${protectTargets.map(t => t.name).join('、')}

【今天的公开讨论】
${getDayHistory()}

请直接说玩家名字，不要其他话。`;

            try {
                const response = await callPlayerAI(guard, prompt);
                const targetName = parseName(response, protectTargets.map(t => t.name));
                const target = protectTargets.find(t => t.name === targetName) || protectTargets[0];
                gameState.nightActions.guardProtect = target;
                recordNightPrivateMessage([guard], `选择守护 ${target.name}`);
            } catch (e) {
                // 随机选择
                const target = protectTargets[Math.floor(Math.random() * protectTargets.length)];
                gameState.nightActions.guardProtect = target;
                recordNightPrivateMessage([guard], `选择守护 ${target.name}`);
            }
        }
    }

    // 进入白天
    setTimeout(showDayAnnounce, 1000);
}

// 记录夜间私聊
function recordNightPrivateMessage(players, text) {
    const time = new Date().toLocaleTimeString();
    const isWolfTeam = players.length > 1 && players.every(p => p.role === '狼人');
    const senderName = isWolfTeam ? '狼人团队' : '主持人';
    
    players.forEach(player => {
        const playerId = player.id;
        if (!gameState.privateMessages[playerId]) {
            gameState.privateMessages[playerId] = [];
        }
        gameState.privateMessages[playerId].push({
            sender: senderName,
            text: text,
            time: time,
            type: 'private'
        });
        
        // 记录到当前轮次
        if (gameState.currentNightRecord) {
            if (!gameState.currentNightRecord.privateMessages[playerId]) {
                gameState.currentNightRecord.privateMessages[playerId] = [];
            }
            gameState.currentNightRecord.privateMessages[playerId].push({
                sender: senderName,
                text: text,
                time: time,
                type: 'private'
            });
        }
    });
    
    // 如果是狼人团队消息，也记录到团队消息中
    if (isWolfTeam) {
        gameState.wolfTeamMessages.push({
            sender: senderName,
            text: text,
            time: time,
            type: 'team'
        });
        
        // 记录到当前轮次
        if (gameState.currentNightRecord) {
            gameState.currentNightRecord.wolfTeamMessages.push({
                sender: senderName,
                text: text,
                time: time,
                type: 'team'
            });
        }
    }
}

// 记录狼人团队发言
function recordWolfTeamMessage(sender, text) {
    const time = new Date().toLocaleTimeString();
    gameState.wolfTeamMessages.push({
        sender: sender,
        text: text,
        time: time,
        type: 'team'
    });
    
    // 记录到当前轮次
    if (gameState.currentNightRecord) {
        gameState.currentNightRecord.wolfTeamMessages.push({
            sender: sender,
            text: text,
            time: time,
            type: 'team'
        });
    }
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
    const startTime = Date.now();
    try {
        const response = await fetch(`${gameState.gameEndpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gameState.gameApiKey}` },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }], stream: false })
        });
        const data = await response.json();
        const msg = data.choices[0].message;
        const result = msg.content || msg.reasoning || '';
        APILogger.log({ source: '狼人杀', model, endpoint: gameState.gameEndpoint, prompt, response: result, reasoning: msg.reasoning || '', duration: Date.now() - startTime, success: true });
        return result;
    } catch (e) {
        APILogger.log({ source: '狼人杀', model, endpoint: gameState.gameEndpoint, prompt, duration: Date.now() - startTime, success: false, error: e.message });
        console.error('本地AI调用失败:', e);
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

    // 保存本轮夜间记录
    if (gameState.currentNightRecord) {
        gameState.currentNightRecord.nightActions = { ...gameState.nightActions };
        gameState.nightRoundRecords.push(gameState.currentNightRecord);
        gameState.currentNightRecord = null;
    }

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
    if (speaker.isUser && elements.userMsgInput) {
        // 暂停游戏并打开用户后台
        gameState.isPaused = true;
        updateControlButtons();
        addGameMessage('system', '主持人', `【发言】轮到你发言了，请点击"我的后台"按钮或等待自动打开`);
        elements.userMsgInput.placeholder = "请输入你的发言...";
        elements.userMsgInput.focus();
        gameState.waitingForUser = true;

        // 自动打开用户后台
        if (typeof openUserModal === 'function') {
            openUserModal();
        }
        if (typeof switchUserTab === 'function') {
            switchUserTab('info');
        }
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
            return `${p.name}使用的是${displayModel}模型`;
        });
        if (otherPlayers.length > 0) {
            modelInfo = `\n【其他玩家AI信息】${otherPlayers.join('；')}`;
        }
    }

    return `${speaker.name}，你是${speaker.role}。
${speaker.description}

【存活玩家】${alive.map(p => p.name).join('、')}
【死亡玩家】${gameState.deadPlayers.map(p => p.name).join('、') || '无'}${modelInfo}
${secretInfo}

【之前的发言】
${history}

${speaker.role.includes('狼人') || speaker.role === '白狼王' || speaker.role === '狼美人' 
    ? '请分析局势，进行发言，为团队找出有价值的目标，隐藏身份并干扰好人。' 
    : '请分析局势，进行发言，分析谁是好人、谁是狼人。'}

**注意：发言控制在50字以内，简短有力。**`;
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
        console.error('玩家AI调用失败:', e);
        return '';
    }
}

function sendUserMessage() {
    if (!gameState.waitingForUser) return;
    if (!elements.userMsgInput) return;

    const text = elements.userMsgInput.value.trim();
    if (!text) return;

    addGameMessage('user', '你', text);
    elements.userMsgInput.value = '';
    gameState.waitingForUser = false;

    gameState.currentSpeakerIndex++;
    gameState.phaseInterval = setTimeout(handleDaySpeak, 500);
}

// ==================== 投票阶段 ====================
async function handleVote() {
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
        await countVotes();
        return;
    }

    const voter = alive[gameState.currentSpeakerIndex];
    const targets = alive.filter(p => p.id !== voter.id);

    if (voter.isUser && elements.userMsgInput) {
        // 暂停游戏
        gameState.isPaused = true;
        updateControlButtons();
        addGameMessage('system', '主持人', `【投票】轮到你投票了，请点击"我的后台"按钮或等待自动打开`);
        elements.userMsgInput.placeholder = "输入你要投票的玩家名字...";
        elements.userMsgInput.focus();
        gameState.waitingForUserVote = true;

        // 自动打开用户后台
        if (typeof openUserModal === 'function') {
            openUserModal();
        }
        if (typeof switchUserTab === 'function') {
            switchUserTab('info');
        }
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

async function countVotes() {
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

        // 猎人死亡处理
        if (eliminated.role === '猎人') {
            await handleHunterDeath(eliminated);
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

// 猎人死亡处理（AI决策）
async function handleHunterDeath(hunter) {
    const alive = gameState.players.filter(p => p.alive);
    if (alive.length <= 1) {
        addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，但没有可选目标`);
        return;
    }

    // 排除猎人自己
    const targets = alive.filter(p => p.id !== hunter.id);

    addGameMessage('system', '主持人', `${hunter.name} 是猎人，正在选择要带走谁...`);

    // 使用AI决策
    if (targets.length > 0) {
        // 获取白天的讨论记录作为参考
        const dayHistory = getDayHistory();

        const prompt = `你是猎人${hunter.name}。你被投出了，现在要发动技能带走一名玩家。

存活玩家：${targets.map(t => t.name).join('、')}

【今天的讨论】（供你参考）
${dayHistory}

请选择要带走的一名玩家，直接说玩家名字，不要其他话。`;

        try {
            const response = await callPlayerAI(hunter, prompt);
            const targetName = parseName(response, targets.map(t => t.name));
            const shot = targets.find(t => t.name === targetName) || targets[0];

            if (shot) {
                shot.alive = false;
                gameState.deadPlayers.push(shot);
                addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}（${shot.role}）`);

                // 检查被带走的是否是猎人，如果是则触发二次猎人效应
                if (shot.role === '猎人' && shot.id !== hunter.id) {
                    await handleHunterDeath(shot);
                }
            }
        } catch (e) {
            // 随机选择
            const shot = targets[Math.floor(Math.random() * targets.length)];
            if (shot) {
                shot.alive = false;
                gameState.deadPlayers.push(shot);
                addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}（随机选择）`);
            }
        }
    }
}

// 主持人后台手动触发猎人射击
async function triggerHunterShoot() {
    const alive = gameState.players.filter(p => p.alive);
    const hunter = alive.find(p => p.role === '猎人');
    
    if (!hunter) {
        alert('没有存活的猎人');
        return;
    }
    
    const targets = alive.filter(p => p.id !== hunter.id);
    if (targets.length === 0) {
        alert('没有可射击的目标');
        return;
    }

    // 获取白天的讨论记录作为参考
    const dayHistory = getDayHistory();
    
    const prompt = `你是猎人${hunter.name}。你要发动技能带走一名玩家。

存活玩家：${targets.map(t => t.name).join('、')}

【今天的讨论】（供你参考）
${dayHistory}

请选择要带走的一名玩家，直接说玩家名字，不要其他话。`;

    const response = await callPlayerAI(hunter, prompt);
    const targetName = parseName(response, targets.map(t => t.name));
    const shot = targets.find(t => t.name === targetName) || targets[0];
    
    if (shot) {
        shot.alive = false;
        gameState.deadPlayers.push(shot);
        addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}`);
        alert(`猎人带走了 ${shot.name}`);
        checkWinCondition();
    }
}

function checkWinCondition() {
    const alive = gameState.players.filter(p => p.alive);
    const wolves = alive.filter(p => p.role === '狼人' || p.role === '白狼王' || p.role === '狼美人');
    const goods = alive.filter(p => p.role !== '狼人' && p.role !== '白狼王' && p.role !== '狼美人');

    if (wolves.length === 0) endGame('好人胜利！狼人全部出局！');
    else if (wolves.length >= goods.length) endGame('狼人胜利！好人已经无法对抗狼人！');
}

function endGame(result) {
    gameState.isRunning = false;
    gameState.phase = PHASE.GAME_END;
    gameState.wolfTeamMessages = [];  // 清空狼人团队消息
    gameState.nightRoundRecords = [];  // 清空夜间记录
    gameState.currentNightRecord = null;
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

    // 处理每轮的夜间记录，插入到对应天亮之后
    let nightRecordIndex = 0;
    const nightRecords = gameState.nightRoundRecords || [];
    
    gameState.messages.forEach(msg => {
        // 检查是否是"天亮了"消息，如果是则插入该轮的夜间记录
        if (msg.text && msg.text.includes('天亮了') && nightRecordIndex < nightRecords.length) {
            const record = nightRecords[nightRecordIndex];
            content += formatNightRecord(record);
            nightRecordIndex++;
        }
        
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

function formatNightRecord(record) {
    let text = '\n---\n### 【第' + record.day + '夜 - 主持人后台记录】\n\n';
    
    // 狼人团队消息
    if (record.wolfTeamMessages && record.wolfTeamMessages.length > 0) {
        text += '#### 🐺 狼人团队聊天\n';
        record.wolfTeamMessages.forEach(msg => {
            text += `- **${msg.sender}**: ${msg.text}\n`;
        });
        text += '\n';
    }
    
    // 各个玩家的私聊记录
    const playerIds = Object.keys(record.privateMessages || {});
    if (playerIds.length > 0) {
        text += '#### 👤 夜间私聊记录\n';
        playerIds.forEach(playerId => {
            const msgs = record.privateMessages[playerId];
            if (msgs && msgs.length > 0) {
                const player = gameState.players.find(p => p.id === playerId);
                const playerName = player ? player.name : playerId;
                const playerRole = player ? player.role : '';
                text += `**${playerName} (${playerRole})**:\n`;
                msgs.forEach(msg => {
                    text += `- ${msg.sender}: ${msg.text}\n`;
                });
                text += '\n';
            }
        });
    }
    
    // 夜间行动结果
    if (record.nightActions) {
        text += '#### 📋 夜间行动结果\n';
        if (record.nightActions.wolfKill) {
            text += `- 狼人杀人: ${record.nightActions.wolfKill.name}\n`;
        }
        if (record.nightActions.seerCheck) {
            text += `- 预言家查验: ${record.nightActions.seerCheck.name} (${record.nightActions.seerCheck.isWolf ? '狼人' : '好人'})\n`;
        }
        if (record.nightActions.witchSave !== undefined) {
            text += `- 女巫救人: ${record.nightActions.witchSave ? '是' : '否'}\n`;
        }
        if (record.nightActions.witchPoison) {
            text += `- 女巫毒药: ${record.nightActions.witchPoison.name}\n`;
        }
        if (record.nightActions.guardProtect) {
            text += `- 守卫守护: ${record.nightActions.guardProtect.name}\n`;
        }
        if (record.nightActions.whiteWolfKingKill) {
            text += `- 白狼王自爆: ${record.nightActions.whiteWolfKingKill.name}\n`;
        }
        if (record.nightActions.wolfBeautyKill) {
            text += `- 狼美人魅惑: ${record.nightActions.wolfBeautyKill.name}\n`;
        }
        if (record.nightActions.hunterShoot !== undefined) {
            text += `- 猎人开枪: ${record.nightActions.hunterShoot ? '是' : '否'}\n`;
        }
        text += '\n';
    }
    
    text += '---\n\n';
    return text;
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
        nightRoundRecords: gameState.nightRoundRecords,
        nightActions: gameState.nightActions,
        currentNightRecord: gameState.currentNightRecord,
        day: gameState.day,
        phase: gameState.phase,
        settings: {
            intervalSeconds: elements.intervalSeconds.value,
            gameModel: elements.gameModel.value,
            randomOrder: elements.randomOrder ? elements.randomOrder.checked : false,
            aiKnowsModels: elements.aiKnowsModels ? elements.aiKnowsModels.checked : false,
            showModelInfo: elements.showModelInfo ? elements.showModelInfo.checked : false,
            autoAssignRoles: elements.autoAssignRoles ? elements.autoAssignRoles.checked : true
        }
    }));
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('werewolf_data'));
        if (data) {
            gameState.players = data.players || [];
            gameState.messages = data.messages || [];
            gameState.nightRoundRecords = data.nightRoundRecords || [];
            gameState.nightActions = data.nightActions || {};
            gameState.currentNightRecord = data.currentNightRecord || null;
            gameState.day = data.day || 1;
            gameState.phase = data.phase || 'day';
            if (data.settings) {
                elements.intervalSeconds.value = data.settings.intervalSeconds || 3;
                elements.gameModel.value = data.settings.gameModel || 'llama3.1';
                if (elements.randomOrder) elements.randomOrder.checked = data.settings.randomOrder || false;
                if (elements.aiKnowsModels) elements.aiKnowsModels.checked = data.settings.aiKnowsModels !== false;
                if (elements.showModelInfo) elements.showModelInfo.checked = data.settings.showModelInfo !== false;
                if (elements.autoAssignRoles) elements.autoAssignRoles.checked = data.settings.autoAssignRoles !== false;
            }
        }
    } catch (e) { console.error('加载失败:', e); }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    gameState.editingPlayerId = null;
}

// ==================== 主持人后台 ====================
function openHostModal() {
    elements.hostModal.classList.add('show');
    gameState.hostTab = 'players';
    renderHostPlayersList();
    renderHostChat();
}

function switchHostTab(tab) {
    gameState.hostTab = tab;
    // 更新标签按钮样式
    document.querySelectorAll('.host-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderHostChat();
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
    // 如果是狼人团队标签，渲染狼人团队聊天
    if (gameState.hostTab === 'wolf-team') {
        renderHostWolfTeamChat();
        return;
    }
    
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

function renderHostWolfTeamChat() {
    const wolves = gameState.players.filter(p => p.role === '狼人' && p.alive);
    const teamMsgs = gameState.wolfTeamMessages || [];
    
    let html = `
        <div style="margin-bottom:10px;padding:10px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
            <strong>🐺 狼人团队聊天</strong>
            <span style="color:#666;margin-left:10px;">存活狼人: ${wolves.map(w => w.name).join('、') || '无'}</span>
        </div>
    `;

    if (teamMsgs.length === 0) {
        html += '<div class="empty-state"><p>暂无狼人团队聊天记录</p></div>';
    } else {
        html += teamMsgs.map(msg => `
            <div class="host-message wolf-team">
                <div class="msg-sender">${escapeHtml(msg.sender)}</div>
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

    // 如果是狼人团队标签，发送消息到狼人团队
    if (gameState.hostTab === 'wolf-team') {
        recordWolfTeamMessage('主持人', text);
        addGameMessage('system', '主持人', `【狼人团队】${text}`);
        elements.hostMsgInput.value = '';
        renderHostChat();
        return;
    }

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

    // 狼人讨论决策逻辑
    const history = getNightHistory('狼人');

    addGameMessage('system', '主持人', '【狼人团队】正在讨论...');

    let discussionLog = '';

    // 获取白天的公开讨论记录
    const dayHistory = getDayHistory();
    
    if (wolves.length === 1) {
        // 单狼直接决策
        const prompt = `你是狼人${wolves[0].name}。请分析局势，选择要杀死的玩家。

存活好人：${targets.map(t => `${t.name}(${t.description ? t.description.substring(0, 20) : '平民'})`).join('、')}

【今天的公开讨论】
${dayHistory}

【之前的夜间对话】
${history || '暂无'}

请直接说玩家名字，不要其他话。`;

        const response = await callPlayerAI(wolves[0], prompt);
        const targetName = parseName(response, targets.map(t => t.name));
        gameState.nightActions.wolfKill = targets.find(t => t.name === targetName) || targets[0];
        discussionLog = `${wolves[0].name}: 选择杀 ${gameState.nightActions.wolfKill.name}`;
    } else {
        // 多狼人讨论 - 只在主持人后台进行，不在公开界面显示
        const wolfOrder = [...wolves].map((wolf, index) => ({
            name: `玩家${index + 1}`,
            id: wolf.id,
            realName: wolf.name
        }));
        
        // 记录开始讨论
        recordWolfTeamMessage('系统', '开始狼人团队讨论...');
        
        for (let i = 0; i < wolfOrder.length; i++) {
            const speaker = wolfOrder[i];
            const wolf = wolves.find(w => w.id === speaker.id);

            const discussPrompt = `你是狼人${wolf.name}。你们狼人团队正在讨论要杀谁，请发表你的看法。

存活好人：${targets.map(t => t.name).join('、')}

【今天的公开讨论】（供你参考）
${dayHistory}

【狼人团队之前的讨论】
${discussionLog || '暂无'}

请表达你的看法和建议，直接说玩家名字，不要其他话。`;

            const response = await callPlayerAI(wolf, discussPrompt);
            const targetName = parseName(response, targets.map(t => t.name));

            discussionLog += `\n${speaker.name}: ${response}`;
            // 只记录到主持人后台，不在公开界面显示
            recordWolfTeamMessage(speaker.name, response);
        }

        // 讨论结束，开始投票
        recordWolfTeamMessage('系统', '讨论结束，开始投票...');

        const votes = {};
        for (let i = 0; i < wolfOrder.length; i++) {
            const speaker = wolfOrder[i];
            const wolf = wolves.find(w => w.id === speaker.id);

            const votePrompt = `你是狼人${wolf.name}。基于刚才的讨论，请投票决定要杀死的玩家。

存活好人：${targets.map(t => t.name).join('、')}

【今天的公开讨论】（供你参考）
${dayHistory}

【狼人团队讨论】
${discussionLog}

直接说玩家名字，不要其他话。`;

            const response = await callPlayerAI(wolf, votePrompt);
            const targetName = parseName(response, targets.map(t => t.name));
            votes[targetName] = (votes[targetName] || 0) + 1;

            // 只记录到主持人后台
            recordWolfTeamMessage(`${speaker.name}的投票`, targetName);
        }

        // 统计票数
        let maxVotes = 0;
        let killTarget = targets[0];
        Object.entries(votes).forEach(([name, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                killTarget = targets.find(t => t.name === name);
            }
        });

        // 最终决定
        const finalDecision = killTarget ? killTarget.name : targets[0].name;
        recordWolfTeamMessage('狼人团队', `最终决定杀 ${finalDecision}`);
        gameState.nightActions.wolfKill = killTarget || targets[0];
    }

    // 记录私聊
    const killTarget = gameState.nightActions.wolfKill;
    recordNightPrivateMessage(wolves, `最终决定杀 ${killTarget ? killTarget.name : '未知'}`);
    addGameMessage('system', '主持人', `【狼人团队】已做出选择：杀死 ${killTarget ? killTarget.name : '未知'}`);
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
    
    addGameMessage('system', '主持人', '【预言家】已做出选择');
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

    // 第一步：询问是否救人
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
    
    // 第二步：询问是否用毒药（需要夜晚可杀的目标）
    const poisonTargets = alive.filter(p => p.id !== witch.id && p.id !== killed.id);
    if (poisonTargets.length > 0) {
        const poisonPrompt = `你是女巫。你还有毒药吗？（假设你有）
    
可毒的玩家：${poisonTargets.map(t => t.name).join('、')}

是否使用毒药毒死一名玩家？请回答玩家名字或"不毒"。

直接回答玩家名字或"不毒"，不要其他话。`;
        
        const poisonResponse = await callPlayerAI(witch, poisonPrompt);
        const targetName = parseName(poisonResponse, poisonTargets.map(t => t.name));
        
        if (targetName && !poisonResponse.includes('不毒')) {
            const poisonTarget = poisonTargets.find(t => t.name === targetName);
            if (poisonTarget) {
                gameState.nightActions.witchPoison = poisonTarget;
                recordNightPrivateMessage([witch], `选择毒 ${poisonTarget.name}`);
                addGameMessage('system', '主持人', `【女巫】使用了毒药`);
                alert(`女巫选择毒 ${poisonTarget.name}`);
            }
        } else {
            recordNightPrivateMessage([witch], '选择不毒');
        }
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

// 获取白天的公开聊天记录（当前天的白天发言）
function getDayHistory() {
    const currentDay = gameState.day;
    // 找到最近一次"天黑请闭眼"之后的消息（即当前白天阶段的发言）
    const nightIndex = gameState.messages.findLastIndex(msg => 
        msg.text && msg.text.includes('天黑请闭眼')
    );
    
    const dayMessages = nightIndex >= 0 
        ? gameState.messages.slice(nightIndex + 1).filter(msg => msg.type !== 'system')
        : gameState.messages.filter(msg => msg.type !== 'system');
    
    if (dayMessages.length === 0) return '暂无白天的公开讨论';
    
    return dayMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
}

// ==================== AI生成单个玩家 ====================
async function generatePlayer(event) {
    const nameInput = elements.playerName;
    const descInput = elements.playerDesc;
    const modelSelect = elements.playerModel;
    const endpointInput = elements.playerEndpoint;
    const apiKeyInput = elements.playerApiKey;

    const btn = event?.target;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    }

    const selectedModel = modelSelect ? modelSelect.value : '__random_all__';
    const model = resolveModel(selectedModel);
    const endpoint = endpointInput ? endpointInput.value.trim() : AppSettings.getEndpointV1();
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : AppSettings.getApiKey();

    let prompt;
    if (nameInput.value.trim() && descInput.value.trim()) {
        prompt = `请基于以下狼人杀玩家信息，生成更丰富的性格描述（50字左右，包含发言风格、策略特点）：

玩家名: ${nameInput.value.trim()}
原有描述: ${descInput.value.trim()}

请直接返回性格描述，不要其他解释。`;
    } else {
        prompt = `请生成一个有趣的狼人杀AI玩家角色。
请直接返回以下格式的内容，不要其他解释：
名字: xxx
性格: xxx（50字以内，描述发言风格和策略特点）`;
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

        // 解析返回的内容
        const nameMatch = text.match(/名字[：:]\s*(.+?)(?:\n|$)/);
        const descMatch = text.match(/性格[：:]\s*(.+?)(?:\n|$)/);

        if (nameInput.value.trim() === '' && nameMatch) {
            nameInput.value = nameMatch[1].trim();
        }
        if (descMatch) {
            descInput.value = descMatch[1].trim();
        } else {
            descInput.value = text.replace(/^.*性格[：:]\s*/, '').trim();
        }
    } catch (e) {
        console.error('生成失败:', e);
        alert('生成失败: ' + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> AI自动生成';
        }
    }
}

// ==================== 一键生成玩家 ====================
async function generateMultiplePlayers() {
    const count = parseInt(elements.generateCount ? elements.generateCount.value : 8);
    const model = resolveModel(elements.generateModel ? elements.generateModel.value : '__random_all__');

    // 使用统一的角色配置生成函数
    const roles = generateRoleConfig(count);
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

    // AI生成角色信息
    const prompt = `你需要生成${count}个狼人杀游戏中的AI玩家角色。
要求：
1. 每个角色有独特的名字和性格描述，要正常的人名或者网名
2. 性格描述要体现玩家的发言风格和策略特点（50字以内）
3. 输出格式为JSON数组，每个元素格式：{"name":"名字","desc":"性格描述"}

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
                model: gameState.playerDefaultModel || '__random_all__',
                endpoint: AppSettings.getEndpointV1(),
                apiKey: AppSettings.getApiKey(),
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

// ==================== 用户参与游戏功能 ====================

// 打开用户后台
function openUserModal() {
    if (!elements.userModal) return;
    updateUserPanel();
    elements.userModal.classList.add('show');
}

// 关闭用户后台
function closeUserModal() {
    if (elements.userModal) {
        elements.userModal.classList.remove('show');
    }
}

// 更新用户后台面板
function updateUserPanel() {
    // 找到用户玩家
    const userPlayer = gameState.players.find(p => p.isUser);
    if (!userPlayer) {
        alert('你还不是游戏中的玩家');
        return;
    }
    
    // 更新角色信息
    if (elements.userMyRole) {
        elements.userMyRole.textContent = userPlayer.role;
    }
    if (elements.userAliveStatus) {
        elements.userAliveStatus.textContent = userPlayer.alive ? '存活' : '已死亡';
        elements.userAliveStatus.style.color = userPlayer.alive ? 'green' : 'red';
    }
    
    // 更新角色徽章
    if (elements.userRoleBadge) {
        elements.userRoleBadge.textContent = userPlayer.role;
        // 根据角色类型设置颜色
        const isWolf = ['狼人', '白狼王', '狼美人'].includes(userPlayer.role);
        const isGod = ['预言家', '女巫', '猎人', '守卫', '白痴', '长老', '禁言长老', '摄梦人', '魔术师', '骑士'].includes(userPlayer.role);
        elements.userRoleBadge.className = 'role-badge ' + (isWolf ? 'wolf' : isGod ? 'god' : 'civilian');
    }
    
    // 更新专属信息
    updateUserSecrets(userPlayer);
    
    // 更新团队聊天
    if (['狼人', '白狼王', '狼美人'].includes(userPlayer.role)) {
        renderUserWolfTeamChat();
    }
}

// 更新用户专属信息
function updateUserSecrets(userPlayer) {
    if (!elements.userSecretContent) return;
    
    let secrets = '';
    
    // 狼人能看到其他狼人
    if (['狼人', '白狼王', '狼美人'].includes(userPlayer.role)) {
        const wolves = gameState.players.filter(p => 
            p.alive && ['狼人', '白狼王', '狼美人'].includes(p.role)
        );
        secrets += `<p><strong>你的狼队友：</strong>${wolves.map(w => w.name).join('、')}</p>`;
    }
    
    // 预言家能看到验人结果
    if (userPlayer.role === '预言家' && gameState.nightActions && gameState.nightActions.seerCheck) {
        const check = gameState.nightActions.seerCheck;
        secrets += `<p><strong>昨晚验人结果：</strong>${check.name} 是 ${check.isWolf ? '狼人' : '好人'}</p>`;
    }
    
    // 女巫能看到用药情况
    if (userPlayer.role === '女巫') {
        secrets += `<p><strong>解药状态：</strong>${gameState.witchSaved ? '已使用' : '未使用'}</p>`;
        secrets += `<p><strong>毒药状态：</strong>${gameState.witchPoisoned ? '已使用' : '未使用'}</p>`;
    }
    
    // 猎人
    if (userPlayer.role === '猎人') {
        secrets += `<p><strong>猎人技能：</strong>${userPlayer.alive ? '可用' : '已发动或死亡'}</p>`;
    }
    
    if (secrets === '') {
        secrets = '<p>暂无专属信息</p>';
    }
    
    elements.userSecretContent.innerHTML = secrets;
}

// 切换用户后台标签页
function switchUserTab(tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.user-tab-content').forEach(el => {
        el.style.display = 'none';
    });
    // 移除所有按钮的active状态
    document.querySelectorAll('.user-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签
    const targetTab = document.getElementById(`user-tab-${tabName}`);
    if (targetTab) targetTab.style.display = 'block';
    
    // 添加active状态
    const targetBtn = document.querySelector(`.user-tab-btn[data-tab="${tabName}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // 根据标签页刷新内容
    if (tabName === 'team') {
        renderUserWolfTeamChat();
    }
}

// 渲染用户狼人团队聊天
function renderUserWolfTeamChat() {
    if (!elements.userWolfTeamChat) return;
    
    const userPlayer = gameState.players.find(p => p.isUser);
    if (!userPlayer || !['狼人', '白狼王', '狼美人'].includes(userPlayer.role)) {
        elements.userWolfTeamChat.innerHTML = '<div class="empty-state"><p>只有狼人阵营才能看到团队聊天</p></div>';
        return;
    }
    
    const msgs = gameState.wolfTeamMessages || [];
    if (msgs.length === 0) {
        elements.userWolfTeamChat.innerHTML = '<div class="empty-state"><p>暂无团队聊天记录</p></div>';
        return;
    }
    
    elements.userWolfTeamChat.innerHTML = msgs.map(m =>
        `<div class="chat-message ${escapeHtml(m.sender === userPlayer.name ? 'my-message' : '')}">
            <span class="msg-sender">${escapeHtml(m.sender)}:</span>
            <span class="msg-text">${escapeHtml(m.text)}</span>
        </div>`
    ).join('');
    
    elements.userWolfTeamChat.scrollTop = elements.userWolfTeamChat.scrollHeight;
}

// 发送用户团队消息
function sendUserTeamMessage() {
    const input = elements.userTeamMsgInput;
    const text = input.value.trim();
    if (!text) return;
    
    const userPlayer = gameState.players.find(p => p.isUser);
    if (!userPlayer) return;
    
    // 记录到狼人团队消息
    gameState.wolfTeamMessages.push({
        sender: userPlayer.name,
        text: text,
        time: Date.now()
    });
    
    input.value = '';
    renderUserWolfTeamChat();
}

// 用户回合暂停游戏并打开后台
function pauseForUserAction(actionType, actionData) {
    gameState.isPaused = true;
    gameState.waitingForUserAction = true;
    gameState.userCurrentAction = { type: actionType, data: actionData };
    
    updateControlButtons();
    
    // 根据行动类型显示不同的UI
    if (actionType === 'speak') {
        // 白天发言
        addGameMessage('system', '主持人', `【发言】轮到你发言了`);
        elements.userMsgInput.placeholder = "请输入你的发言...";
        elements.userMsgInput.focus();
    } else if (actionType === 'vote') {
        // 投票
        addGameMessage('system', '主持人', `【投票】轮到你投票了`);
        elements.userMsgInput.placeholder = "输入你要投票的玩家名字...";
        elements.userMsgInput.focus();
    } else if (actionType === 'night') {
        // 夜间行动
        openUserModal();
        switchUserTab('night');
    }
}

// 用户完成行动后继续游戏
function resumeFromUserAction() {
    gameState.isPaused = false;
    gameState.waitingForUserAction = false;
    gameState.userCurrentAction = null;
    
    updateControlButtons();
}

// 初始化角色能力系统
function initializeRoleSystem() {
    roleAbilitySystem = new RoleAbilitySystem(gameState);
    aiImprovements = new WerewolfAI();

    // 添加角色能力说明到界面
    addRoleAbilityDescriptions();
}

// 添加角色能力说明
function addRoleAbilityDescriptions() {
    const roleDescriptions = document.createElement('div');
    roleDescriptions.className = 'role-ability-section';
    roleDescriptions.innerHTML = `
        <h3><i class="fas fa-info-circle"></i> 高级角色能力说明</h3>
        <div class="role-grid">
            ${Object.entries(ADVANCED_ROLES).map(([key, role]) => `
                <div class="role-card ${role.team}">
                    <h4>${role.name}</h4>
                    <p>${role.description}</p>
                </div>
            `).join('')}
        </div>
    `;

    // 插入到游戏设置面板
    const settingsSection = document.querySelector('.settings-panel');
    if (settingsSection && !document.querySelector('.role-ability-section')) {
        settingsSection.appendChild(roleDescriptions);
    }
}

// 启动游戏时初始化
function startGame() {
    initializeRoleSystem();
    // ... 其他启动逻辑
}

// 游戏开始
document.addEventListener('DOMContentLoaded', () => {
    initializeRoleSystem();

    // 绑定AI增强的API调用
    if (typeof callAPI !== 'undefined') {
        // 覆盖原始callAPI以使用增强版本
        const originalCallAPI = callAPI;
        callAPI = async (options) => {
            // 这里可以添加全局的AI增强逻辑
            return await originalCallAPI(options);
        };
    }

    // ... 其他初始化代码
});

// 导出夜间行动函数到全局
window.triggerWolfKill = triggerWolfKill;
window.triggerSeerCheck = triggerSeerCheck;
window.triggerWitchAction = triggerWitchAction;
window.triggerGuardProtect = triggerGuardProtect;
window.triggerHunterShoot = triggerHunterShoot;
window.finishNightPhase = finishNightPhase;
window.closeUserModal = closeUserModal;
window.switchUserTab = switchUserTab;
window.initializeRoleSystem = initializeRoleSystem;
window.startGame = startGame;
