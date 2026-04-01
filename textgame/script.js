// 应用全局状态
const AppState = {
    currentTab: 'game',
    gamePhase: 'init', // init, creation, playing
    worldData: null,
    characterData: null,
    gameState: {
        playerName: '冒险者',
        level: 1,
        chapter: '序章',
        playTime: 0, // 游戏时长（分钟）
        sceneTitle: '神秘的森林',
        sceneDescription: '你站在一片古老的森林入口，前方是蜿蜒的小径，阳光透过树叶洒下斑驳的光影。远处似乎传来神秘的呼唤声，你可以感觉到空气中弥漫着魔法的气息。你将如何选择你的道路？',
        storyHistory: [],
        aiResponse: null,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        exp: 0,
        maxExp: 100,
        inventory: [], // 物品数组，每项 {id, name, quantity, type, description, stats}
        skills: [],
        location: null,
        // 装备系统 - 三个槽位
        equipment: {
            weapon: null,   // 武器 {name, stats, description}
            armor: null,    // 防具
            accessory: null // 饰品
        },
        // 地图系统 - 格子式地图
        mapData: {
            gridSize: 5, // 地图大小，5x5
            playerPosition: { x: 2, y: 2 }, // 玩家位置，中心点
            discoveredTiles: [{ x: 2, y: 2 }], // 已探索的区域
            tiles: {} // 地图格子数据 {x_y: {name, description, level, imagePrompt, specialEvents}}
        },
        // 任务系统
        questData: {
            activeQuests: [], // 当前进行的任务
            completedQuests: [], // 已完成的任务
            availableQuests: [], // 可接取的任务
            questHistory: [] // 任务历史记录
        }
    },
    saves: [],
    filteredSaves: [],
    currentSavePage: 1,
    itemsPerPage: 10,
    settings: {
        apiKey: 'ollama',
        apiModel: 'minimax-m2.5:cloud',
        apiEndpoint: 'http://localhost:11434',
        playerName: '冒险者',
        autoSave: 'enabled',
        maxSaves: 20,
        showSceneImages: 'disabled',
        alchemyCheatMode: 'disabled' // 炼丹作弊模式：enabled/disabled
    },
    // AI炼丹炉状态
    alchemy: {
        mode: 'game', // 'game' 或 'simulation'
        selectedMaterials: [], // 游戏模式已选材料
        selectedCauldron: null, // 游戏模式已选炉鼎
        fireLevel: 'wen', // 火候: 'wen', 'wu', 'tian'
        duration: 2, // 炼制时间（时辰）
        formulas: [], // 已掌握的配方
        stats: {
            totalCount: 0,
            successCount: 0
        },
        isProcessing: false
    }
};

// DOM元素引用 - 使用函数延迟获取，避免DOM未加载问题
let Elements = {};

function initElements() {
    Elements = {
        // 标签页
        tabButtons: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        alchemyTabContent: document.getElementById('alchemy'),
        
        // 游戏状态栏
        playerName: document.getElementById('player-name'),
        playerLevel: document.getElementById('player-level'),
        currentChapter: document.getElementById('current-chapter'),
        playTime: document.getElementById('play-time'),
        
        // 游戏初始化界面
        gameInitContainer: document.getElementById('game-init-container'),
        newRandomWorldBtn: document.getElementById('new-random-world-btn'),
        loadExistingGameBtn: document.getElementById('load-existing-game-btn'),
        worldOptions: document.getElementById('world-options'),
        worldTheme: document.getElementById('world-theme'),
        worldDifficulty: document.getElementById('world-difficulty'),

        generateWorldBtn: document.getElementById('generate-world-btn'),
        worldLoading: document.getElementById('world-loading'),
        
        // 角色创建界面
        characterCreationContainer: document.getElementById('character-creation-container'),
        characterInfo: document.getElementById('character-info'),
        characterChoices: document.getElementById('character-choices'),
        rerollCharacterBtn: document.getElementById('reroll-character-btn'),
        confirmCharacterBtn: document.getElementById('confirm-character-btn'),
        
        // 游戏主界面
        gameContainer: document.getElementById('game-container'),
        healthBar: document.getElementById('health-bar'),
        healthValue: document.getElementById('health-value'),
        manaBar: document.getElementById('mana-bar'),
        manaValue: document.getElementById('mana-value'),
        expBar: document.getElementById('exp-bar'),
        expValue: document.getElementById('exp-value'),
        inventoryBtn: document.getElementById('inventory-btn'),
        skillsBtn: document.getElementById('skills-btn'),
        questsBtn: document.getElementById('quests-btn'),
        mapBtn: document.getElementById('map-btn'),
        saveQuickBtn: document.getElementById('save-quick-btn'),
        sceneImage: document.getElementById('scene-image'),
        scenePlaceholder: document.getElementById('scene-placeholder'),
        sceneTitle: document.getElementById('scene-title'),
        sceneDescription: document.getElementById('scene-description'),
        playerAction: document.getElementById('player-action'),
        actionType: document.getElementById('action-type'),
        availableActions: document.getElementById('available-actions'),
        submitActionBtn: document.getElementById('submit-action-btn'),
        aiResponseSection: document.getElementById('ai-response-section'),
        aiResponse: document.getElementById('ai-response'),

        regenerateActionBtn: document.getElementById('regenerate-action-btn'),
        saveGameBtn: document.getElementById('save-game-btn'),
        
        // 存档页面
        createNewSaveBtn: document.getElementById('create-new-save-btn'),
        importSaveBtn: document.getElementById('import-save-btn'),
        exportAllSavesBtn: document.getElementById('export-all-saves-btn'),
        savesCount: document.getElementById('saves-count'),
        sortSavesBtn: document.getElementById('sort-saves-btn'),
        savesTbody: document.getElementById('saves-tbody'),
        noSaves: document.getElementById('no-saves'),
        savesPagination: document.getElementById('saves-pagination'),
        
        // 设置页面
        apiKey: document.getElementById('api-key'),
        toggleApiKey: document.getElementById('toggle-api-key'),
        apiModel: document.getElementById('api-model'),
        apiEndpoint: document.getElementById('api-endpoint'),
        showSceneImages: document.getElementById('show-scene-images'),
        alchemyCheatMode: document.getElementById('alchemy-cheat-mode'),
        playerNameInput: document.getElementById('player-name-input'),
        autoSave: document.getElementById('auto-save'),
        maxSaves: document.getElementById('max-saves'),
        exportAllBtn: document.getElementById('export-all-btn'),
        importBtn: document.getElementById('import-btn'),
        clearDataBtn: document.getElementById('clear-data-btn'),
        
        // 模态框
        modal: document.getElementById('modal'),
        caseModal: document.getElementById('case-modal'),
        modalBody: document.getElementById('modal-body'),
        caseModalBody: document.getElementById('case-modal-body'),
        closeButtons: document.querySelectorAll('.close'),
        
        // 加载指示器
        loadingOverlay: document.getElementById('loading-overlay'),

        // AI炼丹炉 - 新版
        modeBtns: document.querySelectorAll('.mode-btn'),
        simulationModeSection: document.getElementById('simulation-mode-section'),
        gameModeSection: document.getElementById('game-mode-section'),
        formulasSection: document.getElementById('formulas-section'),
        formulaGrid: document.getElementById('formula-grid'),
        formulaEmpty: document.getElementById('formula-empty'),
        openInventoryBtn: document.getElementById('open-inventory-btn'),
        openCauldronInventoryBtn: document.getElementById('open-cauldron-inventory-btn'),
        materialsSection: document.getElementById('materials-section'),
        selectedCount: document.getElementById('selected-count'),
        selectedList: document.getElementById('selected-list'),
        cauldronSection: document.getElementById('cauldron-section'),
        selectedCauldron: document.getElementById('selected-cauldron'),
        gameParamsSection: document.getElementById('game-params-section'),
        simHerbs: document.getElementById('sim-herbs'),
        simCauldron: document.getElementById('sim-cauldron'),
        simExpectedPill: document.getElementById('sim-expected-pill'),
        simDuration: document.getElementById('sim-duration'),
        fireLevel: document.getElementById('fire-level'),
        duration: document.getElementById('duration'),
        startAlchemyBtn: document.getElementById('start-alchemy-btn'),
        processSection: document.getElementById('process-section'),
        processLog: document.getElementById('process-log'),
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        resultSection: document.getElementById('result-section'),
        resultCard: document.getElementById('result-card'),
        resultIcon: document.getElementById('result-icon'),
        resultTitle: document.getElementById('result-title'),
        resultDesc: document.getElementById('result-desc'),
        resultQuality: document.getElementById('result-quality'),
        saveFormulaBtn: document.getElementById('save-formula-btn'),
        addPillToInventoryBtn: document.getElementById('add-pill-to-inventory-btn'),
        retryAlchemyBtn: document.getElementById('retry-alchemy-btn'),
        alchemyCount: document.getElementById('alchemy-count'),
        alchemyRate: document.getElementById('alchemy-rate'),
        formulaCount: document.getElementById('formula-count'),
        formulaCountDisplay: document.getElementById('formula-count-display'),
        formulaSavedToast: document.getElementById('formula-saved-toast')
    };
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initElements(); // 初始化DOM元素引用

    // 调试输出
    console.log('标签页按钮数量:', Elements.tabButtons.length);
    console.log('标签页内容数量:', Elements.tabContents.length);
    console.log('炼丹炉标签页元素:', Elements.alchemyTabContent);

    loadSettings();
    loadGameState();
    loadSaves();
    setupEventListeners();

    // 动态加载模型列表
    loadModelOptions();

    // 启动游戏时长计时器
    startPlayTimeTimer();

    // 检查是否有保存的游戏状态
    if (AppState.gameState.location) {
        // 有游戏状态，直接显示游戏界面
        AppState.gamePhase = 'playing';
        showGameInterface('game');
        updateGameUI();
    } else {
        // 没有游戏状态，显示初始化界面
        AppState.gamePhase = 'init';
        showGameInterface('init');
    }

    updateSavesDisplay();

    // 默认切换到游戏标签页
    switchTab('game');
}

// 游戏时长计时器
function startPlayTimeTimer() {
    setInterval(function() {
        if (AppState.gamePhase === 'playing') {
            AppState.gameState.playTime = (AppState.gameState.playTime || 0) + 1;
            // 每5分钟自动保存一次
            if (AppState.gameState.playTime % 5 === 0 && AppState.settings.autoSave === 'enabled') {
                autoSaveGame();
            }
        }
    }, 60000); // 每分钟更新一次
}

// 设置事件监听器
function setupEventListeners() {
    // 标签页切换
    if (Elements.tabButtons && Elements.tabButtons.length > 0) {
        Elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });
    }

    // 游戏初始化按钮
    if (Elements.newRandomWorldBtn) Elements.newRandomWorldBtn.addEventListener('click', () => showWorldOptions());
    if (Elements.loadExistingGameBtn) Elements.loadExistingGameBtn.addEventListener('click', () => switchTab('saves'));
    if (Elements.generateWorldBtn) Elements.generateWorldBtn.addEventListener('click', generateWorld);

    // 角色创建按钮
    if (Elements.rerollCharacterBtn) Elements.rerollCharacterBtn.addEventListener('click', rerollCharacter);
    if (Elements.confirmCharacterBtn) Elements.confirmCharacterBtn.addEventListener('click', confirmCharacter);

    // 游戏页面按钮
    if (Elements.submitActionBtn) Elements.submitActionBtn.addEventListener('click', submitPlayerAction);
    if (Elements.regenerateActionBtn) Elements.regenerateActionBtn.addEventListener('click', regenerateAIResponse);
    if (Elements.saveGameBtn) Elements.saveGameBtn.addEventListener('click', () => showSaveDialog());
    if (Elements.saveQuickBtn) Elements.saveQuickBtn.addEventListener('click', () => showSaveDialog());

    // 快捷操作按钮
    if (Elements.inventoryBtn) Elements.inventoryBtn.addEventListener('click', () => showInventory());
    if (Elements.skillsBtn) Elements.skillsBtn.addEventListener('click', () => showSkills());
    if (Elements.questsBtn) Elements.questsBtn.addEventListener('click', () => showQuests());
    if (Elements.mapBtn) Elements.mapBtn.addEventListener('click', () => showMap());

    // 存档页面按钮
    if (Elements.createNewSaveBtn) Elements.createNewSaveBtn.addEventListener('click', () => showGameInterface('init'));
    if (Elements.importSaveBtn) Elements.importSaveBtn.addEventListener('click', importSaveFile);
    if (Elements.exportAllSavesBtn) Elements.exportAllSavesBtn.addEventListener('click', exportAllSaves);
    if (Elements.sortSavesBtn) Elements.sortSavesBtn.addEventListener('click', sortSaves);

    // 设置页面
    if (Elements.toggleApiKey) Elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    if (Elements.apiKey) Elements.apiKey.addEventListener('change', updateSetting.bind(null, 'apiKey'));
    if (Elements.apiModel) Elements.apiModel.addEventListener('change', updateSetting.bind(null, 'apiModel'));
    if (Elements.apiEndpoint) Elements.apiEndpoint.addEventListener('change', updateSetting.bind(null, 'apiEndpoint'));
    if (Elements.playerNameInput) Elements.playerNameInput.addEventListener('change', updateSetting.bind(null, 'playerName'));
    if (Elements.autoSave) Elements.autoSave.addEventListener('change', updateSetting.bind(null, 'autoSave'));
    if (Elements.maxSaves) Elements.maxSaves.addEventListener('change', updateSetting.bind(null, 'maxSaves'));
    if (Elements.alchemyCheatMode) Elements.alchemyCheatMode.addEventListener('change', updateSetting.bind(null, 'alchemyCheatMode'));
    if (Elements.exportAllBtn) Elements.exportAllBtn.addEventListener('click', exportAllData);
    if (Elements.importBtn) Elements.importBtn.addEventListener('click', importData);
    if (Elements.clearDataBtn) Elements.clearDataBtn.addEventListener('click', clearAllData);

    // AI炼丹炉事件
    setupAlchemyEventListeners();

    // 模态框关闭
    if (Elements.closeButtons && Elements.closeButtons.length > 0) {
        Elements.closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                Elements.modal.style.display = 'none';
                Elements.caseModal.style.display = 'none';
            });
        });
    }

    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (Elements.modal && event.target === Elements.modal) {
            Elements.modal.style.display = 'none';
        }
        if (Elements.caseModal && event.target === Elements.caseModal) {
            Elements.caseModal.style.display = 'none';
        }
    });
}

// 标签页切换
function switchTab(tabName) {
    console.log('切换到标签页:', tabName);

    // 更新标签按钮状态
    Elements.tabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    // 更新标签内容显示
    Elements.tabContents.forEach(content => {
        const shouldBeActive = content.id === tabName;
        content.classList.toggle('active', shouldBeActive);
        if (shouldBeActive) {
            console.log('显示标签页内容:', content.id, '当前样式:', window.getComputedStyle(content).display);
        }
    });

    // 特殊处理：确保炼丹炉标签页可见
    if (tabName === 'alchemy' && Elements.alchemyTabContent) {
        Elements.alchemyTabContent.style.display = 'block';
        console.log('强制显示炼丹炉标签页');
    }

    AppState.currentTab = tabName;

    // 如果切换到游戏标签页，更新游戏UI
    if (tabName === 'game') {
        updateGameUI();
    }
}

// 显示不同的游戏界面
function showGameInterface(interfaceType) {
    // 隐藏所有游戏界面
    Elements.gameInitContainer.style.display = 'none';
    Elements.characterCreationContainer.style.display = 'none';
    Elements.gameContainer.style.display = 'none';
    
    // 显示指定界面
    switch(interfaceType) {
        case 'init':
            Elements.gameInitContainer.style.display = 'block';
            break;
        case 'creation':
            Elements.characterCreationContainer.style.display = 'block';
            break;
        case 'game':
            Elements.gameContainer.style.display = 'block';
            break;
    }
}

// 显示世界选项
function showWorldOptions() {
    Elements.worldOptions.style.display = 'block';
}

// 生成世界和角色
async function generateWorld() {
    const worldTheme = Elements.worldTheme.value;
    const worldDifficulty = Elements.worldDifficulty.value;
    
    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }
    
    // 显示加载状态
    Elements.worldOptions.style.display = 'none';
    Elements.worldLoading.style.display = 'block';
    
    try {
        // 构建世界生成提示词
        const prompt = buildWorldGenerationPrompt(worldTheme, worldDifficulty);
        const response = await callOpenAI(prompt);
        
        // 解析世界和角色数据
        const gameData = parseGameData(response);
        
        // 保存世界和角色数据
        AppState.worldData = gameData.world;
        AppState.characterData = gameData.character;
        
        // 切换到角色创建界面
        AppState.gamePhase = 'creation';
        showGameInterface('creation');
        displayCharacterCreation();
        
    } catch (error) {
        console.error('世界生成失败:', error);
        showMessage(`世界生成失败: ${error.message}`, 'error');
        
        // 恢复界面
        Elements.worldOptions.style.display = 'block';
        Elements.worldLoading.style.display = 'none';
    }
}

// 构建世界生成提示词
function buildWorldGenerationPrompt(worldTheme, worldDifficulty) {
    let prompt = `请为文字冒险游戏生成一个独特的世界和初始角色。请以JSON格式返回数据，包含以下结构：

{
    "world": {
        "name": "世界名称",
        "description": "世界背景描述（100-200字）",
        "theme": "世界主题",
        "startingLocation": {
            "name": "起始地点名称",
            "description": "起始地点详细描述（150-250字）",
            "imagePrompt": "用于生成场景图的提示词"
        },
        "difficulty": "游戏难度"
    },
    "character": {
        "name": "角色名称",
        "class": ["职业选项1", "职业选项2", "职业选项3"],
        "background": "角色背景",
        "stats": {
            "health": "生命值 (50-120)",
            "mana": "法力值 (20-80)",
            "strength": "力量 (1-10)",
            "intelligence": "智力 (1-10)",
            "agility": "敏捷 (1-10)",
            "charisma": "魅力 (1-10)"
        },
        "skills": ["技能1", "技能2", "技能3"],
        "talents": ["天赋1", "天赋2"],
        "equipment": ["初始装备1", "初始装备2"],
        "inventory": ["物品1", "物品2", "物品3"]
    },
    "storyHook": "故事引子（100-150字）"
}

参数设置：
- 世界主题: ${worldTheme === 'random' ? '完全随机选择' : worldTheme}
- 游戏难度: ${worldDifficulty}

请确保生成的内容符合所选的主题和难度，数值平衡合理。世界主题选项：fantasy（奇幻魔法）、scifi（科幻未来）、apocalyptic（末日废土）、historical（历史武侠）、modern（现代都市）。如果是随机主题，请从这些选项中随机选择一个。

随机事件要求：
1. 可以在故事引子中加入一个适度的随机事件，如"你醒来时发现自己身上多了一个奇怪的印记"或"村庄里来了一位神秘的旅者"
2. 随机事件不应过于离谱或破坏游戏体验
3. 随机事件应该与游戏世界主题相符
4. 随机事件应当为后续剧情提供可能性，但不应该主导整个故事`;
    
    return prompt;
}

// 解析游戏数据
function parseGameData(response) {
    try {
        // 尝试提取JSON部分（有时候AI会在JSON前后添加一些文字）
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('解析游戏数据失败:', error);
        
        // 如果解析失败，返回一个基本的数据结构
        return {
            world: {
                name: "神秘大陆",
                description: "一个充满未知和冒险的奇幻世界",
                theme: "fantasy",
                startingLocation: {
                    name: "新手村",
                    description: "你在一个宁静的小村庄醒来，周围是茂密的森林和远方的群山。",
                    imagePrompt: "peaceful fantasy village surrounded by forest and mountains"
                },
                difficulty: "normal"
            },
            character: {
                name: "冒险者",
                class: ["战士", "法师", "游侠"],
                background: "你是一个普通的村民，对冒险充满向往",
                stats: {
                    health: 100,
                    mana: 50,
                    strength: 5,
                    intelligence: 5,
                    agility: 5,
                    charisma: 5
                },
                skills: ["基础攻击", "闪避"],
                talents: ["快速学习"],
                equipment: ["布衣", "木剑"],
                inventory: ["面包", "水袋", "火把"]
            },
            storyHook: "村庄长老告诉你，附近的森林中出现了一些奇怪的生物，威胁着村庄的安全。你决定调查这件事。"
        };
    }
}

// 显示角色创建界面
function displayCharacterCreation() {
    const character = AppState.characterData;
    const world = AppState.worldData;
    
    // 显示角色基本信息
    const characterInfoHTML = `
        <div class="info-section">
            <h3>世界信息</h3>
            <p><strong>世界名称:</strong> ${escapeHtml(world.name)}</p>
            <p><strong>世界描述:</strong> ${escapeHtml(world.description)}</p>
            <p><strong>起始地点:</strong> ${escapeHtml(world.startingLocation.name)}</p>
        </div>

        <div class="info-section">
            <h3>角色属性</h3>
            <p><strong>姓名:</strong> ${escapeHtml(character.name)}</p>
            <p><strong>背景:</strong> ${escapeHtml(character.background)}</p>
            <div class="stats-grid">
                <div class="stat-bar"><span>生命值:</span> <strong>${escapeHtml(character.stats.health)}</strong></div>
                <div class="stat-bar"><span>法力值:</span> <strong>${escapeHtml(character.stats.mana)}</strong></div>
                <div class="stat-bar"><span>力量:</span> <strong>${escapeHtml(character.stats.strength)}/10</strong></div>
                <div class="stat-bar"><span>智力:</span> <strong>${escapeHtml(character.stats.intelligence)}/10</strong></div>
                <div class="stat-bar"><span>敏捷:</span> <strong>${escapeHtml(character.stats.agility)}/10</strong></div>
                <div class="stat-bar"><span>魅力:</span> <strong>${escapeHtml(character.stats.charisma)}/10</strong></div>
            </div>
        </div>
    `;
    Elements.characterInfo.innerHTML = characterInfoHTML;
    
    // 显示角色选择选项
    const characterChoicesHTML = `
        <h3>选择你的职业</h3>
        <div class="class-choices">
            ${character.class.map(cls => `
                <div class="class-option" data-class="${escapeHtml(cls)}">
                    <h4>${escapeHtml(cls)}</h4>
                    <p>点击选择${escapeHtml(cls)}作为你的职业</p>
                </div>
            `).join('')}
        </div>

        <h3>角色天赋</h3>
        <div class="talent-list">
            ${character.talents.map(talent => `
                <div class="talent-item">
                    <i class="fas fa-star"></i>
                    <span>${escapeHtml(talent)}</span>
                </div>
            `).join('')}
        </div>

        <h3>初始装备</h3>
        <div class="equipment-list">
            ${character.equipment.map(item => `
                <div class="equipment-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>${escapeHtml(item)}</span>
                </div>
            `).join('')}
        </div>

        <h3>初始物品</h3>
        <div class="inventory-list">
            ${character.inventory.map(item => `
                <div class="inventory-item">
                    <i class="fas fa-box"></i>
                    <span>${escapeHtml(item)}</span>
                </div>
            `).join('')}
        </div>
    `;
    Elements.characterChoices.innerHTML = characterChoicesHTML;
    
    // 添加职业选择事件
    document.querySelectorAll('.class-option').forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有选中状态
            document.querySelectorAll('.class-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // 添加选中状态
            this.classList.add('selected');
            // 保存选择的职业
            AppState.selectedClass = this.dataset.class;
        });
    });
}

// 重新生成角色
async function rerollCharacter() {
    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }
    
    showLoading(true);
    
    try {
        const world = AppState.worldData;
        const prompt = `基于以下世界信息，为文字冒险游戏生成一个新的初始角色（JSON格式）：

世界信息：
- 世界名称: ${world.name}
- 世界描述: ${world.description}
- 世界主题: ${world.theme}
- 游戏难度: ${world.difficulty}

请生成一个与该世界匹配的角色，使用与之前相同的JSON结构：
{
    "name": "角色名称",
    "class": ["职业1", "职业2", "职业3"],
    "background": "角色背景",
    "stats": {
        "health": "生命值",
        "mana": "法力值",
        "strength": "力量(1-10)",
        "intelligence": "智力(1-10)",
        "agility": "敏捷(1-10)",
        "charisma": "魅力(1-10)"
    },
    "skills": ["技能1", "技能2", "技能3"],
    "talents": ["天赋1", "天赋2"],
    "equipment": ["初始装备1", "初始装备2"],
    "inventory": ["物品1", "物品2", "物品3"]
}

确保角色与世界的主题和难度匹配。`;
        
        const response = await callOpenAI(prompt);
        AppState.characterData = parseGameData(response).character;
        displayCharacterCreation();
        
    } catch (error) {
        console.error('重新生成角色失败:', error);
        showMessage(`重新生成角色失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 确认角色
function confirmCharacter() {
    if (!AppState.selectedClass) {
        showMessage('请先选择一个职业', 'error');
        return;
    }
    
    // 初始化游戏状态
    AppState.gameState = {
        ...AppState.gameState,
        playerName: AppState.characterData.name,
        class: AppState.selectedClass,
        background: AppState.characterData.background,
        health: AppState.characterData.stats.health,
        maxHealth: AppState.characterData.stats.health,
        mana: AppState.characterData.stats.mana,
        maxMana: AppState.characterData.stats.mana,
        strength: AppState.characterData.stats.strength,
        intelligence: AppState.characterData.stats.intelligence,
        agility: AppState.characterData.stats.agility,
        charisma: AppState.characterData.stats.charisma,
        skills: AppState.characterData.skills,
        talents: AppState.characterData.talents,
        equipment: AppState.characterData.equipment,
        inventory: AppState.characterData.inventory,
        location: AppState.worldData.startingLocation,
        sceneTitle: AppState.worldData.startingLocation.name,
        sceneDescription: AppState.worldData.startingLocation.description + '\n\n' + AppState.worldData.storyHook,
        storyHistory: [`${AppState.worldData.storyHook}`],
        aiResponse: null,
        level: 1,
        chapter: '序章',
        progress: 0,
        exp: 0,
        maxExp: 100,
        // 初始化地图数据
        mapData: {
            gridSize: 5,
            playerPosition: { x: 2, y: 2 }, // 从中心开始
            discoveredTiles: [{ x: 2, y: 2 }], // 初始已探索区域
            tiles: {
                // 初始区域信息
                "2_2": {
                    name: AppState.worldData.startingLocation.name,
                    description: AppState.worldData.startingLocation.description,
                    level: 1,
                    imagePrompt: AppState.worldData.startingLocation.imagePrompt || "starting area",
                    specialEvents: []
                }
            }
        },
        // 初始化任务系统
        questData: {
            activeQuests: [],
            completedQuests: [],
            availableQuests: [
                {
                    id: "quest_intro_001",
                    name: "初次冒险",
                    description: "探索周围的区域，熟悉这个世界的基本情况。",
                    giver: "村庄长老",
                    objectives: ["探索周围区域", "返回村庄报告"],
                    totalSteps: 2,
                    currentStep: 1,
                    rewards: {
                        exp: 50,
                        items: ["新手指南", "治疗药水"]
                    }
                }
            ],
            questHistory: []
        }
    };
    
    // 切换到游戏界面
    AppState.gamePhase = 'playing';
    showGameInterface('game');
    updateGameUI();
    saveGameState();
    
    showMessage('角色创建成功！开始你的冒险吧！', 'success');
}

// 更新游戏UI
function updateGameUI() {
    // 更新头部状态栏
    Elements.playerName.textContent = AppState.gameState.playerName;
    Elements.playerLevel.textContent = 'Lv.' + AppState.gameState.level;
    Elements.currentChapter.textContent = AppState.gameState.chapter;

    // 更新游戏时长
    var playTime = AppState.gameState.playTime || 0;
    var hours = Math.floor(playTime / 60);
    var minutes = playTime % 60;
    if (hours > 0) {
        Elements.playTime.textContent = hours + '小时' + minutes + '分钟';
    } else {
        Elements.playTime.textContent = minutes + '分钟';
    }

    // 更新游戏内状态栏
    const healthPercent = (AppState.gameState.health / AppState.gameState.maxHealth) * 100;
    const manaPercent = (AppState.gameState.mana / AppState.gameState.maxMana) * 100;
    const expPercent = (AppState.gameState.exp / AppState.gameState.maxExp) * 100;

    Elements.healthBar.style.width = healthPercent + '%';
    Elements.healthValue.textContent = AppState.gameState.health + '/' + AppState.gameState.maxHealth;
    Elements.manaBar.style.width = manaPercent + '%';
    Elements.manaValue.textContent = AppState.gameState.mana + '/' + AppState.gameState.maxMana;
    Elements.expBar.style.width = expPercent + '%';
    Elements.expValue.textContent = AppState.gameState.exp + '/' + AppState.gameState.maxExp;
    
    // 更新场景
    Elements.sceneTitle.textContent = AppState.gameState.sceneTitle;
    Elements.sceneDescription.textContent = AppState.gameState.sceneDescription;
    
    // 控制场景图片显示
    if (AppState.settings.showSceneImages === 'enabled' && AppState.gameState.sceneImagePrompt) {
        Elements.sceneImage.src = `https://picsum.photos/seed/${encodeURIComponent(AppState.gameState.sceneImagePrompt)}/800/400.jpg`;
        Elements.sceneImage.style.display = 'block';
        Elements.scenePlaceholder.style.display = 'none';
    } else {
        Elements.sceneImage.style.display = 'none';
        Elements.scenePlaceholder.style.display = 'block';
    }
    
    // 更新可用行动
    updateAvailableActions();
}

// 更新可用行动
function updateAvailableActions() {
    const actionType = Elements.actionType.value;
    const actions = getActionsByType(actionType);
    
    Elements.availableActions.innerHTML = actions.map(action =>
        `<div class="action-chip" data-action="${escapeHtml(action)}">${escapeHtml(action)}</div>`
    ).join('');
    
    // 添加点击事件
    document.querySelectorAll('.action-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            // 移除所有选中状态
            document.querySelectorAll('.action-chip').forEach(c => {
                c.classList.remove('selected');
            });
            // 添加选中状态
            this.classList.add('selected');
            // 填充到输入框
            Elements.playerAction.value = this.dataset.action;
        });
    });
}

// 根据类型获取可用行动
function getActionsByType(actionType) {
    const actions = {
        explore: ["观察周围环境", "搜索附近的物品", "检查地面", "查看天空", "聆听周围的声音"],
        interact: ["打开门", "拾取物品", "使用物品", "与物体互动", "操作机关"],
        combat: ["攻击", "防御", "使用技能", "逃跑", "战术移动"],
        talk: ["打招呼", "询问信息", "谈论任务", "交易", "说服"]
    };
    
    return actions[actionType] || actions.explore;
}

// 提交玩家行动
async function submitPlayerAction() {
    const playerAction = Elements.playerAction.value.trim();
    const actionType = Elements.actionType.value;
    
    if (!playerAction) {
        showMessage('请输入你的行动或对话', 'error');
        return;
    }
    
    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }
    
    showLoading(true);
    
    try {
        // 构建AI提示词
        const prompt = buildGamePrompt(playerAction, actionType);
        const response = await callOpenAI(prompt);
        
        // 解析AI回应
        const gameResponse = parseGameResponse(response);
        
        // 更新游戏状态
        updateGameStateFromResponse(gameResponse);
        
        // 显示AI回应
        displayAIResponse(gameResponse.narrative);
        
        // 自动保存
        if (AppState.settings.autoSave === 'enabled') {
            autoSaveGame();
        }
        
        // 清空输入框
        Elements.playerAction.value = '';
        
        Elements.aiResponseSection.style.display = 'block';
        Elements.aiResponseSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('AI回应失败:', error);
        showMessage(`AI回应失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 获取AI所需的上下文数据
function getGameContextForAI(actionType) {
    const gameState = AppState.gameState;
    const mapData = gameState.mapData;
    const questData = gameState.questData;
    
    let context = `- 世界：${AppState.worldData?.name || '未知世界'}
- 场景：${gameState.sceneTitle}
- 场景描述：${gameState.sceneDescription}
- 玩家：${gameState.playerName}（${gameState.class}）
- 玩家属性：生命值${gameState.health}/${gameState.maxHealth}，法力值${gameState.mana}/${gameState.maxMana}
- 玩家等级：${gameState.level}
- 玩家技能：${gameState.skills?.slice(0, 5).join(', ') || '无'}`;
    
    // 任务上下文 - 所有行动类型都需要
    if (questData.activeQuests.length > 0) {
        const activeQuest = questData.activeQuests[0];
        const currentObjective = activeQuest.objectives[activeQuest.currentStep - 1] || '未知';
        context += `
- 当前任务：${activeQuest.name}（进度：${activeQuest.currentStep}/${activeQuest.totalSteps}）
- 任务目标：${currentObjective}
- 任务描述：${activeQuest.description}`;
    }
    
    // 根据行动类型添加特定上下文
    if (actionType === 'combat') {
        // 战斗时需要玩家装备和战斗相关技能
        context += `
- 玩家装备：${gameState.equipment?.map(e => e.name || e).slice(0, 3).join(', ') || '无'}
- 玩家战斗技能：${gameState.skills?.filter(s => s.includes('攻击') || s.includes('防御') || s.includes('战斗')).slice(0, 3).join(', ') || '无'}`;
    } else if (actionType === 'talk') {
        // 对话时需要更多NPC和任务信息
        context += `
- 可接取的任务：${questData.availableQuests.slice(0, 2).map(q => q.name).join(', ') || '无'}`;
    } else if (actionType === 'explore') {
        // 探索时需要地图信息和已探索区域
        const currentPos = mapData.playerPosition;
        const nearbyTiles = getNearbyTiles(currentPos.x, currentPos.y);
        
        context += `
- 当前位置坐标：(${currentPos.x}, ${currentPos.y})
- 附近区域：${nearbyTiles.map(t => t.name).join(', ') || '未知'}
- 已探索区域数量：${mapData.discoveredTiles.length}/${mapData.gridSize * mapData.gridSize}`;
    } else if (actionType === 'interact') {
        // 互动时需要物品和特殊事件
        context += `
- 可用物品：${gameState.inventory?.map(i => i.name || i).slice(0, 5).join(', ') || '无'}
- 当前区域特殊事件：${getCurrentTileEvents().join(', ') || '无'}`;
    }
    
    // 添加简要故事历史
    context += `
- 最近行动：${gameState.storyHistory?.slice(-2).join(' | ') || '无'}`;
    
    return context;
}

// 获取附近的地图格子信息
function getNearbyTiles(x, y) {
    const mapData = AppState.gameState.mapData;
    const tiles = [];
    
    // 检查周围8个格子
    const directions = [
        { dx: -1, dy: -1, name: "西北" },
        { dx: 0, dy: -1, name: "北" },
        { dx: 1, dy: -1, name: "东北" },
        { dx: -1, dy: 0, name: "西" },
        { dx: 1, dy: 0, name: "东" },
        { dx: -1, dy: 1, name: "西南" },
        { dx: 0, dy: 1, name: "南" },
        { dx: 1, dy: 1, name: "东南" }
    ];
    
    directions.forEach(dir => {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        // 确保坐标在地图范围内
        if (nx >= 0 && nx < mapData.gridSize && ny >= 0 && ny < mapData.gridSize) {
            const tileKey = `${nx}_${ny}`;
            const tile = mapData.tiles[tileKey];
            
            // 如果是已探索的格子，添加信息
            if (mapData.discoveredTiles.some(t => t.x === nx && t.y === ny) && tile) {
                tiles.push({
                    name: tile.name,
                    direction: dir.name,
                    level: tile.level,
                    x: nx,
                    y: ny
                });
            }
        }
    });
    
    return tiles;
}

// 获取当前格子的特殊事件
function getCurrentTileEvents() {
    const currentPos = AppState.gameState.mapData.playerPosition;
    const tileKey = `${currentPos.x}_${currentPos.y}`;
    const tile = AppState.gameState.mapData.tiles[tileKey];
    
    if (!tile || !tile.specialEvents) {
        return [];
    }
    
    return tile.specialEvents;
}

// 优化数据存储
function optimizeDataStorage() {
    // 限制故事历史长度
    if (AppState.gameState.storyHistory.length > 100) {
        AppState.gameState.storyHistory = AppState.gameState.storyHistory.slice(-100);
    }
    
    // 限制任务历史长度
    if (AppState.gameState.questData.questHistory.length > 50) {
        AppState.gameState.questData.questHistory = AppState.gameState.questData.questHistory.slice(-50);
    }
    
    // 限制已完成任务显示数量
    if (AppState.gameState.questData.completedQuests.length > 20) {
        AppState.gameState.questData.completedQuests = AppState.gameState.questData.completedQuests.slice(-20);
    }
}

// 构建游戏提示词
function buildGamePrompt(playerAction, actionType) {
    const gameState = AppState.gameState;

    // 获取装备信息
    var equipInfo = [];
    if (gameState.equipment.weapon) equipInfo.push('武器:' + gameState.equipment.weapon.name);
    if (gameState.equipment.armor) equipInfo.push('防具:' + gameState.equipment.armor.name);
    if (gameState.equipment.accessory) equipInfo.push('饰品:' + gameState.equipment.accessory.name);

    // 根据需要获取上下文数据
    const contextData = getGameContextForAI(actionType);

    let prompt = `你是一个文字冒险游戏的AI叙述者，请根据玩家的行动生成游戏剧情回应。

当前游戏状态：
${contextData}
- 装备：${equipInfo.join(', ') || '无'}

玩家的行动：
"""
${playerAction}
"""

请以JSON格式返回游戏回应，确保数据结构一致：
{
    "success": true/false,
    "narrative": "叙述文本（200-400字，详细的场景描写、行动结果、角色感受）",
    "consequences": {
        "health": -10/-5/0/+5/+10/+20,
        "mana": -5/-2/0/+2/+5,
        "exp": 5/10/15/20/30/50,
        "loot": [
            {"name": "物品名称", "quantity": 1, "type": "consumable/equipment/material/quest", "subType": "weapon/armor/accessory", "description": "物品描述", "stats": {"attack": 0, "defense": 0}}
        ]
    },
    "sceneUpdate": {
        "title": "新场景标题（如果有变化）",
        "description": "新场景描述（如果有变化）",
        "imagePrompt": "用于生成场景图的提示词（如果有变化）"
    },
    "mapUpdate": {
        "newArea": {
            "direction": "north/south/east/west/northeast/northwest/southeast/southwest",
            "x": "相对当前位置的X坐标变化（-1,0,1）",
            "y": "相对当前位置的Y坐标变化（-1,0,1）",
            "name": "新区域名称",
            "description": "新区域描述（100-150字）",
            "level": "建议等级（1-20）",
            "imagePrompt": "用于生成区域图的提示词"
        }
    },
    "questUpdate": {
        "newQuest": {
            "id": "任务唯一标识符",
            "name": "任务名称",
            "description": "任务描述",
            "giver": "任务发布者",
            "objectives": ["目标1", "目标2", "目标3"],
            "totalSteps": 3,
            "rewards": {
                "exp": 100,
                "items": [{"name": "物品名称", "quantity": 1, "type": "consumable/equipment/material"}]
            }
        },
        "progressQuest": {
            "id": "任务唯一标识符",
            "stepIncrement": 1
        },
        "completeQuest": {
            "id": "任务唯一标识符"
        }
    },
    "choices": ["选择1", "选择2", "选择3"],
    "availableActions": ["新的可用行动1", "新的可用行动2"],
    "dialogue": {"npc": "NPC名称", "content": "对话内容", "options": ["回复选项1", "回复选项2"]}
}

物品系统规则：
- type类型：consumable(消耗品-使用后消失)、equipment(装备-可穿戴)、material(材料)、quest(任务物品-不可使用)
- 背包上限：每格可叠加同类型物品
- 物品获取：搜索、战斗掉落、任务奖励、交易、拾取
- 物品使用：消耗品可获得增益效果（生命恢复、法力恢复、增益状态等）
- 合理控制物品产出，避免背包溢出

游戏规则（根据行动类型）：
1. 探索行动：描述发现和观察，可以生成新区域信息
2. 战斗行动：包含战斗结果和属性变化，根据玩家等级和敌人等级计算结果
3. 对话行动：展示对话内容和信息获取，可以触发任务
4. 互动行动：描述物体交互的结果，可能发现隐藏物品或机关

随机性要求：
1. 偶尔（约20%概率）可以加入适度的随机突发事件
2. 随机事件应该与当前场景和世界主题相符
3. 随机事件应该增加游戏的趣味性，而不是破坏游戏体验
4. 随机事件不应频繁出现，保持适度的重要性

任务系统规则：
1. 探索或对话可以触发新任务
2. 完成任务目标可以更新任务进度(stepIncrement)
3. 任务完成后给予相应奖励
4. 任务应该与玩家等级相匹配
5. 任务完成判定规则：
   - 当玩家行动直接完成某个任务目标时，使用completeQuest完成任务
   - 当玩家行动推进任务进度时，使用progressQuest更新进度
   - 任务目标全部完成时(currentStep >= totalSteps)，必须返回completeQuest
   - 示例：任务要求击杀3只怪物，击杀第3只时同时返回progressQuest和completeQuest
6. 任务目标应该是具体、可衡量的行动（击杀、收集、到达、对话等）
7. 重要：当玩家完成了任务描述中的核心目标时，必须触发任务完成！

地图系统规则：
1. 探索新区域应记录到地图
2. 区域等级应与玩家等级相近或略高
3. 高等级玩家可以快速旅行到已探索区域
4. 区域信息包括名称、描述、建议等级和特殊事件

重要提示：
- 保持故事的连贯性和世界观一致
- 根据行动的合理性设置成功与否
- 数值变化要平衡合理，避免过大或过小的变化
- 所有JSON字段都是可选的，根据实际情况提供相应数据`;
    
    return prompt;
}

// 解析游戏回应
function parseGameResponse(response) {
    try {
        // 尝试提取JSON部分
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('解析游戏回应失败:', error);
        
        // 如果解析失败，返回一个基本的数据结构
        return {
            success: true,
            narrative: response,
            consequences: {
                health: 0,
                mana: 0,
                exp: 10,
                items: [],
                status: []
            },
            sceneUpdate: {
                title: "",
                description: ""
            },
            choices: [],
            availableActions: []
        };
    }
}

// 从游戏回应更新状态
function updateGameStateFromResponse(gameResponse) {
    const state = AppState.gameState;
    const consequences = gameResponse.consequences || {};
    const sceneUpdate = gameResponse.sceneUpdate || {};
    
    // 更新属性
    if (consequences.health !== undefined) {
        state.health = Math.max(0, Math.min(state.maxHealth, state.health + consequences.health));
    }
    if (consequences.mana !== undefined) {
        state.mana = Math.max(0, Math.min(state.maxMana, state.mana + consequences.mana));
    }
    if (consequences.exp !== undefined) {
        state.exp += consequences.exp;
        
        // 检查升级
        while (state.exp >= state.maxExp) {
            state.exp -= state.maxExp;
            state.level += 1;
            state.maxExp = state.level * 100; // 每级增加100经验上限
            state.maxHealth += 10; // 每级增加10生命上限
            state.maxMana += 5;  // 每级增加5法力上限
            state.health = state.maxHealth; // 升级恢复满血
            state.mana = state.maxMana;   // 升级恢复满蓝
            
            showMessage(`恭喜！你升到了 ${state.level} 级！`, 'success');
        }
        
        // 更新章节
        if (state.level >= 10 && state.chapter !== '终章') {
            state.chapter = '终章';
        } else if (state.level >= 7 && state.chapter !== '后篇') {
            state.chapter = '后篇';
        } else if (state.level >= 4 && state.chapter !== '中篇') {
            state.chapter = '中篇';
        } else if (state.level >= 2 && state.chapter !== '前篇') {
            state.chapter = '前篇';
        }
    }
    
    // 更新物品
    if (consequences.items && Array.isArray(consequences.items)) {
        consequences.items.forEach(item => {
            if (item.startsWith('+')) {
                const itemName = item.substring(1);
                state.inventory.push(itemName);
            } else if (item.startsWith('-')) {
                const itemName = item.substring(1);
                const index = state.inventory.indexOf(itemName);
                if (index > -1) {
                    state.inventory.splice(index, 1);
                }
            }
        });
    }
    
    // 更新场景
    if (sceneUpdate.title) {
        state.sceneTitle = sceneUpdate.title;
    }
    if (sceneUpdate.description) {
        state.sceneDescription = sceneUpdate.description;
    }
    if (sceneUpdate.imagePrompt) {
        state.sceneImagePrompt = sceneUpdate.imagePrompt;
    }
    
    // 更新地图
    const mapUpdate = gameResponse.mapUpdate || {};
    if (mapUpdate.newArea) {
        const newArea = mapUpdate.newArea;
        const currentPos = state.mapData.playerPosition;
        const newX = currentPos.x + (newArea.x || 0);
        const newY = currentPos.y + (newArea.y || 0);
        
        // 确保新坐标在地图范围内
        if (newX >= 0 && newX < state.mapData.gridSize && 
            newY >= 0 && newY < state.mapData.gridSize) {
            
            // 添加到已探索区域
            discoverNewTile(
                newX, 
                newY, 
                newArea.name || `新区域`, 
                newArea.description || `未知的区域`,
                newArea.level || state.level,
                newArea.imagePrompt
            );
            
            // 如果玩家移动到新区域
            if (newArea.moveToArea) {
                state.mapData.playerPosition = { x: newX, y: newY };
                state.location = {
                    name: newArea.name || `新区域`,
                    description: newArea.description || `未知的区域`
                };
            }
        }
    }
    
    // 更新任务
    const questUpdate = gameResponse.questUpdate || {};
    
    // 新任务
    if (questUpdate.newQuest) {
        const newQuest = questUpdate.newQuest;
        // 确保任务有唯一ID
        if (!newQuest.id) {
            newQuest.id = `quest_${Date.now()}`;
        }
        
        // 确保有当前步骤
        if (!newQuest.currentStep) {
            newQuest.currentStep = 1;
        }
        
        state.questData.availableQuests.push(newQuest);
        showMessage(`发现新任务: ${newQuest.name}`, 'info');
    }
    
    // 任务进度
    if (questUpdate.progressQuest) {
        const { id, stepIncrement = 1 } = questUpdate.progressQuest;
        updateQuestProgress(id, stepIncrement);
    }
    
    // 完成任务
    if (questUpdate.completeQuest) {
        const { id } = questUpdate.completeQuest;
        completeQuest(id);
    }
    
    // 更新进度
    state.progress = Math.min(100, (state.level - 1) * 10);
    
    // 更新故事历史
    const playerAction = Elements.playerAction.value.trim();
    state.storyHistory.push(`玩家(${state.playerName}): ${playerAction}`);
    state.storyHistory.push(`叙述: ${gameResponse.narrative}`);
    
    // 保存AI回应供重新生成使用
    state.aiResponse = gameResponse.narrative;
}

// 显示AI回应
function displayAIResponse(response) {
    Elements.aiResponse.textContent = response;
}



// 重新生成AI回应
async function regenerateAIResponse() {
    const playerAction = Elements.playerAction.value.trim();
    const actionType = Elements.actionType.value;
    
    if (!playerAction) return;
    
    showLoading(true);
    
    try {
        const prompt = buildGamePrompt(playerAction, actionType);
        const response = await callOpenAI(prompt);
        
        // 解析AI回应
        const gameResponse = parseGameResponse(response);
        
        // 显示重新生成的内容（不更新游戏状态）
        displayAIResponse(gameResponse.narrative);
        
    } catch (error) {
        console.error('重新生成失败:', error);
        showMessage(`重新生成失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 显示背包
function showInventory() {
    const inventory = AppState.gameState.inventory || [];
    const equipment = AppState.gameState.equipment || {};

    // 确保所有物品都有id（转换旧格式）
    inventory.forEach(function(item, index) {
        if (typeof item === 'string') {
            // 转换字符串为新格式对象
            inventory[index] = {
                id: 'item_' + Date.now() + '_' + index,
                name: item,
                type: 'material',
                quantity: 1,
                description: ''
            };
        } else if (item && !item.id) {
            item.id = 'item_' + Date.now() + '_' + index;
        }
    });

    // 装备栏
    let inventoryHTML = '<div class="equipment-section">';
    inventoryHTML += '<h3><i class="fas fa-shield-alt"></i> 装备栏</h3>';
    inventoryHTML += '<div class="equipment-slots">';

    var slots = [
        { key: 'weapon', name: '武器', icon: 'fa-sword' },
        { key: 'armor', name: '防具', icon: 'fa-shield-alt' },
        { key: 'accessory', name: '饰品', icon: 'fa-ring' }
    ];

    slots.forEach(function(slot) {
        var equip = equipment[slot.key];
        inventoryHTML += '<div class="equipment-slot" data-slot="' + slot.key + '">';
        inventoryHTML += '<div class="slot-header"><i class="fas ' + slot.icon + '"></i> ' + slot.name + '</div>';
        if (equip) {
            inventoryHTML += '<div class="slot-content">';
            inventoryHTML += '<span class="equip-name">' + equip.name + '</span>';
            if (equip.stats) {
                var statsText = [];
                if (equip.stats.attack) statsText.push('攻击+' + equip.stats.attack);
                if (equip.stats.defense) statsText.push('防御+' + equip.stats.defense);
                if (equip.stats.mana) statsText.push('法力+' + equip.stats.mana);
                if (equip.stats.health) statsText.push('生命+' + equip.stats.health);
                if (statsText.length) inventoryHTML += '<span class="equip-stats">' + statsText.join(', ') + '</span>';
            }
            inventoryHTML += '<button class="unequip-btn" onclick="unequipItem(\'' + slot.key + '\')">卸下</button>';
            inventoryHTML += '</div>';
        } else {
            inventoryHTML += '<div class="slot-empty">空</div>';
        }
        inventoryHTML += '</div>';
    });

    inventoryHTML += '</div></div>';

    // 背包物品列表
    inventoryHTML += '<div class="inventory-section">';
    inventoryHTML += '<h3><i class="fas fa-backpack"></i> 背包 (' + inventory.length + '种物品)</h3>';

    if (inventory.length === 0) {
        inventoryHTML += '<p class="empty-hint">背包是空的，去探索世界获取物品吧！</p>';
    } else {
        inventoryHTML += '<div class="inventory-list">';
        inventory.forEach(function(item) {
            // 兼容字符串格式（旧格式）
            var itemName, itemId, itemQty, itemType;
            if (typeof item === 'string') {
                itemName = item;
                itemId = item; // 用名称作为临时id
                itemQty = 1;
                itemType = 'material';
            } else {
                itemName = item.name || '未知物品';
                itemId = item.id || item.name;
                itemQty = item.quantity || 1;
                itemType = item.type || 'material';
            }

            var typeIcon = '<i class="fas fa-cube"></i>';
            var typeClass = 'material';
            if (itemType === 'consumable') { typeIcon = '<i class="fas fa-flask"></i>'; typeClass = 'consumable'; }
            else if (itemType === 'equipment') { typeIcon = '<i class="fas fa-shield-alt"></i>'; typeClass = 'equipment'; }
            else if (itemType === 'quest') { typeIcon = '<i class="fas fa-scroll"></i>'; typeClass = 'quest'; }

            inventoryHTML += '<div class="inventory-item-row ' + typeClass + '" onclick="showItemDetail(\'' + itemId + '\')">';
            inventoryHTML += '<div class="item-icon">' + typeIcon + '</div>';
            inventoryHTML += '<div class="item-info">';
            inventoryHTML += '<span class="item-name">' + itemName + '</span>';
            inventoryHTML += '</div>';
            inventoryHTML += '<div class="item-qty">' + (itemQty > 1 ? 'x' + itemQty : '') + '</div>';
            inventoryHTML += '</div>';
        });
        inventoryHTML += '</div>';
    }

    inventoryHTML += '</div>';

    showModal('背包', inventoryHTML);
}

// 显示物品详情
function showItemDetail(itemId) {
    var inventory = AppState.gameState.inventory;
    var item = null;

    // 遍历查找物品（兼容各种格式）
    for (var i = 0; i < inventory.length; i++) {
        var invItem = inventory[i];
        // 如果是对象格式
        if (typeof invItem === 'object' && invItem !== null) {
            if (invItem.id === itemId || invItem.name === itemId) {
                item = invItem;
                // 确保有id
                if (!item.id) {
                    item.id = generateItemId();
                }
                break;
            }
        }
        // 如果是字符串格式（旧格式）
        else if (typeof invItem === 'string') {
            if (invItem === itemId) {
                // 转换为新格式
                item = {
                    id: generateItemId(),
                    name: invItem,
                    type: 'material',
                    quantity: 1,
                    description: ''
                };
                // 更新库存
                inventory[i] = item;
                break;
            }
        }
    }

    if (!item) {
        showMessage('找不到该物品: ' + itemId, 'error');
        console.log('inventory:', inventory);
        return;
    }

    var itemName = item.name || '未知物品';
    var itemType = item.type || 'material';
    var itemQty = item.quantity || 1;
    var itemDesc = item.description || '这是一个神秘的物品';
    var itemStats = item.stats || {};

    var typeNames = {
        'consumable': '消耗品',
        'equipment': '装备',
        'material': '材料',
        'quest': '任务物品'
    };

    var html = '<div class="item-detail-modal">';
    html += '<div class="item-detail-header">';
    html += '<span class="item-detail-name">' + itemName + '</span>';
    html += '<span class="item-detail-type">' + (typeNames[itemType] || '物品') + '</span>';
    html += '</div>';

    html += '<div class="item-detail-info">';
    html += '<p class="item-detail-desc">' + itemDesc + '</p>';

    if (itemQty > 1) {
        html += '<p class="item-detail-qty">数量: x' + itemQty + '</p>';
    }

    // 显示属性
    if (Object.keys(itemStats).length > 0) {
        html += '<div class="item-detail-stats">';
        if (itemStats.attack) html += '<span>攻击力 +' + itemStats.attack + '</span>';
        if (itemStats.defense) html += '<span>防御力 +' + itemStats.defense + '</span>';
        if (itemStats.health) html += '<span>生命值 +' + itemStats.health + '</span>';
        if (itemStats.mana) html += '<span>法力值 +' + itemStats.mana + '</span>';
        html += '</div>';
    }

    html += '</div>';

    // 操作按钮
    html += '<div class="item-detail-actions">';
    if (itemType === 'consumable') {
        html += '<button class="action-btn primary" onclick="useItem(\'' + item.id + '\')"><i class="fas fa-check"></i> 使用</button>';
    } else if (itemType === 'equipment') {
        html += '<button class="action-btn primary" onclick="equipItem(\'' + item.id + '\')"><i class="fas fa-tshirt"></i> 装备</button>';
    }
    if (itemType !== 'quest') {
        html += '<button class="action-btn danger" onclick="discardItem(\'' + item.id + '\')"><i class="fas fa-trash"></i> 丢弃</button>';
    }
    html += '<button class="action-btn secondary" onclick="closeModal()"><i class="fas fa-times"></i> 关闭</button>';
    html += '</div>';

    html += '</div>';

    showModal('物品详情', html);
}

// 显示技能
function showSkills() {
    const skills = AppState.gameState.skills || [];
    const talents = AppState.gameState.talents || [];
    
    let skillsHTML = '<h3>技能</h3>';
    if (skills.length === 0) {
        skillsHTML += '<p>你没有学会任何技能</p>';
    } else {
        skillsHTML += '<div class="skills-grid">';
        skills.forEach((skill) => {
            skillsHTML += `<div class="skill-item clickable" data-skill="${skill}" data-type="skill" title="点击将技能输入到输入框">${skill}</div>`;
        });
        skillsHTML += '</div>';
    }

    skillsHTML += '<h3>天赋</h3>';
    if (talents.length === 0) {
        skillsHTML += '<p>你没有任何特殊天赋</p>';
    } else {
        skillsHTML += '<div class="talents-grid">';
        talents.forEach((talent) => {
            skillsHTML += `<div class="talent-item clickable" data-skill="${talent}" data-type="talent" title="点击将天赋输入到输入框">${talent}</div>`;
        });
        skillsHTML += '</div>';
    }
    
    showModal('技能与天赋', skillsHTML);
    
    // 添加技能点击事件
    setTimeout(() => {
        document.querySelectorAll('.skill-item.clickable, .talent-item.clickable').forEach(skillElement => {
            skillElement.addEventListener('click', function() {
                const skillName = this.dataset.skill;

                // 将技能名称填入输入框
                const currentAction = Elements.playerAction.value.trim();
                if (currentAction) {
                    Elements.playerAction.value = currentAction + ' ' + skillName;
                } else {
                    Elements.playerAction.value = `使用${skillName}`;
                }
                
                // 关闭模态框
                Elements.modal.style.display = 'none';
                
                // 聚焦到输入框
                Elements.playerAction.focus();
            });
        });
    }, 100);
}

// 显示任务
function showQuests() {
    const questData = AppState.gameState.questData;
    
    let questsHTML = '<div class="quest-container">';
    
    // 进行中的任务
    if (questData.activeQuests.length > 0) {
        questsHTML += '<div class="quest-section"><h3>进行中的任务</h3>';
        questData.activeQuests.forEach(quest => {
            const progress = Math.floor((quest.currentStep / quest.totalSteps) * 100);
            questsHTML += `
                <div class="quest-item active" data-quest-id="${quest.id}">
                    <h4>${quest.name}</h4>
                    <p class="quest-description">${quest.description}</p>
                    <div class="quest-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${quest.currentStep}/${quest.totalSteps}</span>
                    </div>
                    <p class="quest-objective">当前目标: ${quest.objectives[quest.currentStep - 1] || '未知目标'}</p>
                    <div class="quest-rewards">
                        <p><i class="fas fa-star"></i> 经验: ${quest.rewards.exp}</p>
                        ${quest.rewards.items ? `<p><i class="fas fa-gift"></i> 物品: ${quest.rewards.items.join(', ')}</p>` : ''}
                    </div>
                </div>
            `;
        });
        questsHTML += '</div>';
    }
    
    // 可接取的任务
    if (questData.availableQuests.length > 0) {
        questsHTML += '<div class="quest-section"><h3>可接取的任务</h3>';
        questData.availableQuests.forEach(quest => {
            questsHTML += `
                <div class="quest-item available" data-quest-id="${quest.id}">
                    <h4>${quest.name}</h4>
                    <p class="quest-description">${quest.description}</p>
                    <p class="quest-giver">发布者: ${quest.giver}</p>
                    <div class="quest-rewards">
                        <p><i class="fas fa-star"></i> 经验: ${quest.rewards.exp}</p>
                        ${quest.rewards.items ? `<p><i class="fas fa-gift"></i> 物品: ${quest.rewards.items.join(', ')}</p>` : ''}
                    </div>
                    <button class="accept-quest-btn" onclick="acceptQuest('${quest.id}')">接受任务</button>
                </div>
            `;
        });
        questsHTML += '</div>';
    }
    
    // 已完成的任务
    if (questData.completedQuests.length > 0) {
        questsHTML += '<div class="quest-section"><h3>已完成的任务</h3>';
        questData.completedQuests.slice(-5).forEach(quest => {
            questsHTML += `
                <div class="quest-item completed" data-quest-id="${quest.id}">
                    <h4>${quest.name}</h4>
                    <p class="quest-completed">已完成</p>
                    <div class="quest-rewards">
                        <p><i class="fas fa-check"></i> 获得: ${quest.rewardsReceived || '经验值和物品'}</p>
                    </div>
                </div>
            `;
        });
        questsHTML += '</div>';
    }
    
    if (questData.activeQuests.length === 0 && 
        questData.availableQuests.length === 0 && 
        questData.completedQuests.length === 0) {
        questsHTML += '<p>你还没有任何任务，去探索这个世界，寻找机会吧！</p>';
    }
    
    questsHTML += '</div>';
    
    showModal('任务', questsHTML);
}

// 接受任务
function acceptQuest(questId) {
    const questData = AppState.gameState.questData;
    const questIndex = questData.availableQuests.findIndex(q => q.id === questId);
    
    if (questIndex === -1) {
        showMessage('找不到该任务', 'error');
        return;
    }
    
    const quest = questData.availableQuests[questIndex];
    
    // 从可接取任务中移除
    questData.availableQuests.splice(questIndex, 1);
    
    // 添加到进行中的任务
    quest.status = 'active';
    quest.acceptedAt = new Date().toISOString();
    questData.activeQuests.push(quest);
    
    // 添加到任务历史
    questData.questHistory.push({
        action: 'accepted',
        questId,
        timestamp: new Date().toISOString()
    });
    
    // 保存游戏状态
    saveGameState();
    
    // 关闭并重新打开任务界面
    Elements.modal.style.display = 'none';
    
    showMessage(`你接受了任务: ${quest.name}`, 'success');
    
    // 延迟重新打开任务界面
    setTimeout(() => showQuests(), 300);
}

// 完成任务
function completeQuest(questId) {
    const questData = AppState.gameState.questData;
    const questIndex = questData.activeQuests.findIndex(q => q.id === questId);
    
    if (questIndex === -1) {
        showMessage('找不到该任务', 'error');
        return;
    }
    
    const quest = questData.activeQuests[questIndex];
    
    // 从进行中的任务中移除
    questData.activeQuests.splice(questIndex, 1);
    
    // 应用任务奖励
    if (quest.rewards.exp) {
        AppState.gameState.exp += quest.rewards.exp;
        
        // 检查升级
        while (AppState.gameState.exp >= AppState.gameState.maxExp) {
            AppState.gameState.exp -= AppState.gameState.maxExp;
            AppState.gameState.level += 1;
            AppState.gameState.maxExp = AppState.gameState.level * 100;
            AppState.gameState.maxHealth += 10;
            AppState.gameState.maxMana += 5;
            AppState.gameState.health = AppState.gameState.maxHealth;
            AppState.gameState.mana = AppState.gameState.maxMana;
            
            showMessage(`恭喜！你升到了 ${AppState.gameState.level} 级！`, 'success');
        }
    }
    
    if (quest.rewards.items && Array.isArray(quest.rewards.items)) {
        quest.rewards.items.forEach(item => {
            // 支持新格式物品
            const itemData = {
                id: generateItemId(),
                name: item.name || item,
                quantity: item.quantity || 1,
                type: item.type || 'material',
                description: item.description || ''
            };
            
            // 检查是否可叠加
            const existingItem = AppState.gameState.inventory.find(i => i.name === itemData.name);
            if (existingItem && existingItem.type !== 'equipment') {
                existingItem.quantity += itemData.quantity;
            } else if (AppState.gameState.inventory.length < AppState.gameState.maxInventory) {
                AppState.gameState.inventory.push(itemData);
            }
        });
    }
    
    // 添加到已完成任务
    quest.status = 'completed';
    quest.completedAt = new Date().toISOString();
    questData.completedQuests.push(quest);
    
    // 添加到任务历史
    questData.questHistory.push({
        action: 'completed',
        questId,
        timestamp: new Date().toISOString()
    });
    
    // 保存游戏状态
    saveGameState();
    
    // 更新UI
    updateGameUI();
    
    showMessage(`任务完成: ${quest.name}`, 'success');
}

// 更新任务进度
function updateQuestProgress(questId, stepIncrement = 1) {
    const quest = AppState.gameState.questData.activeQuests.find(q => q.id === questId);
    
    if (!quest) {
        return;
    }
    
    quest.currentStep = Math.min(quest.currentStep + stepIncrement, quest.totalSteps);
    
    // 如果任务完成
    if (quest.currentStep >= quest.totalSteps) {
        completeQuest(questId);
    }
    
    // 保存游戏状态
    saveGameState();
}

// 显示地图
function showMap() {
    const mapData = AppState.gameState.mapData;
    const playerPos = mapData.playerPosition;
    const gridSize = mapData.gridSize;
    const discoveredTiles = mapData.discoveredTiles;
    const tiles = mapData.tiles;
    
    // 创建地图格子
    let mapHTML = `
        <div class="map-container">
            <div class="map-info">
                <p>当前位置: ${getCurrentLocationName()}</p>
                <p>等级范围: ${getCurrentLevelRange()}</p>
            </div>
            <div class="map-grid" style="grid-template-columns: repeat(${gridSize}, 1fr);">
    `;
    
    // 生成地图格子
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const isPlayerHere = x === playerPos.x && y === playerPos.y;
            const isDiscovered = discoveredTiles.some(tile => tile.x === x && tile.y === y);
            const tileKey = `${x}_${y}`;
            const tile = tiles[tileKey];
            
            let tileClass = 'map-tile';
            let tileContent = '';
            let tileTitle = '未探索区域';
            
            if (isPlayerHere) {
                tileClass += ' player-tile';
                tileContent = '<i class="fas fa-user"></i>';
                tileTitle = '你的位置';
            } else if (isDiscovered && tile) {
                tileClass += ' discovered-tile';
                tileContent = `<span>${tile.name.substring(0, 3)}</span>`;
                tileTitle = `${tile.name} (等级: ${tile.level})`;
                
                // 检查是否可以快速旅行（玩家等级远高于区域等级）
                if (AppState.gameState.level >= tile.level + 5) {
                    tileClass += ' travelable';
                    tileTitle += ' - 可快速旅行';
                }
            } else if (isDiscovered) {
                tileClass += ' discovered-tile empty-tile';
                tileContent = '<i class="fas fa-question"></i>';
                tileTitle = '已探索区域';
            } else {
                tileClass += ' undiscovered-tile';
                tileContent = '<i class="fas fa-question"></i>';
                tileTitle = '未探索区域';
            }
            
            // 为可快速旅行的区域添加点击事件
            if (isDiscovered && tile && AppState.gameState.level >= tile.level + 5 && !isPlayerHere) {
                tileClass += ' clickable';
                mapHTML += `<div class="${tileClass}" title="${tileTitle}" data-x="${x}" data-y="${y}" onclick="quickTravel(${x}, ${y})">${tileContent}</div>`;
            } else {
                mapHTML += `<div class="${tileClass}" title="${tileTitle}">${tileContent}</div>`;
            }
        }
    }
    
    mapHTML += `
            </div>
            <div class="map-legend">
                <div class="legend-item">
                    <div class="legend-icon player-tile"><i class="fas fa-user"></i></div>
                    <span>你的位置</span>
                </div>
                <div class="legend-item">
                    <div class="legend-icon discovered-tile"><span>区域</span></div>
                    <span>已探索</span>
                </div>
                <div class="legend-item">
                    <div class="legend-icon travelable"><span>区域</span></div>
                    <span>可快速旅行</span>
                </div>
                <div class="legend-item">
                    <div class="legend-icon undiscovered-tile"><i class="fas fa-question"></i></div>
                    <span>未探索</span>
                </div>
            </div>
            <div class="map-actions">
                <button class="secondary-btn" onclick="closeModal()">关闭</button>
            </div>
        </div>
    `;
    
    showModal('地图', mapHTML);
}

// 快速旅行到指定位置
function quickTravel(x, y) {
    const tileKey = `${x}_${y}`;
    const tile = AppState.gameState.mapData.tiles[tileKey];
    
    if (!tile) {
        showMessage('该区域尚未记录信息', 'error');
        return;
    }
    
    // 检查是否满足快速旅行条件
    if (AppState.gameState.level < tile.level + 5) {
        showMessage('你的等级不足以快速旅行到此区域', 'warning');
        return;
    }
    
    // 更新玩家位置
    AppState.gameState.mapData.playerPosition = { x, y };
    
    // 更新场景信息
    AppState.gameState.sceneTitle = tile.name;
    AppState.gameState.sceneDescription = tile.description;
    AppState.gameState.location = {
        name: tile.name,
        description: tile.description
    };
    
    // 关闭地图
    Elements.modal.style.display = 'none';
    
    // 更新游戏UI
    updateGameUI();
    
    // 添加到故事历史
    AppState.gameState.storyHistory.push(`你快速旅行到了${tile.name}`);
    
    // 保存游戏状态
    saveGameState();
    
    showMessage(`你已快速旅行到${tile.name}`, 'success');
}

// 获取当前位置名称
function getCurrentLocationName() {
    const playerPos = AppState.gameState.mapData.playerPosition;
    const tileKey = `${playerPos.x}_${playerPos.y}`;
    const tile = AppState.gameState.mapData.tiles[tileKey];
    
    return tile ? tile.name : '未知区域';
}

// 获取当前区域的等级范围
function getCurrentLevelRange() {
    const playerPos = AppState.gameState.mapData.playerPosition;
    const tileKey = `${playerPos.x}_${playerPos.y}`;
    const tile = AppState.gameState.mapData.tiles[tileKey];
    
    if (tile) {
        return `${tile.level} - ${tile.level + 2}`;
    }
    
    return '未知';
}

// 发现新区域
function discoverNewTile(x, y, name, description, level, imagePrompt) {
    const tileKey = `${x}_${y}`;
    
    // 添加到已探索区域
    if (!AppState.gameState.mapData.discoveredTiles.some(tile => tile.x === x && tile.y === y)) {
        AppState.gameState.mapData.discoveredTiles.push({ x, y });
    }
    
    // 保存区域信息
    AppState.gameState.mapData.tiles[tileKey] = {
        name,
        description,
        level,
        imagePrompt: imagePrompt || `${name} fantasy landscape`,
        specialEvents: []
    };
    
    // 保存游戏状态
    saveGameState();
}

// 显示模态框
function showModal(title, content) {
    const modalHTML = `
        <h2>${escapeHtml(title)}</h2>
        <div class="modal-content-wrapper">
            ${content}
        </div>
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">关闭</button>
        </div>
    `;
    Elements.modalBody.innerHTML = modalHTML;
    
    Elements.modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    Elements.modal.style.display = 'none';
}

// 更新游戏进度
function updateGameProgress() {
    // 基于故事长度和轮次更新进度
    const progressIncrement = Math.min(5, Math.floor(AppState.gameState.storyHistory.length / 4) * 2);
    AppState.gameState.progress = Math.min(100, AppState.gameState.progress + progressIncrement);
    
    // 更新等级
    const newLevel = Math.floor(AppState.gameState.progress / 20) + 1;
    if (newLevel > AppState.gameState.level) {
        AppState.gameState.level = newLevel;
        showMessage(`恭喜！你升到了 ${newLevel} 级！`, 'success');
    }
    
    // 更新章节
    if (AppState.gameState.progress >= 80 && AppState.gameState.chapter !== '终章') {
        AppState.gameState.chapter = '终章';
        showMessage('你已经接近故事的尾声了！', 'info');
    } else if (AppState.gameState.progress >= 60 && AppState.gameState.chapter !== '后篇') {
        AppState.gameState.chapter = '后篇';
    } else if (AppState.gameState.progress >= 40 && AppState.gameState.chapter !== '中篇') {
        AppState.gameState.chapter = '中篇';
    } else if (AppState.gameState.progress >= 20 && AppState.gameState.chapter !== '前篇') {
        AppState.gameState.chapter = '前篇';
    }
    
    updateGameUI();
    saveGameState();
}

// 分析AI回答（保留原有函数，但不再使用）
async function analyzeAnswer() {
    const answerText = Elements.aiAnswer.value.trim();
    const contextText = Elements.sourceContext.value.trim();
    const analysisType = Elements.analysisType.value;
    const strictness = Elements.strictness.value;
    
    if (!answerText) {
        showMessage('请输入待分析的AI回答', 'error');
        return;
    }
    
    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }
    
    showLoading(true);
    
    try {
        const analysisPrompt = buildAnalysisPrompt(answerText, contextText, analysisType, strictness);
        const analysis = await callOpenAI(analysisPrompt);
        
        AppState.currentAnalysisData = {
            answer: answerText,
            context: contextText,
            analysisType,
            strictness,
            timestamp: new Date().toISOString(),
            ...parseAnalysisResponse(analysis)
        };
        
        displayResults();
        Elements.resultsSection.style.display = 'block';
        Elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('分析失败:', error);
        showMessage(`分析失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 构建分析提示词
function buildAnalysisPrompt(answer, context, analysisType, strictness) {
    let prompt = `请仔细分析以下AI回答，检测其中可能存在的可疑陈述、不准确信息或潜在问题。
    
回答内容:
"""
${answer}
"""
`;
    
    if (context) {
        prompt += `
上下文信息:
"""
${context}
"""
`;
    }
    
    const strictnessLevels = {
        low: '采用宽松标准，仅标记明显的错误和问题',
        medium: '采用中等标准，标记可能的错误、不明确表述和潜在问题',
        high: '采用严格标准，详细分析所有可能的细微问题和不准确之处'
    };
    
    const analysisTypes = {
        general: '进行常规分析，检测各类问题',
        factual: '专注于事实核查，验证陈述的准确性',
        bias: '专注于偏见检测，识别潜在的偏见、倾向性表述',
        comprehensive: '进行全面分析，包含事实核查、偏见检测等多维度评估'
    };
    
    prompt += `
分析要求:
- 分析类型: ${analysisTypes[analysisType]}
- 严格程度: ${strictnessLevels[strictness]}

请以JSON格式返回分析结果，包含以下字段:
1. suspicionScore (0-100): 可疑度评分，0表示完全可信，100表示高度可疑
2. summary (string): 总体评估摘要
3. issues (array): 检测到的问题列表，每个问题包含:
   - type (string): 问题类型，如"factual-error", "bias", "uncertainty", "outdated"等
   - severity (string): 严重程度，"low", "medium", "high"
   - description (string): 问题描述
   - suggestion (string): 改进建议
4. strengths (array): 回答的优点和可取之处
5. overallRating (string): 总体评级，"excellent", "good", "fair", "poor"

请确保返回的是有效的JSON格式，不要包含任何额外的文字说明。`;
    
    return prompt;
}

// 调用OpenAI API (Ollama)
async function callOpenAI(prompt) {
    const endpoint = AppState.settings.apiEndpoint.replace(/\/$/, '');
    const apiModel = typeof AppState.settings.apiModel === 'string' ? AppState.settings.apiModel : 'minimax-m2.5:cloud';
    const isCloud = apiModel.includes('-cloud');
    
    let url, body;
    
    if (isCloud) {
        // 云端模型使用 OpenAI 兼容格式
        url = `${endpoint}/v1/chat/completions`;
        body = {
            model: apiModel.replace('-cloud', ''),
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7
        };
    } else {
        // 本地模型使用 Ollama 格式
        url = `${endpoint}/api/generate`;
        body = {
            model: apiModel,
            prompt: prompt,
            stream: false,
            temperature: 0.7,
            num_predict: 2000
        };
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败 (${response.status})`);
    }
    
    const data = await response.json();
    
    if (isCloud) {
        return data.choices[0].message.content;
    } else {
        return data.response;
    }
}

// 解析AI分析响应
function parseAnalysisResponse(analysis) {
    try {
        // 尝试提取JSON部分（有时候AI会在JSON前后添加一些文字）
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : analysis;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('解析分析结果失败:', error);
        
        // 如果解析失败，尝试构造一个基本的结果对象
        return {
            suspicionScore: 50,
            summary: '分析结果解析失败，但已记录原始分析内容。',
            issues: [{
                type: 'parsing-error',
                severity: 'medium',
                description: '无法正确解析分析结果',
                suggestion: '请检查API返回的格式'
            }],
            strengths: [],
            overallRating: 'fair',
            rawAnalysis: analysis
        };
    }
}

// 显示分析结果
function displayResults() {
    const data = AppState.currentAnalysisData;
    
    // 更新可疑度评分
    Elements.suspicionBar.style.width = `${data.suspicionScore}%`;
    Elements.suspicionScore.textContent = `${data.suspicionScore}%`;
    
    // 更新问题数量
    Elements.issuesCount.textContent = data.issues ? data.issues.length : 0;
    
    // 更新分析时间
    const analysisTime = new Date(data.timestamp).toLocaleString();
    Elements.analysisTime.textContent = analysisTime;
    
    // 显示详细分析
    Elements.analysisDetails.textContent = data.summary || '分析摘要不可用';
    
    // 显示检测到的问题
    if (data.issues && data.issues.length > 0) {
        Elements.detectedIssues.innerHTML = data.issues.map(issue => `
            <div class="issue-item">
                <div class="issue-title">
                    <span class="tag-badge">${escapeHtml(getIssueTypeLabel(issue.type))}</span>
                    <span class="tag-badge ${issue.severity}">${escapeHtml(getSeverityLabel(issue.severity))}</span>
                </div>
                <div class="issue-description">${escapeHtml(issue.description)}</div>
                ${issue.suggestion ? `<div class="issue-suggestion">建议: ${escapeHtml(issue.suggestion)}</div>` : ''}
            </div>
        `).join('');
    } else {
        Elements.detectedIssues.innerHTML = '<div class="issue-item"><div class="issue-description">未检测到明显问题</div></div>';
    }
}

// 显示保存对话框
function showSaveDialog() {
    const saveName = prompt('请输入存档名称:', `存档_${new Date().toLocaleString()}`);
    if (!saveName) return;
    
    createSave(saveName);
}

// 创建存档
function createSave(saveName) {
    const saveData = {
        id: Date.now().toString(),
        name: saveName,
        timestamp: new Date().toISOString(),
        gamePhase: AppState.gamePhase,
        worldData: AppState.worldData ? { ...AppState.worldData } : null,
        characterData: AppState.characterData ? { ...AppState.characterData } : null,
        gameState: { ...AppState.gameState },
        version: '2.0'
    };
    
    AppState.saves.unshift(saveData);
    
    // 限制存档数量
    if (AppState.saves.length > AppState.settings.maxSaves) {
        AppState.saves = AppState.saves.slice(0, AppState.settings.maxSaves);
    }
    
    saveSaves();
    showMessage('存档已创建', 'success');
    
    // 如果在存档页面，更新显示
    if (AppState.currentTab === 'saves') {
        updateSavesDisplay();
    }
}

// 加载存档
function loadSave(saveId) {
    const save = AppState.saves.find(s => s.id === saveId);
    if (!save) return;
    
    if (confirm(`确定要加载存档"${save.name}"吗？当前进度将被覆盖。`)) {
        // 恢复游戏状态
        AppState.gamePhase = save.gamePhase || 'playing';
        if (save.worldData) {
            AppState.worldData = { ...save.worldData };
        }
        if (save.characterData) {
            AppState.characterData = { ...save.characterData };
        }
        if (save.gameState) {
            AppState.gameState = { ...save.gameState };
        }
        
        // 显示相应界面
        if (AppState.gamePhase === 'init') {
            showGameInterface('init');
        } else if (AppState.gamePhase === 'creation') {
            showGameInterface('creation');
            displayCharacterCreation();
        } else {
            showGameInterface('game');
            updateGameUI();
        }
        
        saveGameState();
        
        // 切换到游戏页面
        switchTab('game');
        showMessage('存档已加载', 'success');
    }
}

// 删除存档
function deleteSave(saveId) {
    if (!confirm('确定要删除这个存档吗？')) return;
    
    const index = AppState.saves.findIndex(s => s.id === saveId);
    if (index !== -1) {
        const saveName = AppState.saves[index].name;
        AppState.saves.splice(index, 1);
        saveSaves();
        
        // 更新过滤后的存档
        const filteredIndex = AppState.filteredSaves.findIndex(s => s.id === saveId);
        if (filteredIndex !== -1) {
            AppState.filteredSaves.splice(filteredIndex, 1);
        }
        
        updateSavesDisplay();
        showMessage(`存档"${saveName}"已删除`, 'success');
    }
}

// 导出存档
function exportSave(saveId) {
    const save = AppState.saves.find(s => s.id === saveId);
    if (!save) return;
    
    const dataStr = JSON.stringify(save, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${save.name}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('存档已导出', 'success');
}

// 更新存档显示
function updateSavesDisplay() {
    const startIndex = (AppState.currentSavePage - 1) * AppState.itemsPerPage;
    const endIndex = startIndex + AppState.itemsPerPage;
    const displaySaves = AppState.filteredSaves.slice(startIndex, endIndex);

    Elements.savesCount.textContent = '共找到 ' + AppState.filteredSaves.length + ' 个存档';

    if (displaySaves.length === 0) {
        Elements.savesTbody.innerHTML = '';
        Elements.noSaves.style.display = 'block';
        Elements.savesPagination.innerHTML = '';
        return;
    }

    Elements.noSaves.style.display = 'none';

    Elements.savesTbody.innerHTML = displaySaves.map(function(save) {
        var gameState = save.gameState;
        var saveDate = new Date(save.timestamp);
        var playTime = calculatePlayTime(gameState);

        return '<tr>' +
            '<td>' + escapeHtml(save.name) + '</td>' +
            '<td>' + escapeHtml(gameState.playerName || '冒险者') + '</td>' +
            '<td>Lv.' + escapeHtml(gameState.level || 1) + '</td>' +
            '<td>' + escapeHtml(gameState.chapter || '序章') + '</td>' +
            '<td>' + escapeHtml(playTime) + '</td>' +
            '<td>' + escapeHtml(saveDate.toLocaleString()) + '</td>' +
            '<td>' +
                '<div class="action-buttons">' +
                    '<button title="加载存档" onclick="loadSave(\'' + escapeHtml(save.id) + '\')"><i class="fas fa-upload"></i></button>' +
                    '<button title="查看详情" onclick="viewSave(\'' + escapeHtml(save.id) + '\')"><i class="fas fa-eye"></i></button>' +
                    '<button title="导出存档" onclick="exportSave(\'' + escapeHtml(save.id) + '\')"><i class="fas fa-download"></i></button>' +
                    '<button title="删除存档" onclick="deleteSave(\'' + escapeHtml(save.id) + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }).join('');

    updateSavesPagination();
}

// 更新存档分页
function updateSavesPagination() {
    const totalPages = Math.ceil(AppState.filteredSaves.length / AppState.itemsPerPage);
    
    if (totalPages <= 1) {
        Elements.savesPagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `
        <button ${AppState.currentSavePage === 1 ? 'disabled' : ''} onclick="changeSavePage(${AppState.currentSavePage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 页码按钮
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        paginationHTML += `
            <button class="${i === AppState.currentSavePage ? 'active' : ''}" onclick="changeSavePage(${i})">${i}</button>
        `;
    }
    
    // 下一页按钮
    paginationHTML += `
        <button ${AppState.currentSavePage === totalPages ? 'disabled' : ''} onclick="changeSavePage(${AppState.currentSavePage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    Elements.savesPagination.innerHTML = paginationHTML;
}

// 切换存档页面
function changeSavePage(page) {
    const totalPages = Math.ceil(AppState.filteredSaves.length / AppState.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    AppState.currentSavePage = page;
    updateSavesDisplay();

    // 默认切换到游戏标签页
    switchTab('game');
}

// 查看存档详情
function viewSave(saveId) {
    const save = AppState.saves.find(s => s.id === saveId);
    if (!save) return;
    
    const gameState = save.gameState || {};
    const saveDate = new Date(save.timestamp);
    
    let detailHTML = `
        <h2>存档详情</h2>
        <div class="case-detail">
            <div class="detail-section">
                <h3>基本信息</h3>
                <p><strong>存档名称:</strong> ${save.name}</p>
                <p><strong>保存时间:</strong> ${saveDate.toLocaleString()}</p>
                <p><strong>游戏阶段:</strong> ${getGamePhaseLabel(save.gamePhase)}</p>
                <p><strong>版本:</strong> ${save.version || '未知'}</p>
    `;
    
    // 根据游戏阶段显示不同信息
    if (save.gamePhase === 'creation' && save.characterData) {
        const character = save.characterData;
        detailHTML += `
                <p><strong>角色名称:</strong> ${character.name}</p>
                <p><strong>角色背景:</strong> ${character.background}</p>
            </div>
            
            <div class="detail-section">
                <h3>角色属性</h3>
                <p><strong>生命值:</strong> ${character.stats?.health || '未知'}</p>
                <p><strong>法力值:</strong> ${character.stats?.mana || '未知'}</p>
                <p><strong>力量:</strong> ${character.stats?.strength || '未知'}</p>
                <p><strong>智力:</strong> ${character.stats?.intelligence || '未知'}</p>
                <p><strong>敏捷:</strong> ${character.stats?.agility || '未知'}</p>
                <p><strong>魅力:</strong> ${character.stats?.charisma || '未知'}</p>
            </div>
            
            <div class="detail-section">
                <h3>角色技能与装备</h3>
                <p><strong>技能:</strong> ${character.skills?.join(', ') || '无'}</p>
                <p><strong>天赋:</strong> ${character.talents?.join(', ') || '无'}</p>
                <p><strong>装备:</strong> ${character.equipment?.join(', ') || '无'}</p>
                <p><strong>物品:</strong> ${character.inventory?.join(', ') || '无'}</p>
        `;
    } else if (save.gamePhase === 'playing' && gameState) {
        detailHTML += `
                <p><strong>玩家名称:</strong> ${gameState.playerName || '未知'}</p>
                <p><strong>等级:</strong> ${gameState.level || '未知'}</p>
                <p><strong>章节:</strong> ${gameState.chapter || '未知'}</p>
                <p><strong>进度:</strong> ${gameState.progress || 0}%</p>
                <p><strong>职业:</strong> ${gameState.class || '未知'}</p>
                <p><strong>当前生命值:</strong> ${gameState.health || 0}/${gameState.maxHealth || 0}</p>
                <p><strong>当前法力值:</strong> ${gameState.mana || 0}/${gameState.maxMana || 0}</p>
                <p><strong>经验值:</strong> ${gameState.exp || 0}/${gameState.maxExp || 0}</p>
            </div>
            
            <div class="detail-section">
                <h3>当前场景</h3>
                <p><strong>场景标题:</strong> ${gameState.sceneTitle || '未知'}</p>
                <p><strong>场景描述:</strong> ${gameState.sceneDescription || '未知'}</p>
            </div>
            
            <div class="detail-section">
                <h3>故事历史（最近5轮）</h3>
                ${(gameState.storyHistory || []).slice(-5).map((entry, index) => 
                    `<p>${index % 2 === 0 ? '🎮' : '🤖'} ${entry}</p>`
                ).join('')}
            </div>
            
            <div class="detail-section">
                <h3>物品与装备</h3>
                <p><strong>装备:</strong> ${(gameState.equipment || []).join(', ') || '无'}</p>
                <p><strong>物品:</strong> ${(gameState.inventory || []).join(', ') || '无'}</p>
                <p><strong>技能:</strong> ${(gameState.skills || []).join(', ') || '无'}</p>
        `;
    }
    
    // 显示世界信息（如果有）
    if (save.worldData) {
        const world = save.worldData;
        detailHTML += `
            <div class="detail-section">
                <h3>世界信息</h3>
                <p><strong>世界名称:</strong> ${world.name}</p>
                <p><strong>世界主题:</strong> ${world.theme}</p>
                <p><strong>游戏难度:</strong> ${world.difficulty}</p>
                <p><strong>故事长度:</strong> ${world.storyLength}</p>
                <p><strong>世界描述:</strong> ${world.description}</p>
            </div>
        `;
    }
    
    detailHTML += `
        </div>
        
        <div class="modal-actions">
            <button class="secondary-btn" onclick="loadSave('${saveId}')">
                <i class="fas fa-upload"></i> 加载存档
            </button>
            <button class="secondary-btn" onclick="exportSave('${saveId}')">
                <i class="fas fa-download"></i> 导出存档
            </button>
            <button class="danger-btn" onclick="deleteSave('${saveId}')">
                <i class="fas fa-trash"></i> 删除存档
            </button>
        </div>
    `;
    
    Elements.caseModalBody.innerHTML = detailHTML;
    Elements.caseModal.style.display = 'block';
}

// 获取游戏阶段标签
function getGamePhaseLabel(phase) {
    const labels = {
        'init': '初始化',
        'creation': '角色创建',
        'playing': '游戏中'
    };
    return labels[phase] || '未知';
}

// 导出所有存档
function exportAllSaves() {
    if (AppState.saves.length === 0) {
        showMessage('暂无存档可导出', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(AppState.saves, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-game-saves-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('所有存档已导出', 'success');
}

// 导入存档文件
function importSaveFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSave = JSON.parse(e.target.result);
                
                // 验证存档格式
                if (!importedSave.id || !importedSave.gameState) {
                    showMessage('导入失败：无效的存档格式', 'error');
                    return;
                }
                
                // 添加到存档列表
                AppState.saves.unshift(importedSave);
                
                // 限制存档数量
                if (AppState.saves.length > AppState.settings.maxSaves) {
                    AppState.saves = AppState.saves.slice(0, AppState.settings.maxSaves);
                }
                
                saveSaves();
                updateSavesDisplay();
                showMessage('存档导入成功', 'success');
                
            } catch (error) {
                showMessage('导入失败：文件格式不正确', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// 排序存档
function sortSaves() {
    // 按时间降序排列
    AppState.filteredSaves.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    updateSavesDisplay();
    showMessage('存档已按时间排序', 'success');
}

// 计算游戏时长
function calculatePlayTime(gameState) {
    var playTime = gameState.playTime || 0;
    var hours = Math.floor(playTime / 60);
    var minutes = playTime % 60;

    if (hours > 0) {
        return hours + '小时' + minutes + '分钟';
    }
    return minutes + '分钟';
}

// 自动保存游戏
function autoSaveGame() {
    if (AppState.gamePhase === 'playing') {
        const autoSaveName = `自动保存_${new Date().toLocaleTimeString()}`;
        createSave(autoSaveName);
    }
}

// 保存到数据库（保留原有函数，但不再使用）
function saveToDatabase() {
    if (!AppState.currentAnalysisData) {
        showMessage('没有可保存的分析结果', 'error');
        return;
    }
    
    const caseEntry = {
        id: Date.now().toString(),
        timestamp: AppState.currentAnalysisData.timestamp,
        answer: AppState.currentAnalysisData.answer.substring(0, 200) + '...',
        fullAnswer: AppState.currentAnalysisData.answer,
        context: AppState.currentAnalysisData.context,
        analysisType: AppState.currentAnalysisData.analysisType,
        strictness: AppState.currentAnalysisData.strictness,
        suspicionScore: AppState.currentAnalysisData.suspicionScore,
        summary: AppState.currentAnalysisData.summary,
        issues: AppState.currentAnalysisData.issues,
        strengths: AppState.currentAnalysisData.strengths,
        overallRating: AppState.currentAnalysisData.overallRating,
        tags: extractTags(AppState.currentAnalysisData)
    };
    
    AppState.cases.unshift(caseEntry);
    
    // 限制案例数量
    if (AppState.cases.length > AppState.settings.maxEntries) {
        AppState.cases = AppState.cases.slice(0, AppState.settings.maxEntries);
    }
    
    saveCases();
    showMessage('案例已保存到案例库', 'success');
    
    // 如果在案例库页面，更新显示
    if (AppState.currentTab === 'database') {
        filterAndSearchCases();
    }
}

// 提取标签
function extractTags(analysisData) {
    const tags = [];
    
    if (analysisData.issues && analysisData.issues.length > 0) {
        const issueTypes = [...new Set(analysisData.issues.map(issue => issue.type))];
        tags.push(...issueTypes);
    }
    
    // 根据可疑度添加标签
    if (analysisData.suspicionScore > 70) {
        tags.push('high-suspicion');
    } else if (analysisData.suspicionScore > 40) {
        tags.push('medium-suspicion');
    } else {
        tags.push('low-suspicion');
    }
    
    return tags;
}

// 导出结果
function exportResults() {
    if (!AppState.currentAnalysisData) {
        showMessage('没有可导出的分析结果', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(AppState.currentAnalysisData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('分析结果已导出', 'success');
}

// 兼容性函数
function filterAndSearchCases() {
    // 不再需要，但保留以避免错误
}

function updateCasesDisplay() {
    // 不再需要，但保留以避免错误
}

function updatePagination() {
    // 不再需要，但保留以避免错误
}

// 切换页面（存档）
function changePage(page) {
    changeSavePage(page);
}

// 设置相关函数
function toggleApiKeyVisibility() {
    if (Elements.apiKey.type === 'password') {
        Elements.apiKey.type = 'text';
        Elements.toggleApiKey.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        Elements.apiKey.type = 'password';
        Elements.toggleApiKey.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function updateSetting(key, value) {
    if (key === 'maxSaves' || key === 'maxEntries') {
        AppState.settings[key] = parseInt(value);
    } else if (key === 'apiModel') {
        // 确保 apiModel 是字符串
        AppState.settings[key] = String(value);
    } else {
        AppState.settings[key] = value;
    }
    
    // 如果更新了玩家名称，同时更新游戏状态
    if (key === 'playerName') {
        AppState.gameState.playerName = value;
        updateGameUI();
        saveGameState();
    }
    
    saveSettings();
}

// 导出所有数据
function exportAllData() {
    const allData = {
        settings: AppState.settings,
        gameState: AppState.gameState,
        saves: AppState.saves,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-game-backup-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('所有数据已导出', 'success');
}

// 导入数据
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 询问用户要导入什么数据
                const importOptions = [];
                if (importedData.saves) importOptions.push('saves');
                if (importedData.gameState) importOptions.push('gameState');
                if (importedData.settings) importOptions.push('settings');
                
                if (importOptions.length === 0) {
                    showMessage('导入的文件中没有有效的数据', 'error');
                    return;
                }
                
                let message = '检测到以下数据可供导入：\n';
                if (importOptions.includes('saves')) message += '- 存档数据\n';
                if (importOptions.includes('gameState')) message += '- 游戏状态\n';
                if (importOptions.includes('settings')) message += '- 设置数据\n';
                message += '\n确定要导入这些数据吗？这将替换现有数据。';
                
                if (confirm(message)) {
                    if (importOptions.includes('saves')) {
                        AppState.saves = importedData.saves;
                        saveSaves();
                        updateSavesDisplay();
                    }
                    
                    if (importOptions.includes('gameState')) {
                        AppState.gameState = {...AppState.gameState, ...importedData.gameState};
                        saveGameState();
                        updateGameUI();
                    }
                    
                    if (importOptions.includes('settings')) {
                        AppState.settings = {...AppState.settings, ...importedData.settings};
                        saveSettings();
                        loadSettings(); // 重新加载设置到界面
                    }
                    
                    showMessage('数据导入成功', 'success');
                }
            } catch (error) {
                showMessage('导入失败：文件格式不正确', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// 清除所有数据
function clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    
    if (confirm('再次确认：您将丢失所有游戏进度、存档和设置数据！')) {
        AppState.saves = [];
        saveSaves();
        
        // 重置游戏状态
        AppState.gameState = {
            playerName: AppState.settings.playerName || '冒险者',
            level: 1,
            chapter: '序章',
            progress: 0,
            sceneTitle: '神秘的森林',
            sceneDescription: '你站在一片古老的森林入口，前方是蜿蜒的小径，阳光透过树叶洒下斑驳的光影。远处似乎传来神秘的呼唤声，你可以感觉到空气中弥漫着魔法的气息。你将如何选择你的道路？',
            storyHistory: [],
            aiResponse: null
        };
        saveGameState();
        updateGameUI();
        
        // 重置设置为默认值
        AppState.settings = {
            apiKey: 'ollama',
            apiModel: 'minimax-m2.5:cloud',
            apiEndpoint: 'http://localhost:11434',
            playerName: '冒险者',
            autoSave: 'enabled',
            maxSaves: 20
        };
        saveSettings();
        loadSettings();
        
        updateSavesDisplay();
        showMessage('所有数据已清除', 'success');
    }
}

// 工具函数
function showLoading(show) {
    Elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showMessage(message, type = 'info') {
    Elements.modalBody.innerHTML = `
        <div class="message ${type}">
            <div class="message-icon">
                ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                  type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
                  '<i class="fas fa-info-circle"></i>'}
            </div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    Elements.modal.style.display = 'block';
    
    // 自动关闭成功和信息消息
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            Elements.modal.style.display = 'none';
        }, 3000);
    }
}

// 标签和分类的辅助函数
function getIssueTypeLabel(type) {
    const labels = {
        'factual-error': '事实错误',
        'bias': '偏见',
        'uncertainty': '表述不明确',
        'outdated': '信息过时',
        'parsing-error': '解析错误'
    };
    return labels[type] || type;
}

function getSeverityLabel(severity) {
    const labels = {
        'low': '低',
        'medium': '中',
        'high': '高'
    };
    return labels[severity] || severity;
}

function getSuspicionClass(score) {
    if (score > 70) return 'suspicion-high';
    if (score > 40) return 'suspicion-medium';
    return 'suspicion-low';
}

function getAnalysisTypeLabel(type) {
    const labels = {
        'general': '常规分析',
        'factual': '事实核查',
        'bias': '偏见检测',
        'comprehensive': '综合分析'
    };
    return labels[type] || type;
}

function getStrictnessLabel(strictness) {
    const labels = {
        'low': '宽松',
        'medium': '中等',
        'high': '严格'
    };
    return labels[strictness] || strictness;
}

function getRatingLabel(rating) {
    const labels = {
        'excellent': '优秀',
        'good': '良好',
        'fair': '一般',
        'poor': '较差'
    };
    return labels[rating] || rating;
}

function getTagLabel(tag) {
    const labels = {
        'factual-error': '事实错误',
        'bias': '偏见',
        'uncertainty': '表述不明确',
        'outdated': '信息过时',
        'high-suspicion': '高可疑度',
        'medium-suspicion': '中可疑度',
        'low-suspicion': '低可疑度'
    };
    return labels[tag] || tag;
}

// 本地存储函数
function saveSettings() {
    localStorage.setItem('ai-game-settings', JSON.stringify(AppState.settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('ai-game-settings');
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);

            // 确保 apiModel 是字符串
            if (parsed.apiModel && typeof parsed.apiModel !== 'string') {
                console.warn('apiModel 格式错误，重置为默认值');
                parsed.apiModel = 'qwen3:8b';
            }

            AppState.settings = {...AppState.settings, ...parsed};
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    // 更新UI元素
    Elements.apiKey.value = AppState.settings.apiKey || '';
    Elements.apiModel.value = AppState.settings.apiModel || 'qwen3:8b';
    Elements.apiEndpoint.value = AppState.settings.apiEndpoint || 'http://localhost:11434';
    Elements.playerNameInput.value = AppState.settings.playerName || '冒险者';
    Elements.autoSave.value = AppState.settings.autoSave || 'enabled';
    Elements.maxSaves.value = AppState.settings.maxSaves || 20;
    Elements.showSceneImages.value = AppState.settings.showSceneImages || 'disabled';
    if (Elements.alchemyCheatMode) {
        Elements.alchemyCheatMode.value = AppState.settings.alchemyCheatMode || 'disabled';
    }
}

// 动态加载模型列表
function loadModelOptions() {
    // 检查 shared.js 是否已加载
    if (typeof LOCAL_MODELS === 'undefined' || typeof CLOUD_MODELS === 'undefined') {
        console.warn('shared.js 未加载，使用默认模型列表');
        return;
    }

    const localGroup = document.getElementById('local-models-group');
    const cloudGroup = document.getElementById('cloud-models-group');

    if (!localGroup || !cloudGroup) {
        console.warn('模型选择器元素未找到');
        return;
    }

    // 清空现有选项
    localGroup.innerHTML = '';
    cloudGroup.innerHTML = '';

    // 添加本地模型
    LOCAL_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = formatModelName(model);
        localGroup.appendChild(option);
    });

    // 添加云端模型
    CLOUD_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = formatModelName(model);
        cloudGroup.appendChild(option);
    });

    // 恢复之前选择的模型
    const savedModel = AppState.settings.apiModel || 'minimax-m2.5:cloud';
    Elements.apiModel.value = savedModel;
}

// 格式化模型名称显示
function formatModelName(model) {
    return model
        .replace(/:latest/g, '')
        .replace(/:cloud/g, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function saveGameState() {
    // 优化数据存储
    optimizeDataStorage();
    
    localStorage.setItem('ai-game-state', JSON.stringify(AppState.gameState));
    
    if (AppState.worldData) {
        localStorage.setItem('ai-game-world', JSON.stringify(AppState.worldData));
    }
    
    if (AppState.characterData) {
        localStorage.setItem('ai-game-character', JSON.stringify(AppState.characterData));
    }
}

function loadGameState() {
    const savedState = localStorage.getItem('ai-game-state');
    const savedWorld = localStorage.getItem('ai-game-world');
    const savedCharacter = localStorage.getItem('ai-game-character');
    
    // 加载游戏状态
    if (savedState) {
        try {
            AppState.gameState = {...AppState.gameState, ...JSON.parse(savedState)};
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            resetGameState();
        }
    } else {
        resetGameState();
    }
    
    // 加载世界数据
    if (savedWorld) {
        try {
            AppState.worldData = JSON.parse(savedWorld);
        } catch (error) {
            console.error('加载世界数据失败:', error);
            AppState.worldData = null;
        }
    }
    
    // 加载角色数据
    if (savedCharacter) {
        try {
            AppState.characterData = JSON.parse(savedCharacter);
        } catch (error) {
            console.error('加载角色数据失败:', error);
            AppState.characterData = null;
        }
    }
    
    // 更新游戏状态中的玩家名称
    AppState.gameState.playerName = AppState.settings.playerName || '冒险者';
}

// 重置游戏状态
function resetGameState() {
    AppState.gameState = {
        playerName: AppState.settings.playerName || '冒险者',
        level: 1,
        chapter: '序章',
        progress: 0,
        sceneTitle: '神秘的森林',
        sceneDescription: '你站在一片古老的森林入口，前方是蜿蜒的小径，阳光透过树叶洒下斑驳的光影。远处似乎传来神秘的呼唤声，你可以感觉到空气中弥漫着魔法的气息。你将如何选择你的道路？',
        storyHistory: [],
        aiResponse: null,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        exp: 0,
        maxExp: 100,
        // 默认添加一些炼丹材料和炉鼎，方便用户测试
        inventory: [
            { id: 'item-1', name: '千年灵芝', type: 'material', description: '生长千年的灵芝，药性温和', quantity: 5 },
            { id: 'item-2', name: '人参王', type: 'material', description: '千年人参之王，补气养血', quantity: 3 },
            { id: 'item-3', name: '当归', type: 'material', description: '常见草药，调理气血', quantity: 10 },
            { id: 'item-4', name: '首乌', type: 'material', description: '滋补肝肾，益精血', quantity: 5 },
            { id: 'cauldron-1', name: '青铜炼丹炉', type: 'cauldron', description: '基础炉鼎，适合初学者', quantity: 1 },
            { id: 'cauldron-2', name: '白银炼丹炉', type: 'cauldron', description: '中级炉鼎，炼制效果佳', quantity: 1 }
        ],
        skills: [],
        equipment: [],
        location: null
    };

    AppState.worldData = null;
    AppState.characterData = null;
}

function saveSaves() {
    // 限制存档历史记录
    if (AppState.saves.length > AppState.settings.maxSaves) {
        AppState.saves = AppState.saves.slice(0, AppState.settings.maxSaves);
    }
    
    // 优化存档数据，减少存储空间
    const optimizedSaves = AppState.saves.map(save => {
        const optimized = { ...save };
        
        // 限制故事历史长度
        if (optimized.gameState && optimized.gameState.storyHistory) {
            if (optimized.gameState.storyHistory.length > 50) {
                optimized.gameState.storyHistory = optimized.gameState.storyHistory.slice(-50);
            }
        }
        
        // 限制任务历史长度
        if (optimized.gameState && optimized.gameState.questData && optimized.gameState.questData.questHistory) {
            if (optimized.gameState.questData.questHistory.length > 20) {
                optimized.gameState.questData.questHistory = optimized.gameState.questData.questHistory.slice(-20);
            }
        }
        
        return optimized;
    });
    
    localStorage.setItem('ai-game-saves', JSON.stringify(optimizedSaves));
}

function loadSaves() {
    const savedSaves = localStorage.getItem('ai-game-saves');
    if (savedSaves) {
        try {
            AppState.saves = JSON.parse(savedSaves);
            
            // 检查存档版本兼容性
            AppState.saves = AppState.saves.map(save => {
                // 如果存档版本低于2.0，添加缺失的字段
                if (!save.version || parseFloat(save.version) < 2.0) {
                    // 添加地图数据
                    if (save.gameState && !save.gameState.mapData) {
                        save.gameState.mapData = {
                            gridSize: 5,
                            playerPosition: { x: 2, y: 2 },
                            discoveredTiles: [{ x: 2, y: 2 }],
                            tiles: {}
                        };
                    }
                    
                    // 添加任务数据
                    if (save.gameState && !save.gameState.questData) {
                        save.gameState.questData = {
                            activeQuests: [],
                            completedQuests: [],
                            availableQuests: [],
                            questHistory: []
                        };
                    }
                    
                    // 更新版本号
                    save.version = '2.0';
                }
                
                return save;
            });
        } catch (error) {
            console.error('加载存档失败:', error);
            AppState.saves = [];
        }
    } else {
        AppState.saves = [];
    }
    
    AppState.filteredSaves = [...AppState.saves];
}

    // 保留原有函数的兼容性
function saveCases() {
    saveSaves();
}

function loadCases() {
    loadSaves();
}

// 兼容性函数 - 不再需要但保留以避免错误
function viewCase(caseId) {
    viewSave(caseId);
}

function deleteCase(caseId) {
    deleteSave(caseId);
}

function exportCase(caseId) {
    exportSave(caseId);
}

function exportDatabase() {
    exportAllSaves();
}

// 生成唯一物品ID
function generateItemId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

// 使用物品
async function useItem(itemId) {
    var state = AppState.gameState;
    var itemIndex = state.inventory.findIndex(function(i) { return i.id === itemId; });

    // 兼容旧格式
    if (itemIndex === -1) {
        itemIndex = state.inventory.findIndex(function(i) { return i.name === itemId; });
    }

    if (itemIndex === -1) {
        showMessage('找不到该物品', 'error');
        return;
    }

    var item = state.inventory[itemIndex];

    if (item.type === 'quest') {
        showMessage('任务物品无法使用', 'error');
        return;
    }

    if (item.type === 'equipment') {
        equipItem(itemId);
        return;
    }

    // 丹药使用 AI 判定效果
    if (item.name.indexOf('丹') > -1 || item.type === 'consumable') {
        await usePillWithAI(item, itemIndex);
        return;
    }

    // 普通物品处理
    var effectMessage = '使用了 ' + item.name;

    if (item.name.indexOf('药') > -1 || item.name.indexOf('水') > -1 || item.name.indexOf('面包') > -1) {
        var healAmount = 20 + Math.floor(Math.random() * 10);
        state.health = Math.min(state.maxHealth, state.health + healAmount);
        effectMessage += '，恢复了 ' + healAmount + ' 点生命值';
    } else if (item.name.indexOf('魔') > -1 || item.name.indexOf('法') > -1) {
        var manaAmount = 15 + Math.floor(Math.random() * 10);
        state.mana = Math.min(state.maxMana, state.mana + manaAmount);
        effectMessage += '，恢复了 ' + manaAmount + ' 点法力';
    } else {
        effectMessage += '，获得了一些增益';
    }

    item.quantity--;
    if (item.quantity <= 0) {
        state.inventory.splice(itemIndex, 1);
    }

    saveGameState();
    showMessage(effectMessage, 'success');
    updateGameUI();
    closeModal();
    showInventory();
}

// 使用丹药 - AI 判定效果
async function usePillWithAI(item, itemIndex) {
    var state = AppState.gameState;

    var prompt = `你是修仙游戏的GM，玩家使用了一枚丹药，请判定使用后的效果：

【丹药名称】${item.name}
【丹药描述】${item.description || '未知丹药'}
【丹药品质】${item.quality || '未知'}
【丹药功效】${item.effect || '未知'}

玩家当前状态：
- 生命值：${state.health}/${state.maxHealth}
- 法力值：${state.mana}/${state.maxMana}
- 等级：${state.level}
- 当前章节：${state.chapter}

请以JSON格式返回效果判定，格式如下：
{
  "effect": "使用效果描述（1-2句话）",
  "healthChange": 生命值变化（整数，正数为恢复，负数为伤害，0为无变化）,
  "manaChange": 法力值变化（整数，正数为恢复，负数为消耗，0为无变化）,
  "expChange": 经验值变化（整数，正数为增加，负数为扣除，0为无变化）,
  "specialEffect": "特殊效果（如：临时获得某种能力、属性提升等，无则为null）"
}

要求：
- 根据丹药名称和品质合理判定效果
- 高品阶丹药效果更强
- 有一定随机性和意外效果
- 保持仙侠风格`;

    try {
        showMessage('正在服用丹药...', 'info');
        var response = await callOpenAI(prompt);

        // 提取JSON
        var jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI返回格式错误');
        }

        var effectData = JSON.parse(jsonMatch[0]);

        // 应用效果
        if (effectData.healthChange) {
            state.health = Math.max(0, Math.min(state.maxHealth, state.health + effectData.healthChange));
        }
        if (effectData.manaChange) {
            state.mana = Math.max(0, Math.min(state.maxMana, state.mana + effectData.manaChange));
        }
        if (effectData.expChange) {
            state.exp += effectData.expChange;
            checkLevelUp();
        }

        // 特殊效果记录到故事历史
        if (effectData.specialEffect) {
            state.storyHistory.push('服用' + item.name + '：' + effectData.specialEffect);
        }

        // 消耗物品
        item.quantity--;
        if (item.quantity <= 0) {
            state.inventory.splice(itemIndex, 1);
        }

        saveGameState();
        updateGameUI();
        showMessage(effectData.effect || '丹药已服用', 'success');

        closeModal();
        showInventory();

    } catch (error) {
        console.error('丹药效果判定失败:', error);
        // 失败时使用默认效果
        var healAmount = 30 + Math.floor(Math.random() * 20);
        state.health = Math.min(state.maxHealth, state.health + healAmount);
        showMessage('服用' + item.name + '，恢复了' + healAmount + '点生命值', 'success');
        closeModal();
        showInventory();
    }
}

// 装备物品 - 新版三槽位系统
function equipItem(itemId) {
    var state = AppState.gameState;
    var itemIndex = state.inventory.findIndex(function(i) { return i.id === itemId; });

    // 兼容旧格式
    if (itemIndex === -1) {
        itemIndex = state.inventory.findIndex(function(i) { return i.name === itemId; });
    }

    if (itemIndex === -1) {
        showMessage('找不到该物品', 'error');
        return;
    }

    var item = state.inventory[itemIndex];

    // 判断装备槽位
    var slot = null;
    var slotName = '';

    if (item.slot === 'weapon' || item.name.indexOf('剑') > -1 || item.name.indexOf('刀') > -1 ||
        item.name.indexOf('杖') > -1 || item.name.indexOf('弓') > -1 || item.name.indexOf('武器') > -1) {
        slot = 'weapon';
        slotName = '武器';
    } else if (item.slot === 'armor' || item.name.indexOf('甲') > -1 || item.name.indexOf('衣') > -1 ||
               item.name.indexOf('袍') > -1 || item.name.indexOf('铠') > -1 || item.name.indexOf('防具') > -1) {
        slot = 'armor';
        slotName = '防具';
    } else if (item.slot === 'accessory' || item.name.indexOf('戒') > -1 || item.name.indexOf('链') > -1 ||
               item.name.indexOf('符') > -1 || item.name.indexOf('饰品') > -1) {
        slot = 'accessory';
        slotName = '饰品';
    } else {
        // 默认根据type判断
        if (item.subType === 'weapon') { slot = 'weapon'; slotName = '武器'; }
        else if (item.subType === 'armor') { slot = 'armor'; slotName = '防具'; }
        else if (item.subType === 'accessory') { slot = 'accessory'; slotName = '饰品'; }
        else { slot = 'weapon'; slotName = '武器'; } // 默认武器
    }

    // 卸下当前装备到背包
    if (state.equipment[slot]) {
        var oldEquip = state.equipment[slot];
        oldEquip.quantity = 1;
        state.inventory.push(oldEquip);
    }

    // 装备新物品
    state.equipment[slot] = {
        id: item.id,
        name: item.name,
        slot: slot,
        stats: item.stats || {},
        description: item.description || ''
    };

    // 从背包移除
    item.quantity--;
    if (item.quantity <= 0) {
        state.inventory.splice(itemIndex, 1);
    }

    saveGameState();
    showMessage('装备了 ' + item.name + ' (' + slotName + ')', 'success');
    updateGameUI();
    closeModal();
    showInventory();
}

// 卸下装备
function unequipItem(slot) {
    var state = AppState.gameState;

    if (!state.equipment[slot]) {
        showMessage('该槽位没有装备', 'info');
        return;
    }

    var equip = state.equipment[slot];
    equip.quantity = 1;
    equip.id = equip.id || generateItemId();
    state.inventory.push(equip);

    state.equipment[slot] = null;

    saveGameState();
    showMessage('卸下了 ' + equip.name, 'success');
    updateGameUI();
    closeModal();
    showInventory();
}

// 丢弃物品
function discardItem(itemId) {
    var state = AppState.gameState;
    var itemIndex = state.inventory.findIndex(function(i) { return i.id === itemId; });

    // 兼容旧格式：尝试按名称查找
    if (itemIndex === -1) {
        itemIndex = state.inventory.findIndex(function(i) { return i.name === itemId; });
    }

    if (itemIndex === -1) {
        showMessage('找不到该物品', 'error');
        return;
    }

    var item = state.inventory[itemIndex];

    if (item.type === 'quest') {
        showMessage('任务物品无法丢弃', 'error');
        return;
    }

    var itemName = item.name || '物品';
    var itemQty = item.quantity || 1;

    if (confirm('确定要丢弃 ' + itemName + (itemQty > 1 ? ' x' + itemQty : '') + ' 吗？')) {
        state.inventory.splice(itemIndex, 1);
        showMessage('丢弃了 ' + itemName, 'success');
        saveGameState();
        updateGameUI();
        closeModal();
        showInventory(); // 刷新背包显示
    }
}

// ==================== AI炼丹炉功能 ====================

// 丹方配置
const ALCHEMY_FORMULAS = {
    polish: {
        name: '润色丹',
        icon: 'fa-sparkles',
        prompt: '请对以下文字进行润色优化，提升文笔水平。保持原意，使表达更加流畅、优美、有感染力。直接返回润色后的内容，不需要任何解释。',
        needsStyle: false
    },
    expand: {
        name: '扩写丹',
        icon: 'fa-expand',
        prompt: '请对以下内容进行扩写，丰富细节描写，增加场景、人物心理、动作描写等。保持原有故事线，让内容更加生动详尽。直接返回扩写后的内容。',
        needsStyle: false
    },
    condense: {
        name: '压缩丹',
        icon: 'fa-compress-arrows-alt',
        prompt: '请对以下内容进行精简压缩，保留核心信息和关键情节，去除冗余描述。直接返回压缩后的内容。',
        needsStyle: false
    },
    style: {
        name: '风格丹',
        icon: 'fa-palette',
        prompt: '请将以下内容改写成指定风格，保持原意但改变表达方式。直接返回改写后的内容。',
        needsStyle: true
    },
    dialogue: {
        name: '对话丹',
        icon: 'fa-comments',
        prompt: '请为以下故事片段添加生动自然的对话，使角色更加鲜活。对话要符合角色性格和场景氛围。直接返回添加对话后的内容。',
        needsStyle: false
    },
    character: {
        name: '人设丹',
        icon: 'fa-user-edit',
        prompt: '请丰富和完善以下角色设定，包括性格特点、背景故事、能力特点、外貌描写等，使其更加立体丰满。直接返回丰富后的角色设定。',
        needsStyle: false
    },
    plot: {
        name: '剧情丹',
        icon: 'fa-project-diagram',
        prompt: '请为以下故事片段设计1-2个合理的剧情转折或冲突，使故事更加引人入胜。转折要符合逻辑，与前文呼应。直接返回包含剧情转折的内容。',
        needsStyle: false
    },
    world: {
        name: '世界观丹',
        icon: 'fa-globe',
        prompt: '请基于以下设定，构建一个完整的世界观，包括但不限于：地理环境、势力分布、历史背景、文化特色、神秘设定等。直接返回构建后的世界观设定。',
        needsStyle: false
    }
};

// 炉鼎配置
// 火候配置
const FIRE_LEVELS = {
    wen: { name: '文火', successBonus: 0.1, risk: 0.05 },
    wu: { name: '武火', successBonus: 0.2, risk: 0.15 },
    tian: { name: '天火', successBonus: 0.4, risk: 0.4 }
};

// 当前炼制结果缓存
let currentAlchemyResult = null;

// 设置AI炼丹炉事件监听
function setupAlchemyEventListeners() {
    // 模式切换
    if (Elements.modeBtns && Elements.modeBtns.length > 0) {
        Elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                switchAlchemyMode(this.dataset.mode);
            });
        });
    }

    // 从背包选择材料
    if (Elements.openInventoryBtn) {
        Elements.openInventoryBtn.addEventListener('click', function() {
            showAlchemyInventory('material');
        });
    }

    // 从背包选择炉鼎
    Elements.openCauldronInventoryBtn?.addEventListener('click', function() {
        showAlchemyInventory('cauldron');
    });

    // 火候选择
    if (Elements.fireLevel) {
        Elements.fireLevel.addEventListener('click', function(e) {
            const btn = e.target.closest('.param-btn');
            if (!btn) return;

            Elements.fireLevel.querySelectorAll('.param-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.alchemy.fireLevel = btn.dataset.value;
        });
    }

    // 开始炼丹按钮
    if (Elements.startAlchemyBtn) {
        Elements.startAlchemyBtn.addEventListener('click', function() {
            startAlchemy();
        });
    }

    // 保存配方按钮
    if (Elements.saveFormulaBtn) {
        Elements.saveFormulaBtn.addEventListener('click', function() {
            saveFormula();
        });
    }

    // 放入背包按钮
    Elements.addPillToInventoryBtn?.addEventListener('click', function() {
        addPillToInventory();
    });

    // 重新炼丹按钮
    if (Elements.retryAlchemyBtn) {
        Elements.retryAlchemyBtn.addEventListener('click', function() {
            resetAlchemyUI();
        });
    }

    // 初始化界面
    initAlchemyUI();
}

// 切换炼丹模式
function switchAlchemyMode(mode) {
    AppState.alchemy.mode = mode;

    // 更新按钮状态
    if (Elements.modeBtns && Elements.modeBtns.length > 0) {
        Elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    // 切换显示区域
    if (mode === 'game') {
        if (Elements.gameModeSection) Elements.gameModeSection.style.display = 'flex';
        if (Elements.simulationModeSection) Elements.simulationModeSection.style.display = 'none';
        if (Elements.formulasSection) Elements.formulasSection.style.display = 'block';
        if (Elements.gameParamsSection) Elements.gameParamsSection.style.display = 'block';
    } else {
        if (Elements.gameModeSection) Elements.gameModeSection.style.display = 'none';
        if (Elements.simulationModeSection) Elements.simulationModeSection.style.display = 'block';
        if (Elements.formulasSection) Elements.formulasSection.style.display = 'none';
        if (Elements.gameParamsSection) Elements.gameParamsSection.style.display = 'none';
    }

    // 隐藏结果
    if (Elements.resultSection) Elements.resultSection.style.display = 'none';
}

// 初始化炼丹炉界面
function initAlchemyUI() {
    // 加载配方
    loadSavedFormulas();
    // 更新统计
    updateAlchemyStats();
    // 切换到游戏模式
    switchAlchemyMode('game');
}

// 显示炼丹背包选择界面
function showAlchemyInventory(type) {
    const inventory = AppState.gameState.inventory || [];

    let inventoryHTML = '<div class="alchemy-inventory-content">';

    if (type === 'material') {
        inventoryHTML += '<h4>选择炼丹材料</h4>';

        if (inventory.length === 0) {
            inventoryHTML += '<p class="empty-hint">背包是空的，去探索世界获取材料吧！</p>';
        } else {
            inventoryHTML += '<div class="inventory-list">';
            inventory.forEach((item, index) => {
                const itemData = typeof item === 'string' ? { name: item } : item;
                const itemId = itemData.id || index.toString();
                const isSelected = AppState.alchemy.selectedMaterials.some(m => m.id === itemId);

                inventoryHTML += `
                    <div class="inventory-item-row ${isSelected ? 'selected' : ''}" data-item-id="${itemId}" data-item-name="${itemData.name}" data-item-obj="${encodeURIComponent(JSON.stringify(itemData))}">
                        <div class="item-icon"><i class="fas fa-leaf"></i></div>
                        <div class="item-info">
                            <span class="item-name">${itemData.name}</span>
                        </div>
                    </div>
                `;
            });
            inventoryHTML += '</div>';
            inventoryHTML += '<div style="margin-top: 1.5rem; text-align: right;">';
            inventoryHTML += '<button id="confirm-materials-btn" class="primary-btn"><i class="fas fa-check"></i> 确认选择</button>';
            inventoryHTML += '</div>';
        }
    } else if (type === 'cauldron') {
        inventoryHTML += '<h4>选择炉鼎</h4>';

        const cauldrons = inventory.filter(item => {
            const itemData = typeof item === 'string' ? { name: item } : item;
            return itemData.type === 'cauldron' || itemData.name?.includes('鼎') || itemData.name?.includes('炉');
        });

        if (cauldrons.length === 0) {
            inventoryHTML += '<p class="empty-hint">背包中没有炉鼎，请先获取炉鼎！</p>';
        } else {
            inventoryHTML += '<div class="inventory-list">';
            cauldrons.forEach((item, index) => {
                const itemData = typeof item === 'string' ? { name: item } : item;
                const itemId = itemData.id || index.toString();
                const isSelected = AppState.alchemy.selectedCauldron?.id === itemId;

                inventoryHTML += `
                    <div class="inventory-item-row ${isSelected ? 'selected' : ''}" data-cauldron-id="${itemId}" data-cauldron-name="${itemData.name}" data-cauldron-obj="${encodeURIComponent(JSON.stringify(itemData))}">
                        <div class="item-icon"><i class="fas fa-fire-burner"></i></div>
                        <div class="item-info">
                            <span class="item-name">${itemData.name}</span>
                        </div>
                    </div>
                `;
            });
            inventoryHTML += '</div>';
            inventoryHTML += '<div style="margin-top: 1.5rem; text-align: right;">';
            inventoryHTML += '<button id="confirm-cauldron-btn" class="primary-btn"><i class="fas fa-check"></i> 确认选择</button>';
            inventoryHTML += '</div>';
        }
    }

    inventoryHTML += '</div>';

    showModal(inventoryHTML);

    if (type === 'material') {
        // 添加材料选择事件监听
        document.querySelectorAll('.inventory-item-row').forEach(item => {
            item.addEventListener('click', function() {
                const itemId = this.dataset.itemId;
                const itemName = this.dataset.itemName;
                const itemObj = JSON.parse(decodeURIComponent(this.dataset.itemObj));

                const index = AppState.alchemy.selectedMaterials.findIndex(m => m.id === itemId);
                if (index > -1) {
                    // 取消选择
                    AppState.alchemy.selectedMaterials.splice(index, 1);
                    this.classList.remove('selected');
                } else {
                    // 添加选择
                    if (AppState.alchemy.selectedMaterials.length >= 6) {
                        showMessage('最多只能选择6种材料', 'warning');
                        return;
                    }
                    AppState.alchemy.selectedMaterials.push({ id: itemId, name: itemName, ...itemObj });
                    this.classList.add('selected');
                }
            });
        });

        document.getElementById('confirm-materials-btn')?.addEventListener('click', function() {
            closeModal();
            updateSelectedMaterialsDisplay();
            showMessage(`已选择 ${AppState.alchemy.selectedMaterials.length} 种材料`, 'success');
        });
    } else if (type === 'cauldron') {
        // 添加炉鼎选择事件监听
        document.querySelectorAll('.inventory-item-row').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.inventory-item-row').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        document.getElementById('confirm-cauldron-btn')?.addEventListener('click', function() {
            const selected = document.querySelector('.inventory-item-row.selected');
            if (selected) {
                const cauldronObj = JSON.parse(decodeURIComponent(selected.dataset.cauldronObj));
                AppState.alchemy.selectedCauldron = cauldronObj;
                updateSelectedCauldronDisplay();
                closeModal();
                showMessage(`已选择炉鼎: ${cauldronObj.name}`, 'success');
            }
        });
    }
}

// 更新已选材料显示
function updateSelectedMaterialsDisplay() {
    if (!Elements.selectedCount || !Elements.selectedList) return;

    const materials = AppState.alchemy.selectedMaterials;
    Elements.selectedCount.textContent = materials.length;

    if (materials.length === 0) {
        Elements.selectedList.innerHTML = '<div class="empty-hint">尚未选择任何材料，点击"从背包选择"添加</div>';
    } else {
        Elements.selectedList.innerHTML = materials.map(m => `
            <div class="selected-material-item">
                <span>${m.name} ${m.quantity ? `(${m.quantity})` : ''}</span>
                <button onclick="removeAlchemyMaterial('${m.id}')"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }
}

// 更新已选炉鼎显示
function updateSelectedCauldronDisplay() {
    if (!Elements.selectedCauldron) return;

    const cauldron = AppState.alchemy.selectedCauldron;
    if (!cauldron) {
        Elements.selectedCauldron.innerHTML = '<div class="empty-hint">尚未选择炉鼎，点击"从背包选择"添加</div>';
    } else {
        Elements.selectedCauldron.innerHTML = `
            <div class="selected-material-item" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2));">
                <span><i class="fas fa-fire-burner"></i> ${cauldron.name} ${cauldron.quantity ? `(${cauldron.quantity})` : ''}</span>
                <button onclick="removeSelectedCauldron()"><i class="fas fa-times"></i></button>
            </div>
        `;
    }
}

// 移除已选炉鼎
function removeSelectedCauldron() {
    AppState.alchemy.selectedCauldron = null;
    updateSelectedCauldronDisplay();
}

// 消耗炼丹材料
function consumeAlchemyMaterials() {
    const materials = AppState.alchemy.selectedMaterials;
    const inventory = AppState.gameState.inventory || [];

    materials.forEach(material => {
        const item = inventory.find(i => {
            const itemId = i.id || i.name;
            const matId = material.id || material.name;
            return itemId === matId;
        });

        if (item) {
            item.quantity = (item.quantity || 1) - 1;
            if (item.quantity <= 0) {
                // 从背包中移除数量为0的物品
                const index = inventory.indexOf(item);
                if (index > -1) {
                    inventory.splice(index, 1);
                }
            }
        }
    });

    // 清空已选材料
    AppState.alchemy.selectedMaterials = [];
    updateSelectedMaterialsDisplay();

    showMessage('材料已消耗', 'success');
}

// 移除炼丹材料
function removeAlchemyMaterial(itemId) {
    AppState.alchemy.selectedMaterials = AppState.alchemy.selectedMaterials.filter(m => m.id !== itemId);
    updateSelectedMaterialsDisplay();
}

// 开始炼丹
async function startAlchemy() {
    if (AppState.alchemy.isProcessing) {
        showMessage('炼制正在进行中...', 'info');
        return;
    }

    // 验证输入
    if (AppState.alchemy.mode === 'game') {
        if (AppState.alchemy.selectedMaterials.length === 0) {
            showMessage('请先选择炼丹材料', 'error');
            return;
        }
        if (!AppState.alchemy.selectedCauldron || !AppState.alchemy.selectedCauldron.name) {
            showMessage('请先选择炉鼎', 'error');
            return;
        }
    } else {
        if (!Elements.simHerbs || !Elements.simCauldron) {
            showMessage('模拟模式输入框不可用', 'error');
            return;
        }
        const herbs = Elements.simHerbs.value.trim();
        const cauldron = Elements.simCauldron.value.trim();
        if (!herbs || !cauldron) {
            showMessage('请输入药材和炉鼎名称', 'error');
            return;
        }
    }

    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }

    // 开始炼制
    AppState.alchemy.isProcessing = true;
    if (Elements.startAlchemyBtn) {
        Elements.startAlchemyBtn.disabled = true;
        Elements.startAlchemyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 炼制中...';
    }
    if (Elements.resultSection) Elements.resultSection.style.display = 'none';
    if (Elements.processSection) Elements.processSection.style.display = 'block';

    // 生成炼制过程
    await simulateAlchemyProcess();
}

// 模拟炼制过程
async function simulateAlchemyProcess() {
    if (!Elements.processLog || !Elements.progressFill || !Elements.progressText) return;

    Elements.processLog.innerHTML = '';
    Elements.progressFill.style.width = '0%';
    Elements.progressText.textContent = '开始炼制...';

    const steps = [
        { progress: 20, text: '投入材料...' },
        { progress: 40, text: '炉火升腾，药香渐浓...' },
        { progress: 60, text: '灵气汇聚，丹胎初成...' },
        { progress: 80, text: '凝练成型，丹药大成...' },
        { progress: 100, text: '炼制完成！' }
    ];

    for (const step of steps) {
        await sleep(1000);
        Elements.progressFill.style.width = step.progress + '%';
        Elements.progressText.textContent = step.text;

        const logItem = document.createElement('div');
        logItem.className = 'process-log-item';
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${step.text}`;
        Elements.processLog.appendChild(logItem);
        Elements.processLog.scrollTop = Elements.processLog.scrollHeight;
    }

    // 调用 AI 判定结果
    await generateAlchemyResult();
}

// 生成炼制结果
async function generateAlchemyResult() {
    let prompt = '';
    const durationHours = AppState.alchemy.duration;
    const fireLevel = FIRE_LEVELS[AppState.alchemy.fireLevel];

    if (AppState.alchemy.mode === 'game') {
        // 游戏模式
        const materials = AppState.alchemy.selectedMaterials.map(m => m.name).join('、');
        const cauldron = AppState.alchemy.selectedCauldron;
        if (!cauldron) {
            showMessage('请先选择炉鼎', 'error');
            return;
        }

        prompt = `你是一位修仙炼丹大师。请根据以下信息，生动地描述炼制过程，并判定炼制出了什么丹药：

【炼制材料】${materials}
【炉鼎品质】${cauldron.name}
【火候控制】${fireLevel.name}
【炼制时长】${durationHours}个时辰

请按以下格式返回：
1. 用2-3句话生动描述炼制过程中的异象（如火焰颜色、药香、天地灵气变化等）
2. 炼制结果（成功/失败/变异）
3. 如果成功，说明炼制出的丹药名称、品阶（下品/中品/上品/极品）、功效、使用方法；
   如果失败，说明失败原因；
   如果变异，说明变异后的奇特效果

要求：
- 描述要富有仙侠色彩
- 结果要有随机性和趣味性
- 根据材料数量、炉鼎品质、火候和时长综合考虑成功率
- 成功时必须给出明确的丹药名称`;
    } else {
        // 模拟模式
        if (!Elements.simHerbs || !Elements.simCauldron) {
            showMessage('模拟模式输入框不可用', 'error');
            return;
        }
        const herbs = Elements.simHerbs.value.trim();
        const cauldron = Elements.simCauldron.value.trim();
        const expectedPill = Elements.simExpectedPill ? Elements.simExpectedPill.value.trim() : '';
        const durationDesc = Elements.simDuration ? Elements.simDuration.value.trim() : '两个时辰';

        prompt = `你是一位修仙炼丹大师。请根据以下信息，生动地描述炼制过程，并判定炼制结果：

【炼制材料】${herbs}
【炉鼎名称】${cauldron}
${expectedPill ? `【期望丹药】${expectedPill}` : ''}
【炼制时长】${durationDesc}

请按以下格式返回：
1. 用3-4句话生动描述整个炼制过程（包括材料投炉、火焰变化、灵气反应、丹药成型等）
2. 炼制结果判定
3. 详细说明炼制出的丹药或失败/变异的原因

要求：
- 描述要富有仙侠色彩和画面感
- 根据材料搭配、炉鼎名称等因素进行合理判定
- 可以有一些意想不到的变异或意外`;
    }

    try {
        const response = await callOpenAI(prompt);
        currentAlchemyResult = response;
        displayAlchemyResult(response);

        // 判定是否成功，成功才显示保存配方和放入背包按钮，并消耗材料
        const isSuccess = response.includes('成功') && !response.includes('失败');

        // 游戏模式下，成功则消耗材料
        if (isSuccess && AppState.alchemy.mode === 'game') {
            consumeAlchemyMaterials();
        }

        // 更新统计
        AppState.alchemy.stats.totalCount++;
        if (isSuccess) {
            AppState.alchemy.stats.successCount++;
        }
        saveAlchemySettings();

        // 显示/隐藏保存配方和放入背包按钮
        Elements.saveFormulaBtn.style.display = isSuccess ? 'inline-flex' : 'none';
        if (Elements.addPillToInventoryBtn) {
            Elements.addPillToInventoryBtn.style.display = isSuccess ? 'inline-flex' : 'none';
        }

    } catch (error) {
        console.error('炼制失败:', error);
        showMessage(`炼制失败: ${error.message}`, 'error');
        displayAlchemyResult('炼制失败：' + error.message);
        currentAlchemyResult = null;
        Elements.saveFormulaBtn.style.display = 'none';
        if (Elements.addPillToInventoryBtn) {
            Elements.addPillToInventoryBtn.style.display = 'none';
        }
    } finally {
        AppState.alchemy.isProcessing = false;
        Elements.startAlchemyBtn.disabled = false;
        Elements.startAlchemyBtn.innerHTML = '<i class="fas fa-fire"></i> 开始炼丹';
        Elements.processSection.style.display = 'none';
        updateAlchemyStats();
    }
}

// 显示炼制结果
function displayAlchemyResult(result) {
    if (Elements.processSection) Elements.processSection.style.display = 'none';
    if (Elements.resultSection) Elements.resultSection.style.display = 'block';

    // 简单解析结果来设置图标和标题
    const lines = result.split('\n').filter(l => l.trim());
    const title = lines.find(l => l.includes('丹药') || l.includes('结果') || l.includes('名称')) || '炼制完成';
    const desc = result;

    // 根据结果类型设置图标
    let icon = 'fa-question';
    if (result.includes('成功') && !result.includes('失败')) {
        icon = 'fa-check-circle';
        if (Elements.resultQuality) Elements.resultQuality.innerHTML = '<span class="quality-badge" data-quality="success">炼制成功</span>';
    } else if (result.includes('失败')) {
        icon = 'fa-times-circle';
        if (Elements.resultQuality) Elements.resultQuality.innerHTML = '<span class="quality-badge" data-quality="failed">炼制失败</span>';
    } else if (result.includes('变异')) {
        icon = 'fa-magic';
        if (Elements.resultQuality) Elements.resultQuality.innerHTML = '<span class="quality-badge" data-quality="variant">丹药变异</span>';
    } else {
        if (Elements.resultQuality) Elements.resultQuality.innerHTML = '<span class="quality-badge" data-quality="unknown">未知结果</span>';
    }

    if (Elements.resultIcon) Elements.resultIcon.innerHTML = `<i class="fas ${icon}"></i>`;
    if (Elements.resultTitle) Elements.resultTitle.textContent = title.substring(0, 50);
    if (Elements.resultDesc) Elements.resultDesc.textContent = desc;

    // 滚动到结果区域
    if (Elements.resultSection) Elements.resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 重置炼丹界面
function resetAlchemyUI() {
    if (Elements.resultSection) Elements.resultSection.style.display = 'none';
    if (Elements.processSection) Elements.processSection.style.display = 'none';
    currentAlchemyResult = null;
    if (Elements.saveFormulaBtn) Elements.saveFormulaBtn.style.display = 'none';
    if (Elements.addPillToInventoryBtn) Elements.addPillToInventoryBtn.style.display = 'none';

    if (AppState.alchemy.mode === 'game') {
        AppState.alchemy.selectedMaterials = [];
        AppState.alchemy.selectedCauldron = null;
        updateSelectedMaterialsDisplay();
        updateSelectedCauldronDisplay();
    } else {
        if (Elements.simHerbs) Elements.simHerbs.value = '';
        if (Elements.simCauldron) Elements.simCauldron.value = '';
        if (Elements.simExpectedPill) Elements.simExpectedPill.value = '';
        if (Elements.simDuration) Elements.simDuration.value = '';
    }

    showMessage('已重置炼丹炉', 'info');
}

// 保存配方
function saveFormula() {
    if (!currentAlchemyResult) {
        showMessage('没有可保存的配方', 'warning');
        return;
    }

    // 检查是否可以保存（游戏模式或作弊模式）
    if (AppState.alchemy.mode !== 'game' && AppState.settings.alchemyCheatMode !== 'enabled') {
        showMessage('模拟模式下无法保存配方（可开启作弊模式）', 'warning');
        return;
    }

    if (AppState.alchemy.mode === 'game') {
        const materials = AppState.alchemy.selectedMaterials;
        const cauldron = AppState.alchemy.selectedCauldron;

        // 从AI结果中提取丹药名称
        const pillNameMatch = currentAlchemyResult.match(/(?:丹药名称|名称)[：:]\s*([^\n，。]+)/);
        const pillName = pillNameMatch ? pillNameMatch[1].trim() : '未知丹药';

        // 提取品质
        const qualityMatch = currentAlchemyResult.match(/([下中上极]品)/);
        const quality = qualityMatch ? qualityMatch[1] : '未知';

        const formula = {
            id: Date.now().toString(),
            name: pillName,
            quality: quality,
            materials: materials.map(m => m.name),
            cauldron: cauldron.name,
            fireLevel: FIRE_LEVELS[AppState.alchemy.fireLevel].name,
            duration: AppState.alchemy.duration,
            createdAt: new Date().toISOString()
        };

        // 检查是否已存在相同配方
        const exists = AppState.alchemy.formulas.some(f =>
            f.name === formula.name &&
            f.materials.length === formula.materials.length &&
            f.materials.every(m => formula.materials.includes(m))
        );

        if (exists) {
            showMessage('该配方已存在', 'warning');
            return;
        }

        AppState.alchemy.formulas.push(formula);
        saveAlchemySettings();
        loadSavedFormulas();

        // 显示保存成功提示
        Elements.formulaSavedToast.style.display = 'flex';
        setTimeout(() => {
            Elements.formulaSavedToast.style.display = 'none';
        }, 3000);

        showMessage('配方已保存' + (AppState.settings.alchemyCheatMode === 'enabled' ? ' (作弊模式)' : ''), 'success');
    } else if (AppState.alchemy.mode === 'simulation' && AppState.settings.alchemyCheatMode === 'enabled') {
        // 模拟模式 + 作弊模式：从输入框提取信息保存配方
        if (!Elements.simHerbs || !Elements.simCauldron) {
            showMessage('无法提取模拟模式信息', 'error');
            return;
        }

        const herbs = Elements.simHerbs.value.trim();
        const cauldron = Elements.simCauldron.value.trim();
        const durationDesc = Elements.simDuration ? Elements.simDuration.value.trim() : '两个时辰';

        // 从AI结果中提取丹药名称
        const pillNameMatch = currentAlchemyResult.match(/(?:丹药名称|名称)[：:]\s*([^\n，。]+)/);
        const pillName = pillNameMatch ? pillNameMatch[1].trim() : '未知丹药';

        // 提取品质
        const qualityMatch = currentAlchemyResult.match(/([下中上极]品)/);
        const quality = qualityMatch ? qualityMatch[1] : '未知';

        const formula = {
            id: Date.now().toString(),
            name: pillName,
            quality: quality,
            materials: herbs.split(/[、，,]/).map(m => m.trim()).filter(m => m),
            cauldron: cauldron,
            fireLevel: '温火', // 模拟模式默认
            duration: durationDesc,
            createdAt: new Date().toISOString()
        };

        AppState.alchemy.formulas.push(formula);
        saveAlchemySettings();
        loadSavedFormulas();

        showMessage('配方已保存 (作弊模式 - 模拟)', 'success');
    }
}

// 丹药放入背包
function addPillToInventory() {
    if (!currentAlchemyResult) {
        showMessage('没有可放入的丹药', 'warning');
        return;
    }

    // 检查是否可以放入背包（游戏模式或作弊模式）
    if (AppState.alchemy.mode !== 'game' && AppState.settings.alchemyCheatMode !== 'enabled') {
        showMessage('模拟模式下无法将丹药放入背包（可开启作弊模式）', 'warning');
        return;
    }

    // 从AI结果中提取丹药信息
    const pillNameMatch = currentAlchemyResult.match(/(?:丹药名称|名称)[：:]\s*([^\n，。]+)/);
    const qualityMatch = currentAlchemyResult.match(/([下中上极]品)/);
    const effectMatch = currentAlchemyResult.match(/功效[：:]\s*([^\n]+)/);

    const pillName = pillNameMatch ? pillNameMatch[1].trim() : '神秘丹药';
    const quality = qualityMatch ? qualityMatch[1] : '未知品阶';
    const effect = effectMatch ? effectMatch[1].trim() : '未知功效';

    const pill = {
        id: Date.now().toString(),
        name: pillName,
        type: 'consumable',
        description: `${quality}丹药，${effect}`,
        stats: {},
        quantity: 1
    };

    // 添加到背包
    if (!AppState.gameState.inventory) {
        AppState.gameState.inventory = [];
    }

    // 检查背包中是否已有同类丹药
    const existingPill = AppState.gameState.inventory.find(item =>
        item.name === pillName && item.type === 'consumable'
    );

    if (existingPill) {
        existingPill.quantity += 1;
    } else {
        AppState.gameState.inventory.push(pill);
    }

    const cheatModeText = AppState.alchemy.mode !== 'game' ? ' (作弊模式)' : '';
    showMessage(`已将 ${pillName} 放入背包${cheatModeText}`, 'success');
    Elements.addPillToInventoryBtn.style.display = 'none';
}

// 使用配方
function useFormula(formulaId) {
    const formula = AppState.alchemy.formulas.find(f => f.id === formulaId);
    if (!formula) return;

    // 设置参数
    AppState.alchemy.fireLevel = 'wen'; // 默认文火
    AppState.alchemy.duration = formula.duration || 2;

    // 从背包查找材料并选择
    const materials = [];
    const inventory = AppState.gameState.inventory || [];

    for (const materialName of formula.materials) {
        const item = inventory.find(i => i.name === materialName && (i.quantity || 1) > 0);
        if (item) {
            materials.push({ id: item.id || materialName, name: materialName, ...item });
        }
    }

    if (materials.length < formula.materials.length) {
        showMessage('背包中缺少配方所需材料', 'warning');
        return;
    }

    AppState.alchemy.selectedMaterials = materials;
    updateSelectedMaterialsDisplay();

    // 查找炉鼎
    const cauldron = inventory.find(i => i.name === formula.cauldron && i.type === 'cauldron');
    if (cauldron) {
        AppState.alchemy.selectedCauldron = cauldron;
        updateSelectedCauldronDisplay();
    } else {
        showMessage(`背包中缺少炉鼎: ${formula.cauldron}`, 'warning');
    }

    showMessage(`已应用配方: ${formula.name}`, 'success');

    // 滚动到炼丹按钮
    Elements.startAlchemyBtn.scrollIntoView({ behavior: 'smooth' });
}

// 删除配方
function deleteFormula(formulaId) {
    if (confirm('确定要删除这个配方吗？')) {
        AppState.alchemy.formulas = AppState.alchemy.formulas.filter(f => f.id !== formulaId);
        saveAlchemySettings();
        loadSavedFormulas();
        showMessage('配方已删除', 'success');
    }
}

// 更新炼丹统计
function updateAlchemyStats() {
    if (Elements.alchemyCount) Elements.alchemyCount.textContent = AppState.alchemy.stats.totalCount;

    const rate = AppState.alchemy.stats.totalCount > 0
        ? Math.round((AppState.alchemy.stats.successCount / AppState.alchemy.stats.totalCount) * 100)
        : 0;
    if (Elements.alchemyRate) Elements.alchemyRate.textContent = rate + '%';
    if (Elements.formulaCount) Elements.formulaCount.textContent = AppState.alchemy.formulas.length;
    if (Elements.formulaCountDisplay) Elements.formulaCountDisplay.textContent = AppState.alchemy.formulas.length;
}

// 保存炼丹设置
function saveAlchemySettings() {
    const settings = {
        mode: AppState.alchemy.mode,
        formulas: AppState.alchemy.formulas,
        stats: AppState.alchemy.stats
    };
    localStorage.setItem('alchemy_settings', JSON.stringify(settings));
}

// 加载保存的配方
function loadSavedFormulas() {
    try {
        const settings = JSON.parse(localStorage.getItem('alchemy_settings') || '{}');
        if (settings.formulas && settings.formulas.length > 0) {
            AppState.alchemy.formulas = settings.formulas;
            if (Elements.formulaGrid) {
                Elements.formulaGrid.innerHTML = AppState.alchemy.formulas.map(f => `
                    <div class="formula-card" data-formula="${f.id}" onclick="useFormula('${f.id}')">
                        <div class="formula-icon"><i class="fas fa-flask"></i></div>
                        <h4>${f.name} <span style="font-size: 0.8rem; color: #f59e0b;">(${f.quality})</span></h4>
                        <p>材料: ${f.materials.join(', ')}</p>
                        <p style="font-size: 0.8rem; color: #94a3b8;">炉鼎: ${f.cauldron} | ${f.fireLevel}</p>
                        <button class="delete-formula-btn" onclick="event.stopPropagation(); deleteFormula('${f.id}')" style="position: absolute; top: 8px; right: 8px; background: #f43f5e; border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
                if (Elements.formulaEmpty) Elements.formulaEmpty.style.display = 'none';
            }
        } else {
            if (Elements.formulaGrid) {
                Elements.formulaGrid.innerHTML = `
                    <div class="formula-empty" id="formula-empty">
                        <i class="fas fa-scroll"></i>
                        <p>暂无配方，炼制成功后可保存配方</p>
                    </div>
                `;
            }
        }
        if (settings.stats) {
            AppState.alchemy.stats = settings.stats;
        }
    } catch (error) {
        console.error('加载炼丹设置失败:', error);
    }
}

// 辅助函数：延时
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}