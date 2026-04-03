// ==================== 狼人杀游玩模式 UI ====================
// 纯 UI 层，游戏逻辑复用 werewolf-core.js

// 初始化配置
WerewolfCore.gameState.showModelInfo = false;  // 游玩模式不显示模型
WerewolfCore.gameState.aiKnowsModels = false;  // AI 不知道其他玩家模型
WerewolfCore.gameState.gameApiKey = 'ollama';
WerewolfCore.gameState.gameEndpoint = 'http://localhost:11434/v1';

// DOM 元素引用
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
    userModal: document.getElementById('user-modal'),
    userRoleBadge: document.getElementById('user-role-badge'),
    userMyRole: document.getElementById('user-my-role'),
    userAliveStatus: document.getElementById('user-alive-status'),
    userSecretContent: document.getElementById('user-secret-content'),
    userTabBtns: document.querySelectorAll('.user-tab-btn'),
    userTabContents: document.querySelectorAll('.user-tab-content'),
    userNightActionArea: document.getElementById('user-night-action-area'),
    userNightHistory: document.getElementById('user-night-history'),
    userWolfTeamChat: document.getElementById('user-wolf-team-chat')
};

// 当前用户
let currentUser = null;
let currentTab = 'info';

// ==================== 初始化 ====================
function init() {
    initModelSelects();
    initEventListeners();
    renderPlayers();
    setupHooks();
    loadFromStorage();
}

function initModelSelects() {
    const models = ['llama3.1', 'gemma2', 'mistral', 'qwen2.5', 'gemma2:9b'];
    const options = models.map(m => `<option value="${m}">${m}</option>`).join('');
    if (elements.gameModel) elements.gameModel.innerHTML = options;
    if (elements.userModelSelect) elements.userModelSelect.innerHTML = options;
}

function setupHooks() {
    // 注册消息钩子 - 当有新消息时渲染
    WerewolfCore.setHook('onMessage', (msg) => {
        renderMessages();
        scrollToBottom();
        saveToStorage();
    });

    // 注册阶段变化钩子
    WerewolfCore.setHook('onPhaseChange', (phase, extra) => {
        updatePhaseDisplay();
        updateControlButtons();
        updateUserInfo();

        // 如果是用户轮次，打开用户后台
        if (extra && extra.isUser) {
            if (phase === WerewolfCore.PHASE.DAY_SPEAK) {
                openUserModal();
                elements.userMsgInput.placeholder = "请输入你的发言...";
                elements.userMsgInput.focus();
            } else if (phase === WerewolfCore.PHASE.DAY_VOTE) {
                openUserModal();
                elements.userMsgInput.placeholder = "输入你要投票的玩家名字...";
                elements.userMsgInput.focus();
            }
        }
    });

    // 注册玩家更新钩子
    WerewolfCore.setHook('onPlayerUpdate', () => {
        renderPlayers();
        updateUserInfo();  // 角色分配后更新用户信息
    });
}

function initEventListeners() {
    if (elements.startBtn) elements.startBtn.addEventListener('click', startGame);
    if (elements.pauseBtn) elements.pauseBtn.addEventListener('click', togglePause);
    if (elements.stopBtn) elements.stopBtn.addEventListener('click', stopGame);
    if (elements.exportBtn) elements.exportBtn.addEventListener('click', exportGame);
    if (elements.clearBtn) elements.clearBtn.addEventListener('click', clearGame);
    if (elements.sendUserMsgBtn) elements.sendUserMsgBtn.addEventListener('click', sendUserMessage);
    if (elements.userMsgInput) {
        elements.userMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserMessage();
        });
    }
    if (elements.userPanelBtn) elements.userPanelBtn.addEventListener('click', openUserModal);

    // Tab 切换
    elements.userTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchUserTab(btn.dataset.tab));
    });
}

// ==================== 玩家管理 ====================
function generateMultiplePlayers() {
    const model = elements.gameModel ? elements.gameModel.value : 'llama3.1';
    const count = 8;  // 默认生成8个玩家
    const names = ['小明', '小红', '小刚', '小丽', '大白', '阿杰', '小芳', '阿强', '小华', '阿龙', '小美', '阿伟'];
    const personalities = [
        '冷静分析，发言有条理',
        '积极发言，热爱讨论',
        '低调行事，不轻易表态',
        '强势带领，掌控节奏',
        '观察仔细，找出狼人',
        '摇摆不定，难以判断'
    ];
    const selectedNames = shuffleArray([...names]).slice(0, count);

    WerewolfCore.gameState.players = selectedNames.map((name, i) => ({
        id: Date.now().toString(36) + i.toString(),
        name,
        role: '',  // 游戏开始时由核心逻辑分配
        description: personalities[i % personalities.length],
        isUser: false,
        model: getRandomModel(),
        endpoint: 'http://localhost:11434/v1',
        apiKey: 'ollama',
        alive: true,
        potions: { antidote: true, poison: true }  // 女巫初始药水
    }));

    // 将第一个玩家设为用户
    if (WerewolfCore.gameState.players.length > 0) {
        WerewolfCore.gameState.players[0].isUser = true;
        WerewolfCore.gameState.players[0].name = '你';
        currentUser = WerewolfCore.gameState.players[0];
    }

    renderPlayers();
    saveToStorage();
}

function deletePlayer(id) {
    WerewolfCore.gameState.players = WerewolfCore.gameState.players.filter(p => p.id !== id);
    renderPlayers();
    saveToStorage();
}

function getRandomModel() {
    const models = ['llama3.1', 'gemma2', 'mistral', 'qwen2.5'];
    return models[Math.floor(Math.random() * models.length)];
}

// ==================== 渲染 ====================
function renderPlayers() {
    if (WerewolfCore.gameState.players.length === 0) {
        elements.playersList.innerHTML = `
            <div class="empty-state" style="min-height:80px;padding:15px;">
                <p>点击下方按钮生成AI玩家</p>
                <button class="btn-primary" style="margin-top:10px;" onclick="generateMultiplePlayers()">
                    <i class="fas fa-magic"></i> 生成AI玩家
                </button>
            </div>`;
        return;
    }

    elements.playersList.innerHTML = WerewolfCore.gameState.players.map((player, index) => {
        const statusClass = player.alive ? '' : 'dead';
        const userTag = player.isUser ? '<span class="role-badge" style="background:#10b981">你</span>' : '';
        return `
            <div class="player-card ${statusClass}" data-id="${player.id}">
                <div class="player-info">
                    <div class="player-name">${escapeHtml(player.name)}${userTag}</div>
                </div>
                <div class="player-actions">
                    <button class="char-action-btn delete" onclick="deletePlayer('${player.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');
}

function renderMessages() {
    if (WerewolfCore.gameState.messages.length === 0) {
        elements.gameMessages.innerHTML = `<div class="empty-state"><i class="fas fa-scroll"></i><p>点击"开始游戏"进入纯净狼人杀体验</p></div>`;
        return;
    }

    const showModel = WerewolfCore.gameState.showModelInfo;

    elements.gameMessages.innerHTML = WerewolfCore.gameState.messages.map(msg => {
        const icon = msg.type === 'system' ? 'fa-crown' : (msg.type === 'user' ? 'fa-user' : 'fa-robot');
        const modelTag = msg.model && showModel ? `<span class="model-tag">${msg.model}</span>` : '';
        return `<div class="message ${msg.type}-message"><div class="message-avatar"><i class="fas ${icon}"></i></div><div class="message-content"><div class="message-sender">${escapeHtml(msg.sender)}${modelTag}</div><div class="message-text">${escapeHtml(msg.text)}</div><div class="message-time">${msg.time}</div></div></div>`;
    }).join('');
}

function scrollToBottom() {
    elements.gameMessages.scrollTop = elements.gameMessages.scrollHeight;
}

function updatePhaseDisplay() {
    const phaseNames = {
        [WerewolfCore.PHASE.SETUP]: '等待开始',
        [WerewolfCore.PHASE.NIGHT]: '夜晚',
        [WerewolfCore.PHASE.DAY_ANNOUNCE]: '公布死亡',
        [WerewolfCore.PHASE.DAY_SPEAK]: '白天发言',
        [WerewolfCore.PHASE.DAY_VOTE]: '投票',
        [WerewolfCore.PHASE.GAME_END]: '游戏结束'
    };
    if (elements.phaseDisplay) elements.phaseDisplay.textContent = phaseNames[WerewolfCore.gameState.phase] || '未知';
    if (elements.dayDisplay) elements.dayDisplay.textContent = `第${WerewolfCore.gameState.day}天`;
}

function updateControlButtons() {
    const hasPlayers = WerewolfCore.gameState.players.length >= 4;
    if (elements.startBtn) elements.startBtn.disabled = WerewolfCore.gameState.isRunning || !hasPlayers;
    if (elements.stopBtn) elements.stopBtn.disabled = !WerewolfCore.gameState.isRunning;

    if (elements.pauseBtn) {
        if (!WerewolfCore.gameState.isRunning) {
            elements.pauseBtn.disabled = true;
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        } else if (WerewolfCore.gameState.isPaused) {
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        } else {
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }
}

// ==================== 游戏控制 ====================
function startGame() {
    if (WerewolfCore.gameState.players.length < 4) {
        alert('至少需要4名玩家');
        return;
    }

    // 生成玩家
    if (WerewolfCore.gameState.players.length === 0) {
        generateMultiplePlayers();
    }

    // 设置参数
    if (elements.intervalSeconds) {
        WerewolfCore.gameState.intervalSeconds = parseInt(elements.intervalSeconds.value) || 3;
    }
    if (elements.randomOrder) {
        WerewolfCore.gameState.randomSpeakOrder = elements.randomOrder.checked;
    }

    try {
        WerewolfCore.startGame();
        if (elements.userPanelBtn) elements.userPanelBtn.style.display = 'none';
    } catch (e) {
        alert(e.message);
    }
}

function stopGame() {
    WerewolfCore.stopGame();
    renderPlayers();
    if (elements.userPanelBtn) elements.userPanelBtn.style.display = 'none';
}

function togglePause() {
    if (WerewolfCore.gameState.isPaused) {
        WerewolfCore.resumeGame();
    } else {
        WerewolfCore.pauseGame();
    }
}

// ==================== 用户交互 ====================
function sendUserMessage() {
    const text = elements.userMsgInput.value.trim();
    if (!text) return;

    const user = WerewolfCore.gameState.players.find(p => p.isUser && p.alive);
    if (!user) return;

    // 判断是投票还是发言
    if (WerewolfCore.gameState.phase === WerewolfCore.PHASE.DAY_VOTE) {
        WerewolfCore.submitUserVote(text);
    } else {
        WerewolfCore.submitUserMessage(text);
    }

    elements.userMsgInput.value = '';
}

function openUserModal() {
    updateUserInfo();
    elements.userModal.style.display = 'block';
    if (elements.userPanelBtn) elements.userPanelBtn.style.display = 'none';
}

function closeUserModal() {
    elements.userModal.style.display = 'none';
}

function updateUserInfo() {
    const user = WerewolfCore.gameState.players.find(p => p.isUser);
    if (!user) return;

    currentUser = user;

    // 更新基本信息
    if (elements.userMyRole) elements.userMyRole.textContent = user.role || '未分配';
    if (elements.userAliveStatus) elements.userAliveStatus.textContent = user.alive ? '存活' : '已死亡';
    if (elements.userRoleBadge) {
        elements.userRoleBadge.textContent = user.role || '未知';
        elements.userRoleBadge.className = 'role-badge ' + getRoleBadgeClass(user.role);
    }

    // 更新专属信息
    updateSecretInfo();
}

function updateSecretInfo() {
    if (!currentUser) return;
    if (!elements.userSecretContent) return;

    let html = '';

    if (currentUser.role === '预言家') {
        const seerResult = WerewolfCore.gameState.seerResult;
        if (seerResult) {
            html = `<p>昨晚查验结果：<strong>${seerResult.player.name} 是 ${seerResult.isWolf ? '狼人' : '好人'}</strong></p>`;
        } else {
            html = '<p>还没有查验过任何人</p>';
        }
    } else if (currentUser.role === '女巫') {
        const hasAntidote = currentUser.potions?.antidote !== false;
        const hasPoison = currentUser.potions?.poison !== false;
        html = `<p>解药：${hasAntidote ? '可用' : '已用完'}</p>`;
        html += `<p>毒药：${hasPoison ? '可用' : '已用完'}</p>`;
    } else if (currentUser.role === '狼人') {
        const wolves = WerewolfCore.gameState.players.filter(p => p.role === '狼人' && p.alive);
        html = '<p>你的狼人队友：</p>';
        html += wolves.filter(w => w.id !== currentUser.id).map(w => `<strong>${w.name}</strong>`).join('、');
        if (html === '<p>你的狼人队友：</p>') {
            html += '（没有队友了）';
        }
    } else {
        html = '<p>你是平民，等待游戏开始...</p>';
    }

    elements.userSecretContent.innerHTML = html;
}

function getRoleBadgeClass(role) {
    const roleClasses = {
        '狼人': 'role-wolf',
        '预言家': 'role-seer',
        '女巫': 'role-witch',
        '猎人': 'role-hunter',
        '平民': 'role-villager'
    };
    return roleClasses[role] || '';
}

function switchUserTab(tab) {
    currentTab = tab;
    elements.userTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    elements.userTabContents.forEach(content => {
        content.style.display = content.id === `user-tab-${tab}` ? 'block' : 'none';
    });

    updateUserInfo();
}

// ==================== 导入导出 ====================
function exportGame() {
    if (WerewolfCore.gameState.messages.length === 0) {
        alert('没有可导出的内容');
        return;
    }

    let content = '# 狼人杀游戏记录\n\n';
    if (WerewolfCore.gameState.players.length > 0) {
        content += '## 玩家列表\n';
        WerewolfCore.gameState.players.forEach(p => {
            content += `- ${p.name}：${p.role} ${p.alive ? '(存活)' : '(已死亡)'}\n`;
        });
        content += '\n';
    }

    content += '## 游戏记录\n\n';
    WerewolfCore.gameState.messages.forEach(m => {
        content += `### [${m.time}] ${m.sender}\n${m.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `狼人杀记录_${new Date().toLocaleDateString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearGame() {
    if (!confirm('确定要清空所有内容吗？')) return;

    WerewolfCore.gameState.players = [];
    WerewolfCore.gameState.messages = [];
    WerewolfCore.gameState.deadPlayers = [];
    WerewolfCore.gameState.phase = WerewolfCore.PHASE.SETUP;
    WerewolfCore.gameState.day = 0;

    renderPlayers();
    renderMessages();
    updatePhaseDisplay();
    updateControlButtons();

    localStorage.removeItem('werewolf-play-game');
}

// ==================== 本地存储 ====================
function saveToStorage() {
    const data = {
        players: WerewolfCore.gameState.players,
        messages: WerewolfCore.gameState.messages,
        deadPlayers: WerewolfCore.gameState.deadPlayers,
        phase: WerewolfCore.gameState.phase,
        day: WerewolfCore.gameState.day
    };
    localStorage.setItem('werewolf-play-game', JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem('werewolf-play-game');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        WerewolfCore.gameState.players = data.players || [];
        WerewolfCore.gameState.messages = data.messages || [];
        WerewolfCore.gameState.deadPlayers = data.deadPlayers || [];
        WerewolfCore.gameState.phase = data.phase || WerewolfCore.PHASE.SETUP;
        WerewolfCore.gameState.day = data.day || 0;

        renderPlayers();
        renderMessages();
        updatePhaseDisplay();
    } catch (e) {
        console.error('加载存档失败:', e);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', init);

// 导出到全局
window.generateMultiplePlayers = generateMultiplePlayers;
window.deletePlayer = deletePlayer;
window.startGame = startGame;
window.stopGame = stopGame;
window.togglePause = togglePause;
window.sendUserMessage = sendUserMessage;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.switchUserTab = switchUserTab;
window.exportGame = exportGame;
window.clearGame = clearGame;
