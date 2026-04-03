// ==================== 狼人杀游戏核心逻辑 ====================
// 纯游戏逻辑，无 DOM 依赖，可被不同 UI 复用

// 从 shared.js 引入的函数（需要在引入 core.js 之前引入 shared.js）
// - shuffleArray() (如果 shared.js 有)
// - resolveModel(), getDisplayModel(), callAI()

// 工具函数
if (typeof shuffleArray === 'undefined') {
    window.shuffleArray = function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
}

// 游戏阶段常量
const PHASE = {
    SETUP: 'setup',
    NIGHT: 'night',
    DAY_ANNOUNCE: 'day_announce',
    DAY_SPEAK: 'day_speak',
    DAY_VOTE: 'day_vote',
    GAME_END: 'game_end'
};

// 游戏核心状态
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
    aiKnowsModels: true,  // 可被覆盖：play-mode 设为 false
    showModelInfo: true,  // 可被覆盖：play-mode 设为 false
    intervalSeconds: 3,
    gameModel: 'llama3.1',
    playerDefaultModel: '__random_all__',
    gameApiKey: AppSettings.getApiKey(),
    gameEndpoint: AppSettings.getEndpointV1(),
    phaseInterval: null,
    nightActions: {},
    nightRoundRecords: [],
    currentNightRecord: null,
    suspicionMap: new Map(),

    // UI 钩子 - 可被外部 UI 覆盖
    hooks: {
        onPhaseChange: null,
        onMessage: null,
        onPlayerUpdate: null,
        onVote: null,
        onNightAction: null
    }
};

// 触发钩子
function triggerHook(hookName, ...args) {
    if (gameState.hooks[hookName] && typeof gameState.hooks[hookName] === 'function') {
        gameState.hooks[hookName](...args);
    }
}

// ==================== 角色配置 ====================
function generateRoleConfig(count) {
    // 基础角色配置（确保狼人和好人平衡）
    const config = {
        '预言家': 1,
        '女巫': 1,
        '猎人': 1,
        '狼人': Math.floor(count / 3),
        '平民': count - 3 - Math.floor(count / 3)
    };

    // 确保至少有2个狼人
    if (config['狼人'] < 2) {
        config['狼人'] = 2;
        config['平民'] = count - 5;
    }

    // 生成角色数组
    let roles = [];
    for (const [role, num] of Object.entries(config)) {
        for (let i = 0; i < num; i++) {
            roles.push(role);
        }
    }

    // 补充或削减到目标数量
    while (roles.length < count) {
        roles.push('平民');
    }
    while (roles.length > count) {
        roles.pop();
    }

    return roles;
}

function assignRoles() {
    const roles = generateRoleConfig(gameState.players.length);
    shuffleArray(roles);
    gameState.players.forEach((p, i) => {
        p.role = roles[i];
    });
    triggerHook('onPlayerUpdate');
}

// ==================== 消息管理 ====================
function addMessage(type, sender, text, model = null) {
    const msg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        sender,
        text,
        time: new Date().toLocaleTimeString(),
        model
    };
    gameState.messages.push(msg);
    triggerHook('onMessage', msg);
    return msg;
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

// ==================== 游戏流程控制 ====================
function startGame() {
    if (gameState.players.length < 4) {
        throw new Error('至少需要4名玩家');
    }

    assignRoles();
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.day = 0;
    gameState.deadPlayers = [];
    gameState.votes = {};
    gameState.nightRoundRecords = [];

    addMessage('system', '主持人', '========== 狼人杀游戏开始 ==========\n游戏规则：好人找出狼人，狼人杀光好人。');

    triggerHook('onPhaseChange', gameState.phase);
    startNightPhase();
}

function stopGame() {
    gameState.isRunning = false;
    if (gameState.phaseInterval) {
        clearTimeout(gameState.phaseInterval);
        gameState.phaseInterval = null;
    }
    gameState.phase = PHASE.SETUP;
    triggerHook('onPhaseChange', gameState.phase);
    addMessage('system', '主持人', '游戏已终止');
}

function pauseGame() {
    gameState.isPaused = true;
    addMessage('system', '主持人', '【游戏暂停】');
}

function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    addMessage('system', '主持人', '【游戏继续】');
    if (gameState.phase === PHASE.NIGHT) {
        handleNight();
    } else if (gameState.phase === PHASE.DAY_SPEAK) {
        handleDaySpeak();
    } else if (gameState.phase === PHASE.DAY_VOTE) {
        handleVote();
    }
}

// ==================== 夜晚阶段 ====================
function startNightPhase() {
    gameState.day++;
    gameState.phase = PHASE.NIGHT;
    gameState.nightActions = {};
    gameState.nightKill = null;
    gameState.witchSaved = false;
    gameState.witchPoisoned = null;
    gameState.seerResult = null;
    gameState.currentNightRecord = [];

    triggerHook('onPhaseChange', gameState.phase);
    addMessage('system', '主持人', '============== 天黑请闭眼 ==============');
    handleNight();
}

async function handleNight() {
    if (!gameState.isRunning || gameState.isPaused) return;

    const alive = gameState.players.filter(p => p.alive);
    const wolves = alive.filter(p => p.role === '狼人');
    const witch = alive.find(p => p.role === '女巫');
    const seer = alive.find(p => p.role === '预言家');

    // 狼人杀人
    if (wolves.length > 0) {
        const targets = alive.filter(p => !wolves.some(w => w.id === p.id));
        if (targets.length > 0) {
            const prompt = buildWolfKillPrompt(wolves, targets, alive);
            try {
                const response = await callWolfTeamAI(prompt);
                if (response) {
                    const target = parseTargetFromResponse(response, targets);
                    if (target) {
                        gameState.nightKill = target;
                        recordNightAction('狼人', `选择击杀 ${target.name}`);
                    }
                }
            } catch (e) {
                console.error('狼人行动失败:', e);
            }
        }
    }

    // 女巫行动
    if (witch && gameState.nightKill) {
        const hasAntidote = witch.potions?.antidote !== false;
        const hasPoison = witch.potions?.poison !== false;

        if (hasAntidote || hasPoison) {
            const prompt = buildWitchPrompt(witch, gameState.nightKill, hasAntidote, hasPoison, alive);
            try {
                const response = await callPlayerAI(witch, prompt);
                const decision = parseWitchDecision(response);
                if (decision === 'save' && hasAntidote) {
                    gameState.witchSaved = true;
                    recordNightAction('女巫', '使用解药救人');
                } else if (decision === 'poison' && hasPoison) {
                    const poisonTarget = parsePoisonTarget(response, alive.filter(p => p.id !== witch.id && p.id !== gameState.nightKill?.id));
                    if (poisonTarget) {
                        gameState.witchPoisoned = poisonTarget;
                        recordNightAction('女巫', `使用毒药毒杀 ${poisonTarget.name}`);
                    }
                }
            } catch (e) {
                console.error('女巫行动失败:', e);
            }
        }
    }

    // 预言家查验
    if (seer) {
        const checkTargets = alive.filter(p => p.id !== seer.id);
        if (checkTargets.length > 0) {
            const prompt = buildSeerPrompt(seer, checkTargets);
            try {
                const response = await callPlayerAI(seer, prompt);
                const target = parseTargetFromResponse(response, checkTargets);
                if (target) {
                    gameState.seerResult = { player: target, isWolf: target.role === '狼人' };
                    recordNightAction('预言家', `查验 ${target.name}，是${gameState.seerResult.isWolf ? '狼人' : '好人'}`);
                }
            } catch (e) {
                console.error('预言家行动失败:', e);
            }
        }
    }

    // 结束夜晚
    finishNightPhase();
}

function finishNightPhase() {
    // 结算死亡
    const dead = [];
    if (gameState.nightKill && !gameState.witchSaved) {
        gameState.nightKill.alive = false;
        dead.push(gameState.nightKill);
    }
    if (gameState.witchPoisoned) {
        gameState.witchPoisoned.alive = false;
        dead.push(gameState.witchPoisoned);
    }

    dead.forEach(p => {
        gameState.deadPlayers.push(p);
    });

    startDayAnnounce(dead);
}

// ==================== 白天公告 ====================
function startDayAnnounce(dead) {
    gameState.phase = PHASE.DAY_ANNOUNCE;
    triggerHook('onPhaseChange', gameState.phase);

    if (dead.length === 0) {
        addMessage('system', '主持人', '============== 天亮了 ==============\n昨晚是平安夜，没有人死亡。');
    } else {
        addMessage('system', '主持人', `============== 天亮了 ==============\n昨晚死亡的有：${dead.map(p => p.name).join('、')}`);
    }

    gameState.phaseInterval = setTimeout(startDaySpeak, gameState.intervalSeconds * 1000);
}

// ==================== 白天发言 ====================
function startDaySpeak() {
    gameState.phase = PHASE.DAY_SPEAK;
    gameState.speakingOrder = [...gameState.players.filter(p => p.alive)];
    gameState.currentSpeakerIndex = 0;

    if (gameState.randomSpeakOrder) {
        shuffleArray(gameState.speakingOrder);
    }

    triggerHook('onPhaseChange', gameState.phase);
    addMessage('system', '主持人', '============== 白天发言阶段 ==============');

    handleDaySpeak();
}

async function handleDaySpeak() {
    if (!gameState.isRunning || gameState.isPaused) return;

    const alive = gameState.speakingOrder.filter(p => p.alive);

    if (gameState.currentSpeakerIndex >= alive.length) {
        startVote();
        return;
    }

    const speaker = alive[gameState.currentSpeakerIndex];

    // 如果是用户玩家，暂停等待用户输入（UI层处理）
    if (speaker.isUser) {
        triggerHook('onPhaseChange', PHASE.DAY_SPEAK, speaker);
        return;
    }

    addMessage('system', '主持人', `【发言】请 ${speaker.name} 发言`);

    const prompt = buildDaySpeakPrompt(speaker, alive);

    try {
        const response = await callPlayerAI(speaker, prompt);
        const model = resolveModel(speaker.model);
        const displayModel = getDisplayModel(speaker.model, model);
        addMessage('ai', speaker.name, response, displayModel);
    } catch (e) {
        addMessage('ai', speaker.name, '（发言失败）');
    }

    gameState.currentSpeakerIndex++;
    gameState.phaseInterval = setTimeout(handleDaySpeak, gameState.intervalSeconds * 1000);
}

function buildDaySpeakPrompt(speaker, alive) {
    const history = getGameHistory();
    let secretInfo = '';

    if (speaker.role === '预言家' && gameState.seerResult) {
        secretInfo = `\n（你昨晚查验了${gameState.seerResult.player.name}，他是${gameState.seerResult.isWolf ? '狼人' : '好人'}）`;
    }

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

${speaker.role === '狼人'
    ? '请分析局势，进行发言，为团队找出有价值的目标，隐藏身份并干扰好人。'
    : '请分析局势，进行发言，分析谁是好人、谁是狼人。'}

**注意：发言控制在50字以内，简短有力。**`;
}

// 用户发言（由 UI 层调用）
function submitUserMessage(text) {
    const user = gameState.players.find(p => p.isUser && p.alive);
    if (!user) return;

    addMessage('user', user.name, text);

    gameState.currentSpeakerIndex++;
    gameState.isPaused = false;
    handleDaySpeak();
}

// ==================== 投票阶段 ====================
function startVote() {
    gameState.phase = PHASE.DAY_VOTE;
    gameState.votes = {};
    gameState.currentSpeakerIndex = 0;
    triggerHook('onPhaseChange', gameState.phase);
    addMessage('system', '主持人', '============== 发言结束，开始投票 ==============');

    handleVote();
}

async function handleVote() {
    if (!gameState.isRunning || gameState.isPaused) return;

    const alive = gameState.players.filter(p => p.alive);

    if (gameState.currentSpeakerIndex >= alive.length) {
        handleVoteResult();
        return;
    }

    const voter = alive[gameState.currentSpeakerIndex];
    const targets = alive.filter(p => p.id !== voter.id);

    // 如果是用户玩家，暂停等待用户输入
    if (voter.isUser) {
        triggerHook('onPhaseChange', PHASE.DAY_VOTE, voter);
        return;
    }

    addMessage('system', '主持人', `【投票】请 ${voter.name} 投票`);

    const prompt = buildVotePrompt(voter, targets);

    try {
        const target = parseTargetFromResponse(await callPlayerAI(voter, prompt), targets);
        if (target) {
            gameState.votes[voter.id] = target.id;
            const model = resolveModel(voter.model);
            const displayModel = getDisplayModel(voter.model, model);
            addMessage('ai', voter.name, `投票给 ${target.name}`, displayModel);
            triggerHook('onVote', voter, target);
        }
    } catch (e) {
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        gameState.votes[voter.id] = randomTarget.id;
        addMessage('ai', voter.name, `投票给 ${randomTarget.name}`);
    }

    gameState.currentSpeakerIndex++;
    gameState.phaseInterval = setTimeout(handleVote, gameState.intervalSeconds * 1000);
}

function buildVotePrompt(voter, targets) {
    const dayHistory = getDayHistory();
    return `${voter.name}，你是${voter.role}。

【存活玩家】${targets.map(p => p.name).join('、')}

【今天的发言】
${dayHistory}

请从上述玩家中投票给你最怀疑是狼人的人。只回复玩家名字即可。`;
}

// 用户投票（由 UI 层调用）
function submitUserVote(targetName) {
    const user = gameState.players.find(p => p.isUser && p.alive);
    if (!user) return;

    const target = gameState.players.find(p => p.alive && p.name === targetName);
    if (!target) {
        addMessage('system', '主持人', `未找到玩家 "${targetName}"，请重新输入`);
        return;
    }

    gameState.votes[user.id] = target.id;
    addMessage('user', user.name, `投票给 ${target.name}`);
    triggerHook('onVote', user, target);

    gameState.currentSpeakerIndex++;
    gameState.isPaused = false;
    handleVote();
}

async function handleVoteResult() {
    const alive = gameState.players.filter(p => p.alive);
    const voteCount = {};

    // 统计票数
    alive.forEach(p => {
        const vote = gameState.votes[p.id];
        if (vote) {
            voteCount[vote] = (voteCount[vote] || 0) + 1;
        }
    });

    let result = '投票结果：\n';
    alive.forEach(p => {
        result += `${p.name}: ${voteCount[p.id] || 0}票\n`;
    });

    addMessage('system', '主持人', result);

    // 找出最高票
    let maxVotes = 0;
    Object.values(voteCount).forEach(count => {
        if (count > maxVotes) maxVotes = count;
    });

    const eliminatedIds = [];
    Object.entries(voteCount).forEach(([id, count]) => {
        if (count === maxVotes) {
            eliminatedIds.push(id);
        }
    });

    // 处理结果
    if (eliminatedIds.length === 1) {
        const eliminated = gameState.players.find(p => p.id === eliminatedIds[0]);
        eliminated.alive = false;
        gameState.deadPlayers.push(eliminated);
        addMessage('system', '主持人', `${eliminated.name} 被投出，他的身份是 ${eliminated.role}`);

        if (!checkWinCondition()) {
            // 猎人技能
            if (eliminated.role === '猎人') {
                await handleHunterDeath(eliminated);
            }
            if (!checkWinCondition()) {
                gameState.phaseInterval = setTimeout(startNightPhase, gameState.intervalSeconds * 1000);
            }
        }
    } else {
        addMessage('system', '主持人', '平票，进入下一晚');
        if (!checkWinCondition()) {
            gameState.phaseInterval = setTimeout(startNightPhase, gameState.intervalSeconds * 1000);
        }
    }
}

async function handleHunterDeath(hunter) {
    const alive = gameState.players.filter(p => p.alive);
    if (alive.length <= 1) {
        addMessage('system', '主持人', `${hunter.name} 发动猎人技能，但没有可选目标`);
        return;
    }

    addMessage('system', '主持人', `${hunter.name} 是猎人，正在选择要带走谁...`);

    const targets = alive.filter(p => p.id !== hunter.id);
    const dayHistory = getDayHistory();

    try {
        const prompt = `你是猎人${hunter.name}。你被投票淘汰了，可以开枪带走一名玩家。

【可选目标】${targets.map(p => p.name).join('、')}

【今天的发言】
${dayHistory}

选择你要带走的玩家。只回复玩家名字。`;

        const response = await callPlayerAI(hunter, prompt);
        const shot = parseTargetFromResponse(response, targets);
        if (shot) {
            shot.alive = false;
            gameState.deadPlayers.push(shot);
            addMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}（${shot.role}）`);
        }
    } catch (e) {
        const shot = targets[Math.floor(Math.random() * targets.length)];
        if (shot) {
            shot.alive = false;
            gameState.deadPlayers.push(shot);
            addMessage('system', '主持人', `${hunter.name} 发动猎人技能，带走了 ${shot.name}（随机选择）`);
        }
    }
}

// ==================== 胜负判断 ====================
function checkWinCondition() {
    const aliveWolves = gameState.players.filter(p => p.alive && p.role === '狼人').length;
    const aliveGood = gameState.players.filter(p => p.alive && p.role !== '狼人').length;

    if (aliveWolves === 0) {
        endGame('好人胜利');
        return true;
    }
    if (aliveWolves >= aliveGood) {
        endGame('狼人胜利');
        return true;
    }
    return false;
}

function endGame(result) {
    gameState.isRunning = false;
    if (gameState.phaseInterval) {
        clearTimeout(gameState.phaseInterval);
    }
    gameState.phase = PHASE.GAME_END;
    triggerHook('onPhaseChange', gameState.phase);
    addMessage('system', '主持人', `============== 游戏结束：${result} ==============`);
}

// ==================== AI 调用 ====================
async function callAI(prompt, model, endpoint, apiKey) {
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
                stream: false
            })
        });
        const data = await response.json();
        const msg = data.choices?.[0]?.message || {};
        const result = msg.content || msg.reasoning || '';
        APILogger.log({ source: '狼人杀', model, endpoint, prompt, response: result, reasoning: msg.reasoning || '', duration: Date.now() - startTime, success: true });
        return result;
    } catch (e) {
        APILogger.log({ source: '狼人杀', model, endpoint, prompt, duration: Date.now() - startTime, success: false, error: e.message });
        console.error('AI 调用失败:', e);
        throw e;
    }
}

async function callPlayerAI(player, prompt) {
    const model = resolveModel(player.model);
    return callAI(prompt, model, player.endpoint || gameState.gameEndpoint, player.apiKey || gameState.gameApiKey);
}

async function callWolfTeamAI(prompt) {
    return callAI(prompt, gameState.gameModel, gameState.gameEndpoint, gameState.gameApiKey);
}

// ==================== 辅助函数 ====================
function parseTargetFromResponse(response, targets) {
    const text = response.trim();
    return targets.find(p => p.name === text || text.includes(p.name));
}

function parseWitchDecision(response) {
    const text = response.toLowerCase();
    if (text.includes('救') || text.includes('解药')) return 'save';
    if (text.includes('毒') || text.includes('毒药')) return 'poison';
    return null;
}

function parsePoisonTarget(response, targets) {
    return parseTargetFromResponse(response, targets);
}

function buildWolfKillPrompt(wolves, targets, alive) {
    const names = wolves.map(w => w.name).join('、');
    const targetNames = targets.map(t => t.name).join('、');
    return `狼人团队（${names}），请选择今晚要击杀的目标。

【可选目标】${targetNames}

【当前局势】共有 ${alive.length} 人存活。

选择你们认为最威胁或最可能的神职玩家。只回复玩家名字。`;
}

function buildWitchPrompt(witch, nightKill, hasAntidote, hasPoison, alive) {
    const options = [];
    if (hasAntidote) options.push('使用解药救人');
    if (hasPoison) options.push('使用毒药');
    options.push('什么都不做');

    return `你是女巫。昨晚 ${nightKill.name} 被杀。

【你的药水】${hasAntidote ? '解药（还有）' : '解药已用完'}，${hasPoison ? '毒药（还有）' : '毒药已用完'}

【可选操作】${options.join('、')}

请选择你的行动。只回复"救人"、"毒杀XXX"或"不使用"。`;
}

function buildSeerPrompt(seer, checkTargets) {
    return `你是预言家。请选择要查验的玩家。

【可选目标】${checkTargets.map(t => t.name).join('、')}

只回复你想查验的玩家名字。`;
}

function recordNightAction(role, action) {
    gameState.currentNightRecord.push({ role, action, time: new Date().toLocaleTimeString() });
    triggerHook('onNightAction', role, action);
}

// ==================== 导出 ====================
// 导出所有必要的函数和状态供外部使用
window.WerewolfCore = {
    gameState,
    PHASE,
    startGame,
    stopGame,
    pauseGame,
    resumeGame,
    submitUserMessage,
    submitUserVote,
    addMessage,
    getGameHistory,
    getDayHistory,
    generateRoleConfig,
    assignRoles,
    checkWinCondition,
    // 供 UI 设置钩子
    setHook: (name, fn) => { gameState.hooks[name] = fn; }
};
