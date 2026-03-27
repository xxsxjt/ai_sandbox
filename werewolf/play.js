// ==================== 狼人杀游戏逻辑 - 纯净体验版 ====================
// 复用 werewolf.js 的核心逻辑，去掉主持人后台相关功能

// ==================== 工具函数 ====================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ==================== 游戏阶段 ====================
const PHASE = {
    SETUP: 'setup',
    NIGHT: 'night',
    DAY_ANNOUNCE: 'day_announce',
    DAY_SPEAK: 'day_speak',
    DAY_VOTE: 'day_vote',
    GAME_END: 'game_end'
};

// ==================== 游戏状态 ====================
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
    gameApiKey: 'ollama',
    gameEndpoint: 'http://localhost:11434/v1',
    phaseInterval: null,
    editingPlayerId: null,
    privateMessages: {},
    wolfTeamMessages: [],
    nightRoundRecords: [],
    nightActions: {},
    currentNightActor: null,
    userPlayerId: 'user_player',
    hasSelectedModel: false,
    waitingForUserVote: false
};

// ==================== DOM元素 ====================
const elements = {
    playersList: document.getElementById('players-list'),
    intervalSeconds: document.getElementById('interval-seconds'),
    gameModel: document.getElementById('host-model'),
    userModelSelect: document.getElementById('user-model-select'),
    randomOrder: document.getElementById('random-order'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    stopBtn: document.getElementById('stop-btn'),
    phaseDisplay: document.getElementById('phase-display'),
    dayDisplay: document.getElementById('day-display'),
    gameMessages: document.getElementById('game-messages'),
    exportBtn: document.getElementById('export-btn'),
    clearBtn: document.getElementById('clear-btn'),
    userMsgInput: document.getElementById('user-msg-input'),
    sendUserMsgBtn: document.getElementById('send-user-msg-btn'),
    userPanelBtn: document.getElementById('user-panel-btn'),

    // 用户后台相关
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
    userCurrentAction: null
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 动态填充模型下拉框
    populateModelSelect(document.getElementById('user-model-select'), false, '__random_cloud__');
    populateModelSelect(document.getElementById('host-model'), false, '__random_cloud__');

    initEventListeners();
    loadFromStorage();
    renderPlayers();
    renderMessages();
});

function initEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.stopBtn.addEventListener('click', stopGame);
    elements.exportBtn.addEventListener('click', exportGame);
    elements.clearBtn.addEventListener('click', clearGame);

    // 用户后台按钮
    if (elements.userPanelBtn) {
        elements.userPanelBtn.addEventListener('click', () => {
            openUserModal();
            updateUserInfo();
        });
    }

    if (elements.userMsgInput) {
        elements.userMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserMessage();
        });
        if (elements.sendUserMsgBtn) {
            elements.sendUserMsgBtn.addEventListener('click', sendUserMessage);
        }
    }

    // 用户团队聊天
    if (elements.userTeamSendBtn) {
        elements.userTeamSendBtn.addEventListener('click', sendUserTeamMessage);
    }
    if (elements.userTeamMsgInput) {
        elements.userTeamMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserTeamMessage();
        });
    }
}

// ==================== 玩家管理 ====================
// 生成AI玩家
function generateMultiplePlayers() {
    const model = elements.gameModel ? elements.gameModel.value : 'llama3.1';
    const count = parseInt(document.getElementById('generate-count')?.value || 8);
    const names = ['预言家', '女巫', '猎人', '守卫', '平民', '狼人', '白狼王', '小明', '小红', '小刚', '小丽', '大白'];

    const personalities = [
        '冷静分析，发言有条理',
        '积极发言，热爱讨论',
        '低调行事，不轻易表态',
        '强势带领，掌控节奏',
        '观察仔细，找出狼人',
        '摇摆不定，难以判断'
    ];

    gameState.players = [];

    for (let i = 0; i < count; i++) {
        const roleIndex = i % 8;
        gameState.players.push({
            id: `player_${Date.now()}_${i}`,
            name: names[i % names.length] + (i >= names.length ? (i - names.length + 1) : ''),
            role: '',
            description: personalities[Math.floor(Math.random() * personalities.length)],
            model: model,
            endpoint: 'http://localhost:11434/v1',
            apiKey: 'ollama',
            alive: true,
            isUser: false
        });
    }

    saveToStorage();
    renderPlayers();
    updateControlButtons();
}

// 删除玩家
function deletePlayer(id) {
    gameState.players = gameState.players.filter(p => p.id !== id);
    saveToStorage();
    renderPlayers();
    updateControlButtons();
}

// 渲染玩家列表（纯净版 - 只显示名字和模型）
function renderPlayers() {
    if (gameState.players.length === 0) {
        elements.playersList.innerHTML = `
            <div class="empty-state" style="min-height:80px;padding:15px;">
                <p>点击下方按钮生成AI玩家</p>
                <button class="btn-primary" style="margin-top:10px;" onclick="generateMultiplePlayers()">
                    <i class="fas fa-magic"></i> 生成AI玩家
                </button>
            </div>`;
        return;
    }

    elements.playersList.innerHTML = gameState.players.map((player, index) => {
        const statusClass = player.alive ? '' : 'dead';
        const modelDisplay = getDisplayModel(player.model, resolveModel(player.model));

        return `
            <div class="player-card ${statusClass}" data-id="${player.id}">
                <div class="player-info">
                    <div class="player-name">
                        <i class="fas fa-user"></i>
                        ${escapeHtml(player.name)}
                        <span class="model-tag">${modelDisplay}</span>
                    </div>
                </div>
                <div class="player-actions">
                    <button class="char-action-btn delete" onclick="deletePlayer('${player.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    }).join('');

    // 如果没有生成按钮，添加一个
    if (!elements.playersList.querySelector('.btn-primary')) {
        const addBtn = document.createElement('div');
        addBtn.innerHTML = `
            <button class="btn-primary" style="width:100%;margin-top:10px;" onclick="generateMultiplePlayers()">
                <i class="fas fa-magic"></i> 重新生成玩家
            </button>`;
        elements.playersList.appendChild(addBtn);
    }
}

// ==================== 游戏控制 ====================
function updateControlButtons() {
    const hasPlayers = gameState.players.length >= 4;
    elements.startBtn.disabled = gameState.isRunning || !hasPlayers;
    elements.stopBtn.disabled = !gameState.isRunning;

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

    // 显示/隐藏用户后台按钮
    if (elements.userPanelBtn) {
        elements.userPanelBtn.style.display = gameState.isRunning ? 'inline-block' : 'none';
    }
}

function togglePause() {
    if (!gameState.isRunning) return;

    gameState.isPaused = !gameState.isPaused;

    if (gameState.isPaused) {
        if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
        addGameMessage('system', '主持人', '【游戏暂停】');
    } else {
        addGameMessage('system', '主持人', '【游戏继续】');
        if (gameState.phase === PHASE.DAY_SPEAK) {
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
    // 获取用户选择的模型
    const userModel = elements.userModelSelect ? elements.userModelSelect.value : '__random_cloud__';

    // 添加用户玩家
    if (!gameState.players.find(p => p.isUser)) {
        gameState.players.push({
            id: 'user_player',
            name: '你',
            role: '',
            description: '参与游戏的用户',
            model: userModel,
            endpoint: 'http://localhost:11434/v1',
            apiKey: 'ollama',
            alive: true,
            isUser: true
        });
    } else {
        // 更新用户模型
        const userPlayer = gameState.players.find(p => p.isUser);
        userPlayer.model = userModel;
    }

    if (gameState.players.length < 4) {
        alert('至少需要4名玩家');
        return;
    }

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
    gameState.hostModel = elements.gameModel ? elements.gameModel.value : 'llama3.1';
    gameState.intervalSeconds = parseInt(elements.intervalSeconds.value) || 3;
    gameState.gameApiKey = 'ollama';
    gameState.gameEndpoint = 'http://localhost:11434/v1';

    // 清除所有玩家角色
    gameState.players.forEach(p => { p.role = ''; });

    // 随机分配身份
    assignRoles();

    // 初始化玩家状态
    gameState.players.forEach(p => { p.alive = true; });

    addGameMessage('system', '主持人', '========== 狼人杀游戏开始 ==========\n游戏规则：好人找出狼人，狼人杀光好人。');

    // 显示身份分配（用户可看）
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
    const validRoles = ['预言家', '女巫', '猎人', '守卫', '白痴', '平民', '狼人', '白狼王', '狼美人'];

    const hasPresets = gameState.players.every(p => validRoles.includes(p.role));
    if (hasPresets) return;

    const count = gameState.players.length;
    const roles = generateRoleConfig(count);
    shuffleArray(roles);

    gameState.players.forEach((p, i) => {
        p.role = roles[i];
    });
}

function generateRoleConfig(count) {
    let wolfCount, godCount;

    if (count <= 5) {
        wolfCount = 2;
        godCount = 1;
    } else if (count <= 6) {
        wolfCount = 2;
        godCount = 2;
    } else if (count <= 8) {
        wolfCount = count - 6;
        godCount = 4;
    } else if (count <= 10) {
        wolfCount = Math.floor(count * 0.35);
        godCount = Math.floor(count * 0.4);
    } else {
        wolfCount = Math.min(4, Math.ceil(count * 0.3));
        godCount = Math.floor(count * 0.4);
    }

    const civilianCount = count - wolfCount - godCount;
    let roles = [];

    if (count >= 9 && wolfCount >= 3) roles.push('白狼王');
    if (count >= 12 && wolfCount >= 4) roles.push('狼美人');

    const normalWolves = wolfCount - (roles.includes('白狼王') ? 1 : 0) - (roles.includes('狼美人') ? 1 : 0);
    for (let i = 0; i < normalWolves; i++) roles.push('狼人');

    const gods = ['预言家', '女巫', '猎人', '守卫', '白痴'];
    for (let i = 0; i < godCount; i++) {
        roles.push(gods[i % gods.length]);
    }

    for (let i = 0; i < civilianCount; i++) roles.push('平民');

    return roles;
}

function stopGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.waitingForUserVote = false;
    gameState.wolfTeamMessages = [];
    gameState.nightRoundRecords = [];
    gameState.currentNightRecord = null;
    if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
    updateControlButtons();
    
    // 隐藏用户后台按钮
    if (elements.userPanelBtn) {
        elements.userPanelBtn.style.display = 'none';
    }
    
    addGameMessage('system', '主持人', '游戏已终止');
}

// ==================== 夜晚阶段 ====================
async function runNightPhase() {
    if (!gameState.isRunning || gameState.isPaused) return;

    gameState.phase = PHASE.NIGHT;
    gameState.nightActions = {};
    gameState.currentNightRecord = {
        day: gameState.day,
        privateMessages: {},
        wolfTeamMessages: [],
        nightActions: {}
    };
    updatePhaseDisplay();
    addGameMessage('system', '主持人', '============== 天黑请闭眼 ==============');

    const alive = gameState.players.filter(p => p.alive);
    const wolves = alive.filter(p => p.role === '狼人');

    gameState.nightActions = {
        wolfKill: null,
        seerCheck: null,
        witchSave: false,
        witchPoison: null,
        guardProtect: null
    };

    // 狼人杀人
    if (wolves.length > 0) {
        const targets = alive.filter(p => !wolves.some(w => w.id === p.id));
        if (targets.length > 0) {
            addGameMessage('system', '主持人', '【狼人团队】正在讨论...');

            if (wolves.length === 1) {
                const prompt = `你是狼人${wolves[0].name}。请分析局势，选择要杀死的玩家。

存活好人：${targets.map(t => t.name).join('、')}

请直接说玩家名字，不要其他话。`;

                const response = await callPlayerAI(wolves[0], prompt);
                const targetName = parseName(response, targets.map(t => t.name));
                gameState.nightActions.wolfKill = targets.find(t => t.name === targetName) || targets[0];
            } else {
                const wolfOrder = [...wolves].map((wolf, index) => ({
                    name: `玩家${index + 1}`,
                    id: wolf.id,
                    realName: wolf.name
                }));

                const dayHistory = getDayHistory();
                let discussionLog = '';

                recordWolfTeamMessage('系统', '开始狼人团队讨论...');

                for (let i = 0; i < wolfOrder.length; i++) {
                    const speaker = wolfOrder[i];
                    const wolf = wolves.find(w => w.id === speaker.id);

                    const discussPrompt = `你是狼人${wolf.name}。你们狼人团队正在讨论要杀谁，请发表你的看法。

存活好人：${targets.map(t => t.name).join('、')}

【今天的公开讨论】
${dayHistory}

【狼人团队之前的讨论】
${discussionLog || '暂无'}

**注意：发言控制在30字以内，简短有力。最后说玩家名字。**`;

                    const response = await callPlayerAI(wolf, discussPrompt);
                    discussionLog += `\n${speaker.name}: ${response}`;
                    recordWolfTeamMessage(speaker.name, response);
                }

                recordWolfTeamMessage('系统', '讨论结束，开始投票...');

                const votes = {};
                for (let i = 0; i < wolfOrder.length; i++) {
                    const speaker = wolfOrder[i];
                    const wolf = wolves.find(w => w.id === speaker.id);

                    const votePrompt = `你是狼人${wolf.name}。基于刚才的讨论，请投票决定要杀死的玩家。

存活好人：${targets.map(t => t.name).join('、')}

这是投票，直接说玩家名字，不要其他话。`;

                    const response = await callPlayerAI(wolf, votePrompt);
                    const targetName = parseName(response, targets.map(t => t.name));
                    votes[targetName] = (votes[targetName] || 0) + 1;
                    recordWolfTeamMessage(`${speaker.name}的投票`, targetName);
                }

                let maxVotes = 0, killTarget = targets[0];
                Object.entries(votes).forEach(([name, count]) => {
                    if (count > maxVotes) {
                        maxVotes = count;
                        killTarget = targets.find(t => t.name === name);
                    }
                });

                gameState.nightActions.wolfKill = killTarget || targets[0];
            }

            recordNightPrivateMessage(wolves, `最终决定杀 ${gameState.nightActions.wolfKill.name}`);
        }
    }

    // 女巫
    const witch = alive.find(p => p.role === '女巫');
    if (witch && gameState.nightActions.wolfKill) {
        addGameMessage('system', '主持人', '【女巫】请选择是否救人...');

        const prompt = `你是女巫。昨晚 ${gameState.nightActions.wolfKill.name} 被杀。

存活玩家：${alive.map(p => p.name).join('、')}

根据局势分析，你是否使用解药？请回答"救"或"不救"。`;

        try {
            const response = await callPlayerAI(witch, prompt);
            if (response.includes('救')) {
                gameState.nightActions.witchSave = true;
                recordNightPrivateMessage([witch], '选择救人');
            } else {
                recordNightPrivateMessage([witch], '选择不救');
            }

            // 毒药
            const poisonTargets = alive.filter(p => p.id !== witch.id && p.id !== gameState.nightActions.wolfKill.id);
            if (poisonTargets.length > 0) {
                const poisonPrompt = `你是女巫。你还有毒药。

可毒的玩家：${poisonTargets.map(t => t.name).join('、')}

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
                } catch (e) {}
            }
        } catch (e) {
            if (Math.random() > 0.5) {
                gameState.nightActions.witchSave = true;
                recordNightPrivateMessage([witch], '选择救人（随机）');
            }
        }
    }

    // 预言家
    const seer = alive.find(p => p.role === '预言家');
    if (seer) {
        addGameMessage('system', '主持人', '【预言家】请选择要查验的玩家...');
        const checkTargets = alive.filter(p => p.id !== seer.id);
        if (checkTargets.length > 0) {
            const prompt = `你是预言家。请选择要查验的玩家。

存活玩家：${checkTargets.map(t => t.name).join('、')}

请直接说玩家名字，不要其他话。`;

            try {
                const response = await callPlayerAI(seer, prompt);
                const targetName = parseName(response, checkTargets.map(t => t.name));
                const target = checkTargets.find(t => t.name === targetName) || checkTargets[0];
                const isWolf = target.role === '狼人' || target.role === '白狼王' || target.role === '狼美人';
                gameState.nightActions.seerCheck = { name: target.name, isWolf: isWolf };
                recordNightPrivateMessage([seer], `查验 ${target.name}，他是${isWolf ? '狼人' : '好人'}`);
            } catch (e) {
                const target = checkTargets[Math.floor(Math.random() * checkTargets.length)];
                const isWolf = target.role === '狼人';
                gameState.nightActions.seerCheck = { name: target.name, isWolf: isWolf };
            }
        }
    }

    // 守卫
    const guard = alive.find(p => p.role === '守卫');
    if (guard) {
        const protectTargets = alive.filter(p => p.id !== guard.id);
        if (protectTargets.length > 0) {
            const prompt = `你是守卫。请选择要守护的玩家。

存活玩家：${protectTargets.map(t => t.name).join('、')}

请直接说玩家名字，不要其他话。`;

            try {
                const response = await callPlayerAI(guard, prompt);
                const targetName = parseName(response, protectTargets.map(t => t.name));
                const target = protectTargets.find(t => t.name === targetName) || protectTargets[0];
                gameState.nightActions.guardProtect = target;
                recordNightPrivateMessage([guard], `选择守护 ${target.name}`);
            } catch (e) {
                const target = protectTargets[Math.floor(Math.random() * protectTargets.length)];
                gameState.nightActions.guardProtect = target;
            }
        }
    }

    setTimeout(showDayAnnounce, 1000);
}

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

    if (isWolfTeam) {
        gameState.wolfTeamMessages.push({ sender: senderName, text: text, time: time, type: 'team' });
        if (gameState.currentNightRecord) {
            gameState.currentNightRecord.wolfTeamMessages.push({ sender: senderName, text: text, time: time, type: 'team' });
        }
    }
}

function recordWolfTeamMessage(sender, text) {
    const time = new Date().toLocaleTimeString();
    gameState.wolfTeamMessages.push({ sender: sender, text: text, time: time, type: 'team' });
    if (gameState.currentNightRecord) {
        gameState.currentNightRecord.wolfTeamMessages.push({ sender: sender, text: text, time: time, type: 'team' });
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
    const killed = actions.wolfKill;
    const guarded = actions.guardProtect;
    const wasSaved = actions.witchSave;

    if (killed && guarded && killed.id === guarded.id) {
        // 被守卫保护，不死
    } else if (killed && !wasSaved) {
        dead.push(killed);
    }

    if (actions.witchPoisoned) dead.push(actions.witchPoisoned);

    dead.forEach(p => { p.alive = false; gameState.deadPlayers.push(p); });

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
        gameState.isPaused = true;
        updateControlButtons();
        addGameMessage('system', '主持人', `【发言】轮到你发言了，请点击"我的信息"按钮或等待自动打开`);
        elements.userMsgInput.placeholder = "请输入你的发言...";
        elements.userMsgInput.focus();

        openUserModal();
        updateUserInfo();
        switchUserTab('info');
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

    return `${speaker.name}，你是${speaker.role}。
${speaker.description}

【存活玩家】${alive.map(p => p.name).join('、')}
【死亡玩家】${gameState.deadPlayers.map(p => p.name).join('、') || '无'}${secretInfo}

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
        console.error('AI调用失败，尝试云端备用...', e);
        if (CLOUD_FALLBACK_CONFIG.enabled) {
            try {
                return await callCloudFallbackAPI(prompt);
            } catch (cloudError) {
                console.error('云端备用也失败:', cloudError);
            }
        }
        return '';
    }
}

function sendUserMessage() {
    if (!gameState.isRunning) return;

    const text = elements.userMsgInput.value.trim();
    if (!text) return;

    // 检查是否是投票阶段
    if (gameState.waitingForUserVote) {
        // 处理投票
        const alive = gameState.speakingOrder.filter(p => p.alive);
        const voter = gameState.players.find(p => p.isUser);
        const targets = alive.filter(p => p.id !== voter.id);
        
        const targetName = parseName(text, targets.map(t => t.name));
        const target = targets.find(t => t.name === targetName);
        
        if (target) {
            gameState.votes[voter.id] = target.id;
            addGameMessage('user', '你', `投票给 ${target.name}`);
            addGameMessage('system', '主持人', `【投票】你投票给了 ${target.name}`);
        } else {
            addGameMessage('system', '主持人', `未找到玩家 "${text}"，请重新输入`);
            return;
        }
        
        elements.userMsgInput.value = '';
        gameState.waitingForUserVote = false;
        gameState.currentSpeakerIndex++;
        gameState.isPaused = false;
        updateControlButtons();
        gameState.phaseInterval = setTimeout(handleOneVote, 500);
        return;
    }

    // 普通发言阶段
    addGameMessage('user', '你', text);
    elements.userMsgInput.value = '';

    gameState.currentSpeakerIndex++;
    gameState.isPaused = false;
    updateControlButtons();
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

    if (voter.isUser) {
        gameState.isPaused = true;
        gameState.waitingForUserVote = true;
        updateControlButtons();
        addGameMessage('system', '主持人', `【投票】轮到你投票了，请输入你要投票的玩家名字`);
        elements.userMsgInput.placeholder = "输入你要投票的玩家名字...";
        elements.userMsgInput.focus();

        openUserModal();
        updateUserInfo();
        switchUserTab('info');
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

    return `${voter.name}（${voter.role}），请投票。

【存活玩家】${targets.map(p => p.name).join('、')}

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

async function handleHunterDeath(hunter) {
    const alive = gameState.players.filter(p => p.alive);
    if (alive.length <= 1) {
        addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，但没有可选目标`);
        return;
    }

    const targets = alive.filter(p => p.id !== hunter.id);
    addGameMessage('system', '主持人', `${hunter.name} 是猎人，正在选择要带走谁...`);

    if (targets.length > 0) {
        const dayHistory = getDayHistory();
        const prompt = `你是猎人${hunter.name}。你被投出了，现在要发动技能带走一名玩家。

存活玩家：${targets.map(t => t.name).join('、')}

请选择要带走的一名玩家，直接说玩家名字，不要其他话。`;

        try {
            const response = await callPlayerAI(hunter, prompt);
            const targetName = parseName(response, targets.map(t => t.name));
            const shot = targets.find(t => t.name === targetName) || targets[0];

            if (shot) {
                shot.alive = false;
                gameState.deadPlayers.push(shot);
                addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}（${shot.role}）`);
            }
        } catch (e) {
            const shot = targets[Math.floor(Math.random() * targets.length)];
            if (shot) {
                shot.alive = false;
                gameState.deadPlayers.push(shot);
                addGameMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}（随机选择）`);
            }
        }
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
    gameState.wolfTeamMessages = [];
    gameState.nightRoundRecords = [];
    gameState.currentNightRecord = null;
    if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
    addGameMessage('system', '主持人', `============== 游戏结束：${result} ==============`);
    updateControlButtons();
    updatePhaseDisplay();
}

// ==================== 消息 ====================
function addGameMessage(type, sender, text, model = null) {
    const msg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type, sender, text,
        time: new Date().toLocaleTimeString(),
        model
    };
    gameState.messages.push(msg);
    renderMessages();
    scrollToBottom();
    saveToStorage();
}

function renderMessages() {
    if (gameState.messages.length === 0) {
        elements.gameMessages.innerHTML = `<div class="empty-state"><i class="fas fa-scroll"></i><p>点击"开始游戏"进入纯净狼人杀体验</p></div>`;
        return;
    }

    const showModel = true;

    elements.gameMessages.innerHTML = gameState.messages.map(msg => {
        const icon = msg.type === 'system' ? 'fa-crown' : (msg.type === 'user' ? 'fa-user' : 'fa-robot');
        const modelTag = msg.model && showModel ? `<span class="model-tag">${msg.model}</span>` : '';
        return `<div class="message ${msg.type}-message"><div class="message-avatar"><i class="fas ${icon}"></i></div><div class="message-content"><div class="message-sender">${escapeHtml(msg.sender)}${modelTag}</div><div class="message-text">${escapeHtml(msg.text)}</div><div class="message-time">${msg.time}</div></div></div>`;
    }).join('');
}

function scrollToBottom() {
    elements.gameMessages.scrollTop = elements.gameMessages.scrollHeight;
}

function getGameHistory() {
    return gameState.messages.slice(-20).map(m => `${m.sender}: ${m.text}`).join('\n');
}

function getDayHistory() {
    const dayMsgs = gameState.messages.filter(m => {
        return m.type !== 'system' || (!m.text.includes('天黑') && !m.text.includes('夜晚'));
    });
    return dayMsgs.slice(-15).map(m => `${m.sender}: ${m.text}`).join('\n');
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

    let nightRecordIndex = 0;
    const nightRecords = gameState.nightRoundRecords || [];

    gameState.messages.forEach(msg => {
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

    if (record.wolfTeamMessages && record.wolfTeamMessages.length > 0) {
        text += '#### 🐺 狼人团队聊天\n';
        record.wolfTeamMessages.forEach(msg => {
            text += `- **${msg.sender}**: ${msg.text}\n`;
        });
        text += '\n';
    }

    return text;
}

function clearGame() {
    if (!confirm('确定要清空所有游戏记录吗？')) return;
    gameState.messages = [];
    gameState.privateMessages = {};
    gameState.wolfTeamMessages = [];
    gameState.nightRoundRecords = [];
    saveToStorage();
    renderMessages();
}

// ==================== 用户后台 ====================
function openUserModal() {
    if (elements.userModal) {
        elements.userModal.classList.add('show');
        updateUserInfo();
    }
}

function closeUserModal() {
    if (elements.userModal) {
        elements.userModal.classList.remove('show');
    }
}

function updateUserInfo() {
    const userPlayer = gameState.players.find(p => p.isUser);
    if (!userPlayer) return;

    const role = userPlayer.role || '未知';
    const isWolf = role === '狼人' || role === '白狼王' || role === '狼美人';

    if (elements.userRoleBadge) {
        elements.userRoleBadge.textContent = role;
        elements.userRoleBadge.className = 'role-badge ' + (isWolf ? 'wolf' : (['预言家', '女巫', '猎人', '守卫', '白痴'].includes(role) ? 'god' : 'civilian'));
    }

    if (elements.userMyRole) {
        elements.userMyRole.textContent = role;
    }

    if (elements.userAliveStatus) {
        elements.userAliveStatus.textContent = userPlayer.alive ? '存活' : '已死亡';
        elements.userAliveStatus.style.color = userPlayer.alive ? '#10b981' : '#ef4444';
    }

    // 更新专属信息
    if (elements.userSecretContent) {
        let secretHtml = '';

        // 预言家查验结果
        if (role === '预言家' && gameState.nightActions && gameState.nightActions.seerCheck) {
            const check = gameState.nightActions.seerCheck;
            secretHtml += `<p>🔮 昨晚查验：${check.name} 是 ${check.isWolf ? '狼人' : '好人'}</p>`;
        }

        // 女巫信息
        if (role === '女巫') {
            secretHtml += `<p>💊 解药：${gameState.witchSaved ? '已使用' : '未使用'}</p>`;
            if (gameState.witchPoisoned) {
                secretHtml += `<p>☠️ 毒药：已使用于 ${gameState.witchPoisoned.name}</p>`;
            } else {
                secretHtml += `<p>☠️ 毒药：未使用</p>`;
            }
        }

        // 守卫守护
        if (role === '守卫' && gameState.nightActions && gameState.nightActions.guardProtect) {
            secretHtml += `<p>🛡️ 昨晚守护：${gameState.nightActions.guardProtect.name}</p>`;
        }

        // 狼人团队
        if (isWolf) {
            const wolves = gameState.players.filter(p => (p.role === '狼人' || p.role === '白狼王' || p.role === '狼美人') && p.alive);
            secretHtml += `<p>🐺 你的狼队友：${wolves.filter(p => p.id !== userPlayer.id).map(p => p.name).join('、') || '无'}</p>`;

            // 更新团队聊天
            if (elements.userWolfTeamChat) {
                const messages = gameState.wolfTeamMessages || [];
                elements.userWolfTeamChat.innerHTML = messages.map(msg =>
                    `<div class="chat-message"><span class="msg-sender">${msg.sender}:</span> ${msg.text}</div>`
                ).join('') || '<div class="empty-state"><p>暂无团队消息</p></div>';
            }
        }

        if (!secretHtml) {
            secretHtml = '<p>暂无专属信息</p>';
        }

        elements.userSecretContent.innerHTML = secretHtml;
    }
}

function switchUserTab(tab) {
    document.querySelectorAll('.user-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.user-tab-content').forEach(content => {
        content.style.display = content.id === `user-tab-${tab}` ? 'block' : 'none';
    });
}

function sendUserTeamMessage() {
    if (!elements.userTeamMsgInput) return;

    const text = elements.userTeamMsgInput.value.trim();
    if (!text) return;

    const userPlayer = gameState.players.find(p => p.isUser);
    if (!userPlayer) return;

    const isWolf = userPlayer.role === '狼人' || userPlayer.role === '白狼王' || userPlayer.role === '狼美人';
    if (!isWolf) {
        alert('只有狼人阵营才能发送团队消息');
        return;
    }

    recordWolfTeamMessage('你', text);
    elements.userTeamMsgInput.value = '';

    // 更新显示
    if (elements.userWolfTeamChat) {
        const messages = gameState.wolfTeamMessages || [];
        elements.userWolfTeamChat.innerHTML = messages.map(msg =>
            `<div class="chat-message ${msg.sender === '你' ? 'my-message' : ''}"><span class="msg-sender">${msg.sender}:</span> ${msg.text}</div>`
        ).join('');
    }
}

// ==================== 存储 ====================
function saveToStorage() {
    try {
        localStorage.setItem('werewolf_players', JSON.stringify(gameState.players));
    } catch (e) {}
}

function loadFromStorage() {
    try {
        const players = localStorage.getItem('werewolf_players');
        if (players) {
            gameState.players = JSON.parse(players);
        }
    } catch (e) {}
}

// ==================== 工具 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
