// ==================== AI战斗模拟器 ====================
// 模型和API函数已在 shared.js 中定义

// 战斗行动
const BATTLE_ACTIONS = [
    '攻击', '防御', '闪避', '反击', '暴击', '格挡', '冲锋', '撤退'
];

// 战斗模式配置
const BATTLE_MODES = {
    'duel': {
        name: '单挑',
        desc: '1v1单挑，双方各选择一项行动，由主持模型判定胜负',
        minPlayers: 2,
        maxPlayers: 2
    },
    'chaos': {
        name: '乱斗',
        desc: '多人自由战斗，每回合同时选择行动，大混战',
        minPlayers: 3,
        maxPlayers: 8
    },
    'team': {
        name: '团队战',
        desc: '分成两队进行团队对战',
        minPlayers: 4,
        maxPlayers: 8
    },
    'battle royale': {
        name: '大逃杀',
        desc: '最后存活者获胜，战斗到只剩一人',
        minPlayers: 3,
        maxPlayers: 16
    }
};

const gameState = {
    fighters: [],
    messages: [],
    isRunning: false,
    isPaused: false,
    currentRound: 0,
    maxRounds: 10,
    battleMode: 'duel',
    intervalSeconds: 3,
    thinkTime: 30,
    showModelInfo: true,
    // 主持人模型配置
    hostModel: 'qwen3:8b',
    hostEndpoint: 'http://localhost:11434/v1',
    hostApiKey: 'ollama',
    // 战斗角色默认配置（使用主持人相同的设置）
    gameApiKey: 'ollama',
    gameEndpoint: 'http://localhost:11434/v1',
    gameModel: 'qwen3:8b',
    phaseInterval: null,
    editingFighterId: null,
    roundActions: {},  // 每回合各角色的行动
    pendingJudgment: null  // 待判定的数据（主持失败时保存）
};

const elements = {
    fightersList: document.getElementById('fighters-list'),
    addFighterBtn: document.getElementById('add-fighter-btn'),
    generateFightersBtn: document.getElementById('generate-fighters-btn'),
    aiGenerateBtn: document.getElementById('ai-generate-btn'),
    fighterModal: document.getElementById('fighter-modal'),
    fighterForm: document.getElementById('fighter-form'),
    fighterName: document.getElementById('fighter-name'),
    fighterDesc: document.getElementById('fighter-desc'),
    fighterHp: document.getElementById('fighter-hp'),
    fighterModel: document.getElementById('fighter-model'),
    fighterEndpoint: document.getElementById('fighter-endpoint'),
    fighterApiKey: document.getElementById('fighter-api-key'),
    maxRounds: document.getElementById('max-rounds'),
    intervalSeconds: document.getElementById('interval-seconds'),
    thinkTime: document.getElementById('think-time'),
    showModelInfo: document.getElementById('show-model-info'),
    hostModel: document.getElementById('host-model'),
    hostEndpoint: document.getElementById('host-endpoint'),
    hostApiKey: document.getElementById('host-api-key'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    continueBtn: document.getElementById('continue-btn'),
    stopBtn: document.getElementById('stop-btn'),
    phaseDisplay: document.getElementById('phase-display'),
    roundDisplay: document.getElementById('round-display'),
    healthBars: document.getElementById('health-bars'),
    battleField: document.getElementById('battle-field'),
    battleMessages: document.getElementById('battle-messages'),
    userMsgInput: document.getElementById('user-msg-input'),
    sendUserMsgBtn: document.getElementById('send-user-msg-btn'),
    modeDesc: document.getElementById('mode-desc')
};

document.addEventListener('DOMContentLoaded', () => {
    // 动态填充模型下拉框
    populateModelSelect(document.getElementById('generate-model'), false, 'qwen3:8b');
    populateModelSelect(document.getElementById('host-model'), false, 'qwen3:8b');
    populateModelSelect(document.getElementById('fighter-model'), false, '__random_all__');

    initEventListeners();
    loadFromStorage();
    renderFighters();
    renderMessages();
    updateHealthBars();
    renderBattleField();
});

// ==================== 事件监听 ====================
function initEventListeners() {
    // 模式选择
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.battleMode = btn.dataset.mode;
            elements.modeDesc.textContent = BATTLE_MODES[gameState.battleMode].desc;
            updateControlButtons();
        });
    });

    elements.addFighterBtn.addEventListener('click', () => openFighterModal());
    elements.generateFightersBtn.addEventListener('click', generateMultipleFighters);
    elements.aiGenerateBtn.addEventListener('click', AIGenerateFighters);
    elements.fighterForm.addEventListener('submit', handleFighterSubmit);
    elements.startBtn.addEventListener('click', startBattle);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.continueBtn.addEventListener('click', continueJudgment);
    elements.stopBtn.addEventListener('click', stopBattle);

    // 主持人模型设置事件
    if (elements.hostModel) {
        elements.hostModel.addEventListener('change', () => {
            gameState.hostModel = elements.hostModel.value;
            saveToStorage();
        });
    }
    if (elements.hostEndpoint) {
        elements.hostEndpoint.addEventListener('change', () => {
            gameState.hostEndpoint = elements.hostEndpoint.value;
            saveToStorage();
        });
    }
    if (elements.hostApiKey) {
        elements.hostApiKey.addEventListener('change', () => {
            gameState.hostApiKey = elements.hostApiKey.value;
            saveToStorage();
        });
    }

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

// ==================== 战斗角色管理 ====================
function openFighterModal(fighter = null) {
    gameState.editingFighterId = fighter ? fighter.id : null;
    elements.fighterModal.classList.add('show');

    if (fighter) {
        elements.fighterName.value = fighter.name;
        elements.fighterDesc.value = fighter.description;
        elements.fighterHp.value = fighter.maxHp;
        elements.fighterModel.value = fighter.model;
        elements.fighterEndpoint.value = fighter.endpoint;
        elements.fighterApiKey.value = fighter.apiKey;
    } else {
        elements.fighterForm.reset();
        elements.fighterModel.value = '__random_all__';
        // 新角色默认使用主持人配置
        elements.fighterEndpoint.value = gameState.hostEndpoint;
        elements.fighterApiKey.value = gameState.hostApiKey;
    }
}

function closeFighterModal() {
    elements.fighterModal.classList.remove('show');
    gameState.editingFighterId = null;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function handleFighterSubmit(e) {
    e.preventDefault();
    const fighter = {
        id: gameState.editingFighterId || Date.now().toString(),
        name: elements.fighterName.value.trim(),
        description: elements.fighterDesc.value.trim(),
        maxHp: parseInt(elements.fighterHp.value) || 100,
        hp: parseInt(elements.fighterHp.value) || 100,
        model: elements.fighterModel.value,
        endpoint: elements.fighterEndpoint.value.trim(),
        apiKey: elements.fighterApiKey.value.trim(),
        alive: true,
        action: null
    };

    if (gameState.editingFighterId) {
        const index = gameState.fighters.findIndex(f => f.id === gameState.editingFighterId);
        if (index !== -1) {
            fighter.hp = gameState.fighters[index].hp;
            fighter.alive = gameState.fighters[index].alive;
            gameState.fighters[index] = fighter;
        }
    } else {
        gameState.fighters.push(fighter);
    }

    saveToStorage();
    renderFighters();
    updateHealthBars();
    renderBattleField();
    closeAllModals();
    updateControlButtons();
}

function deleteFighter(id) {
    gameState.fighters = gameState.fighters.filter(f => f.id !== id);
    saveToStorage();
    renderFighters();
    updateHealthBars();
    renderBattleField();
    updateControlButtons();
}

function renderFighters() {
    if (gameState.fighters.length === 0) {
        elements.fightersList.innerHTML = `<div class="empty-state" style="min-height:80px;padding:15px;"><p>点击"添加"或"生成"创建战斗角色</p></div>`;
        return;
    }

    elements.fightersList.innerHTML = gameState.fighters.map(fighter => {
        const hpClass = fighter.hp / fighter.maxHp < 0.3 ? 'low' : '';
        const deadClass = !fighter.alive ? 'dead' : '';
        return `
            <div class="fighter-card ${deadClass}" data-id="${fighter.id}">
                <div class="fighter-info">
                    <div>
                        <div class="fighter-name">
                            <i class="fas fa-khanda"></i>
                            ${escapeHtml(fighter.name)}
                            <span class="fighter-hp ${hpClass}">❤️ ${fighter.hp}/${fighter.maxHp}</span>
                        </div>
                        <div class="fighter-desc">${escapeHtml(fighter.description)}</div>
                    </div>
                </div>
                <div class="fighter-actions">
                    <button class="fighter-action-btn edit" onclick="openFighterModal(getFighterById('${fighter.id}'))"><i class="fas fa-edit"></i></button>
                    <button class="fighter-action-btn delete" onclick="deleteFighter('${fighter.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');
}

function getFighterById(id) { return gameState.fighters.find(f => f.id === id); }

// ==================== 随机生成角色 ====================
async function generateMultipleFighters() {
    const count = parseInt(document.getElementById('generate-count').value) || 4;
    const selectedModel = document.getElementById('generate-model').value;
    
    const names = ['剑圣', '刺客', '战士', '法师', '弓手', '骑士', '恶魔', '天使', '龙', '凤凰', '狼', '熊', '虎', '豹', '蛇', '鹰'];
    const descs = [
        '擅长近身战斗，一剑封喉', '速度极快，来无影去无踪', '力量型选手，一力降十会',
        '远程魔法攻击，掌控元素', '百步穿杨，箭无虚发', '身披重甲，防御无双',
        '黑暗力量，诡异莫测', '光明之力，净化一切', '喷火吐息，毁天灭地',
        '浴火重生，不死之身', '凶猛野兽本能', '王者之气，睥睨天下'
    ];
    
    // 根据选择确定模型
    let model = selectedModel;
    if (selectedModel === '__random_all__' || selectedModel === '__random_local__' || selectedModel === '__random_cloud__') {
        model = resolveModel(selectedModel);
    }

    for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)] + (i + 1);
        const desc = descs[Math.floor(Math.random() * descs.length)];
        
        const fighter = {
            id: Date.now().toString() + i,
            name: name,
            description: desc,
            maxHp: 80 + Math.floor(Math.random() * 40),
            hp: 80 + Math.floor(Math.random() * 40),
            model: model,
            endpoint: gameState.gameEndpoint,
            apiKey: gameState.gameApiKey,
            alive: true,
            action: null
        };
        fighter.hp = fighter.maxHp;
        gameState.fighters.push(fighter);
    }

    saveToStorage();
    renderFighters();
    updateHealthBars();
    renderBattleField();
    updateControlButtons();
    alert(`已生成 ${count} 个战斗角色！`);
}

// ==================== AI 生成角色 ====================
async function AIGenerateFighters() {
    const count = parseInt(document.getElementById('generate-count').value) || 2;
    const selectedModel = document.getElementById('generate-model').value;

    addBattleMessage('system', '系统', `🤖 正在使用 AI 生成 ${count} 个战斗角色...`);

    const prompt = `你是一个游戏角色设计大师。请生成${count}个独特的战斗角色。

要求：
1. 每个角色需要有：name(名称)、description(简短描述，20 字内)、style(战斗风格，如"剑客"、"法师"、"刺客"等，尽可能多样)
2. 输出 JSON 数组格式，例如：
[{"name":"青锋剑客","description":"剑术超群","style":"剑客"},{"name":"烈焰法师","description":"掌控火焰","style":"法师"}]
3. 角色名称要独特，不要重复
4. 每个角色要有不同的战斗风格

请直接输出 JSON 数组，不要其他内容。`;

    try {
        let model = selectedModel;
        let isCloudModel = false;

        if (selectedModel === '__random_all__' || selectedModel === '__random_local__' || selectedModel === '__random_cloud__') {
            model = resolveModel(selectedModel);
            isCloudModel = model.includes(':cloud');
        } else {
            isCloudModel = selectedModel.includes(':cloud');
        }

        let content;

        if (isCloudModel) {
            // 云端模型：使用 CloudBase 云函数
            console.log('使用云端模型生成战斗角色:', model);
            // 修复：直接使用本地 Ollama 调用云端模型
            const endpoint = gameState.gameEndpoint;
            const apiKey = gameState.gameApiKey;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                })
            });
            const data = await response.json();
            content = data.choices?.[0]?.message?.content || '';
        } else {
            // 本地模型：调用本地 Ollama
            const endpoint = gameState.gameEndpoint;
            const apiKey = gameState.gameApiKey;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                })
            });

            const data = await response.json();
            content = data.choices?.[0]?.message?.content || '';
        }

        // 提取JSON
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('无法解析AI生成的角色');

        const characters = JSON.parse(jsonMatch[0]);

        for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            const fighter = {
                id: Date.now().toString() + i,
                name: char.name || '未知角色',
                description: char.description || char.style || '战斗者',
                maxHp: 80 + Math.floor(Math.random() * 40),
                hp: 80 + Math.floor(Math.random() * 40),
                model: model,
                endpoint: gameState.gameEndpoint,
                apiKey: gameState.gameApiKey,
                alive: true,
                action: null
            };
            fighter.hp = fighter.maxHp;
            gameState.fighters.push(fighter);
        }

        saveToStorage();
        renderFighters();
        updateHealthBars();
        renderBattleField();
        updateControlButtons();

        addBattleMessage('system', '系统', `✅ AI成功生成 ${characters.length} 个战斗角色！`);

    } catch (e) {
        console.error(e);
        addBattleMessage('system', '系统', `❌ AI生成失败: ${e.message}`);
        alert('AI生成失败: ' + e.message);
    }
}

// ==================== 战斗控制 ====================
function updateControlButtons() {
    const mode = BATTLE_MODES[gameState.battleMode];
    const validCount = gameState.fighters.length >= mode.minPlayers && gameState.fighters.length <= mode.maxPlayers;
    
    // 如果有待判定数据，显示continue按钮，否则显示start按钮
    if (gameState.pendingJudgment) {
        elements.startBtn.style.display = 'none';
        elements.continueBtn.style.display = 'inline-flex';
    } else {
        elements.startBtn.style.display = 'inline-flex';
        elements.startBtn.disabled = gameState.isRunning || !validCount;
        elements.continueBtn.style.display = 'none';
    }
    
    elements.stopBtn.disabled = !gameState.isRunning;
}

function togglePause() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
        addBattleMessage('system', '系统', '【战斗暂停】');
    } else {
        addBattleMessage('system', '系统', '【战斗继续】');
        // 继续当前回合
        if (gameState.currentRound > 0) {
            executeRound();
        }
    }
    
    updateControlButtons();
}

function startBattle() {
    if (gameState.fighters.length < 2) {
        alert('至少需要 2 名战斗角色');
        return;
    }

    // 重置战斗状态
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.currentRound = 0;
    gameState.roundActions = {};
    gameState.maxRounds = parseInt(elements.maxRounds.value) || 10;
    gameState.intervalSeconds = parseInt(elements.intervalSeconds.value) || 3;
    gameState.thinkTime = parseInt(elements.thinkTime.value) || 30;
    gameState.showModelInfo = elements.showModelInfo ? elements.showModelInfo.checked : true;

    // 重置角色状态
    gameState.fighters.forEach(f => {
        f.hp = f.maxHp;
        f.alive = true;
        f.action = null;
    });

    addBattleMessage('system', '系统', `========== 战斗开始 ==========
模式：${BATTLE_MODES[gameState.battleMode].name}
参战角色：${gameState.fighters.map(f => f.name).join('、')}`);

    updateControlButtons();
    updateHealthBars();
    renderBattleField();
    updatePhaseDisplay();

    // 开始第一回合
    nextRound();
}

function stopBattle() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.pendingJudgment = null;
    if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
    
    // 恢复按钮显示
    elements.startBtn.style.display = 'inline-flex';
    elements.continueBtn.style.display = 'none';
    
    addBattleMessage('system', '系统', '战斗已终止');
    updateControlButtons();
}

function updatePhaseDisplay() {
    if (!gameState.isRunning) {
        elements.phaseDisplay.textContent = '等待开始';
        elements.roundDisplay.textContent = '第 0 回合';
    } else if (gameState.isPaused) {
        elements.phaseDisplay.textContent = '暂停中';
    } else {
        elements.phaseDisplay.textContent = '战斗中';
        elements.roundDisplay.textContent = `第 ${gameState.currentRound} 回合`;
    }
}

// ==================== 战斗逻辑 ====================
async function nextRound() {
    if (!gameState.isRunning || gameState.isPaused) return;

    // 检查是否有人存活
    const aliveFighters = gameState.fighters.filter(f => f.alive);
    if (aliveFighters.length <= 1) {
        endBattle(aliveFighters[0]);
        return;
    }

    // 检查回合数
    if (gameState.currentRound >= gameState.maxRounds) {
        addBattleMessage('system', '系统', '========== 战斗结束：回合数耗尽 ==========');
        const winner = gameState.fighters.sort((a, b) => b.hp - a.hp)[0];
        endBattle(winner);
        return;
    }

    gameState.currentRound++;
    gameState.roundActions = {};
    
    addBattleMessage('round', '系统', `========== 第 ${gameState.currentRound} 回合 ==========`);
    updatePhaseDisplay();

    // 等待所有角色选择行动
    await selectActions();

    // 执行回合
    executeRound();
}

async function selectActions() {
    const aliveFighters = gameState.fighters.filter(f => f.alive);
    
    // 所有角色同时选择行动
    const promises = aliveFighters.map(async (fighter) => {
        const action = await getFighterAction(fighter, aliveFighters);
        gameState.roundActions[fighter.id] = action;
        fighter.action = action;
    });

    await Promise.all(promises);
}

async function getFighterAction(fighter, aliveFighters) {
    const otherFighters = aliveFighters.filter(f => f.id !== fighter.id);
    const enemies = otherFighters.map(f => `${f.name}(HP:${f.hp})`).join('、');
    
    const prompt = `你是战斗角色${fighter.name}。${fighter.description}
    
当前存活敌人：${enemies}

可用行动：
- 攻击：发动各种攻击，造成不同伤害（根据角色设定）
- 防御：使用各种防御能力（根据角色设定）
- 闪避：尝试躲避地方攻击（根据角色设定）
- 撤退：尝试脱离战斗圈（根据角色设定）

请根据当前局势选择最佳行动，直接说行动名称（如"攻击"），加上根据角色设定的具体动作或者技能，不要其他话。`;

    try {
        const model = resolveModel(fighter.model);
        const response = await fetch(`${fighter.endpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fighter.apiKey}` },
            body: JSON.stringify({ 
                model: model, 
                messages: [{ role: 'user', content: prompt }], 
                stream: false 
            })
        });
        const data = await response.json();
        const action = data.choices[0].message.content.trim();
        
        // 解析行动
        for (const validAction of BATTLE_ACTIONS) {
            if (action.includes(validAction)) {
                return validAction;
            }
        }
        return '攻击'; // 默认
    } catch (e) {
        console.error('AI决策失败:', e);
        return '攻击';
    }
}

function executeRound() {
    if (!gameState.isRunning || gameState.isPaused) return;

    const aliveFighters = gameState.fighters.filter(f => f.alive);
    
    // 显示所有角色的行动
    aliveFighters.forEach(fighter => {
        const action = gameState.roundActions[fighter.id] || '攻击';
        addBattleMessage('action', fighter.name, `选择了【${action}】`);
    });

    // 判定战斗结果
    resolveBattle();

    // 更新显示
    updateHealthBars();
    renderBattleField();

    // 继续下一回合
    gameState.phaseInterval = setTimeout(nextRound, gameState.intervalSeconds * 1000);
}

function resolveBattle() {
    const aliveFighters = gameState.fighters.filter(f => f.alive);
    
    // 使用主持模型判定结果
    resolveWithHostModel(aliveFighters);
}

async function resolveWithHostModel(aliveFighters) {
    const actionsInfo = aliveFighters.map(f => {
        const action = gameState.roundActions[f.id] || '攻击';
        return `${f.name}：${action}(HP:${f.hp}/${f.maxHp})`;
    }).join('\n');

    const prompt = `你是战斗主持。请根据以下战斗行动判定结果：

${actionsInfo}

规则：
暴击：造成伤害时可以触发，包括弱点攻击，根据角色设定提高一定伤害。
Miss：闪避时可以触发，触发后完全躲避伤害，根据角色设定。
格挡：防御时可以触发，触发后减少部分伤害，根据角色设定。
反击：格挡和Miss时可能触发，根据角色设定，触发后根据情景进行不同反击。
弱点：根据角色设定，不同角色有不同弱点，允许无弱点。



行动：
- 攻击：发动各种攻击，造成不同伤害（根据角色设定）
- 防御：使用各种防御能力（根据角色设定）
- 闪避：尝试躲避地方攻击（根据角色设定）
- 撤退：尝试脱离战斗圈（根据角色设定）



请判定每个人受到的伤害，用以下格式输出：
【伤害结果】
角色A：-15
角色B：-0（Miss）
角色C：-20（暴击）
角色D：-5（格挡）
角色A：-20（B反击）
注：仅为例子，不代表触发概率。

输出伤害结果和战斗过程，不要其他话。`;

    // 保存待判定数据
    gameState.pendingJudgment = { prompt, aliveFighters };

    try {
        const response = await fetch(`${gameState.hostEndpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gameState.hostApiKey}` },
            body: JSON.stringify({
                model: gameState.hostModel,
                messages: [{ role: 'user', content: prompt }],
                stream: false
            })
        });
        const data = await response.json();
        const result = data.choices[0].message.content;

        addBattleMessage('result', `主持(${gameState.hostModel})`, result);

        // 解析伤害结果并应用
        parseAndApplyDamage(result);

        // 成功后清除待判定数据
        gameState.pendingJudgment = null;

    } catch (e) {
        console.error('主持判定失败', e);

        // 暂停战斗，显示继续判定按钮
        gameState.isRunning = false;
        elements.pauseBtn.disabled = true;
        elements.startBtn.style.display = 'none';
        elements.continueBtn.style.display = 'inline-flex';

        addBattleMessage('system', '系统', `❌ 主持判定失败(${gameState.hostModel})！请更换主持模型后点击"继续判定"按钮。`);

        return; // 不再继续
    }
}

// 继续判定函数
async function continueJudgment() {
    if (!gameState.pendingJudgment) {
        alert('没有待判定的数据');
        return;
    }
    
    const { prompt, aliveFighters } = gameState.pendingJudgment;
    
    // 恢复按钮状态
    elements.startBtn.style.display = 'none';
    elements.continueBtn.style.display = 'none';
    
    addBattleMessage('system', '系统', `🔄 重新请求主持判定 (${gameState.hostModel})...`);

    try {
        const response = await fetch(`${gameState.hostEndpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gameState.hostApiKey}` },
            body: JSON.stringify({
                model: gameState.hostModel,
                messages: [{ role: 'user', content: prompt }],
                stream: false
            })
        });
        const data = await response.json();
        const result = data.choices[0].message.content;

        addBattleMessage('result', `主持 (${gameState.hostModel})`, result);
        
        // 解析伤害结果并应用
        parseAndApplyDamage(result);
        
        // 成功后清除待判定数据，恢复按钮
        gameState.pendingJudgment = null;
        elements.startBtn.style.display = 'inline-flex';
        elements.continueBtn.style.display = 'none';
        elements.startBtn.disabled = true;
        
        // 继续下一回合
        setTimeout(() => {
            gameState.currentRound++;
            gameState.isRunning = true;
            elements.startBtn.disabled = true;
            elements.pauseBtn.disabled = false;
            elements.stopBtn.disabled = false;
            // 修复：调用正确的函数
            nextRound();
        }, 2000);
        
    } catch (e) {
        console.error('继续判定失败', e);
        addBattleMessage('system', '系统', '❌ 继续判定失败！请检查主持配置后重试。');
    }
}

function parseAndApplyDamage(resultText) {
    const lines = resultText.split('\n');
    
    for (const line of lines) {
        // 匹配 "角色名：-数字" 格式
        const match = line.match(/(.+?)[：:]\s*(-?\d+)/);
        if (match) {
            const name = match[1].trim();
            const damage = Math.abs(parseInt(match[2]));
            
            const fighter = gameState.fighters.find(f => f.name === name && f.alive);
            if (fighter) {
                applyDamage(fighter, damage);
            }
        }
    }
}

function applyDamage(fighter, damage) {
    const oldHp = fighter.hp;
    fighter.hp = Math.max(0, fighter.hp - damage);
    
    // 检查是否死亡
    if (fighter.hp <= 0 && oldHp > 0) {
        fighter.alive = false;
        addBattleMessage('system', '系统', `${fighter.name} 被击败！`);
    }
}

function endBattle(winner) {
    gameState.isRunning = false;
    if (gameState.phaseInterval) clearTimeout(gameState.phaseInterval);
    
    if (winner) {
        addBattleMessage('system', '系统', `========== 战斗结束 ==========\n🏆 获胜者：${winner.name} (HP:${winner.hp}/${winner.maxHp})`);
    } else {
        addBattleMessage('system', '系统', '========== 战斗结束 ==========\n平局，无人生还！');
    }
    
    // 恢复按钮状态
    elements.startBtn.style.display = 'inline-flex';
    elements.continueBtn.style.display = 'none';
    elements.pauseBtn.disabled = false;
    elements.stopBtn.disabled = true;
    
    updateControlButtons();
    updatePhaseDisplay();
}

// ==================== 界面更新 ====================
function updateHealthBars() {
    if (gameState.fighters.length === 0) {
        elements.healthBars.innerHTML = '';
        return;
    }

    elements.healthBars.innerHTML = gameState.fighters.map(fighter => {
        const percent = (fighter.hp / fighter.maxHp) * 100;
        const lowClass = percent < 30 ? 'low' : '';
        return `
            <div class="health-bar">
                <span class="name">${escapeHtml(fighter.name)}</span>
                <div class="bar">
                    <div class="fill ${lowClass}" style="width: ${percent}%"></div>
                </div>
                <span class="hp-text">${fighter.hp}/${fighter.maxHp}</span>
            </div>`;
    }).join('');
}

function renderBattleField() {
    if (gameState.fighters.length === 0) {
        elements.battleField.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-khanda"></i>
                <p>添加战斗角色后，点击"开始战斗"</p>
            </div>`;
        return;
    }

    elements.battleField.innerHTML = gameState.fighters.map(fighter => {
        const activeClass = gameState.isRunning && fighter.alive ? 'active' : '';
        const deadClass = !fighter.alive ? 'dead' : '';
        const action = fighter.action ? fighter.action : '';
        
        return `
            <div class="fighter-sprite ${activeClass} ${deadClass}" data-id="${fighter.id}">
                <div class="sprite-icon"><i class="fas fa-khanda"></i></div>
                <div class="sprite-name">${escapeHtml(fighter.name)}</div>
                <div class="sprite-action">${action}</div>
            </div>`;
    }).join('');
}

// ==================== 消息系统 ====================
function addBattleMessage(type, sender, text) {
    const msg = { 
        type, 
        sender, 
        text, 
        time: new Date().toLocaleTimeString() 
    };
    gameState.messages.push(msg);
    renderMessages();
    scrollToBottom();
}

function renderMessages() {
    if (gameState.messages.length === 0) {
        elements.battleMessages.innerHTML = '';
        return;
    }

    elements.battleMessages.innerHTML = gameState.messages.map(msg => {
        const iconMap = {
            'system': 'fa-crown',
            'round': 'fa-play',
            'action': 'fa-fist-raised',
            'result': 'fa-trophy'
        };
        const icon = iconMap[msg.type] || 'fa-user';
        
        return `
            <div class="battle-message ${msg.type}">
                <div class="msg-icon"><i class="fas ${icon}"></i></div>
                <div class="msg-content">
                    <div class="msg-sender">${escapeHtml(msg.sender)}</div>
                    <div class="msg-text">${escapeHtml(msg.text)}</div>
                </div>
            </div>`;
    }).join('');
}

function scrollToBottom() {
    elements.battleMessages.scrollTop = elements.battleMessages.scrollHeight;
}

// 工具函数 - resolveModel 和 escapeHtml 已由 shared.js 提供

// ==================== 存储 ====================
function saveToStorage() {
    try {
        localStorage.setItem('battle_state', JSON.stringify({
            fighters: gameState.fighters,
            settings: {
                battleMode: gameState.battleMode,
                maxRounds: gameState.maxRounds,
                intervalSeconds: gameState.intervalSeconds,
                thinkTime: gameState.thinkTime,
                showModelInfo: gameState.showModelInfo,
                hostModel: gameState.hostModel,
                hostEndpoint: gameState.hostEndpoint,
                hostApiKey: gameState.hostApiKey,
                // 新增：保存游戏角色配置
                gameModel: gameState.gameModel,
                gameEndpoint: gameState.gameEndpoint,
                gameApiKey: gameState.gameApiKey
            }
        }));
    } catch (e) {
        console.error('保存失败:', e);
    }
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('battle_state'));
        if (data) {
            gameState.fighters = data.fighters || [];
            if (data.settings) {
                gameState.battleMode = data.settings.battleMode || 'duel';
                gameState.maxRounds = data.settings.maxRounds || 10;
                gameState.intervalSeconds = data.settings.intervalSeconds || 3;
                gameState.thinkTime = data.settings.thinkTime || 30;
                gameState.showModelInfo = data.settings.showModelInfo !== false;
                
                // 主持人模型设置
                gameState.hostModel = data.settings.hostModel || 'qwen3:8b';
                gameState.hostEndpoint = data.settings.hostEndpoint || 'http://localhost:11434/v1';
                gameState.hostApiKey = data.settings.hostApiKey || 'ollama';
                
                // 新增：加载游戏角色配置
                gameState.gameModel = data.settings.gameModel || 'qwen3:8b';
                gameState.gameEndpoint = data.settings.gameEndpoint || 'http://localhost:11434/v1';
                gameState.gameApiKey = data.settings.gameApiKey || 'ollama';
                
                // 更新 UI
                if (elements.maxRounds) elements.maxRounds.value = gameState.maxRounds;
                if (elements.intervalSeconds) elements.intervalSeconds.value = gameState.intervalSeconds;
                if (elements.thinkTime) elements.thinkTime.value = gameState.thinkTime;
                if (elements.showModelInfo) elements.showModelInfo.checked = gameState.showModelInfo;
                if (elements.hostModel) elements.hostModel.value = gameState.hostModel;
                if (elements.hostEndpoint) elements.hostEndpoint.value = gameState.hostEndpoint;
                if (elements.hostApiKey) elements.hostApiKey.value = gameState.hostApiKey;
                
                // 更新模式按钮
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === gameState.battleMode);
                });
                if (elements.modeDesc) {
                    elements.modeDesc.textContent = BATTLE_MODES[gameState.battleMode].desc;
                }
            }
        }
    } catch (e) {
        console.error('加载失败:', e);
    }
}
