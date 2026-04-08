// 狼人杀AI增强模块 - 提供智能AI决策和游戏体验优化
// 版本: 1.0.0
// 作者: Claude AI

// ==================== AI角色管理系统 ====================

// AI角色定义
const AICharacter = {
    // 智能程度
    INTELLIGENCE_LEVELS: {
        BEGINNER: 0,     // 初级 - 随机决策
        INTERMEDIATE: 1, // 中级 - 基础策略
        ADVANCED: 2,     // 高级 - 复杂推理
        EXPERT: 3        // 专家 - 深度思考
    },

    // AI个性特征
    PERSONALITY_TRAITS: {
        AGGRESSIVE: { name: '激进', wolfKillChance: 0.8, humanProtectChance: 0.2 },
        CAUTIOUS: { name: '谨慎', wolfKillChance: 0.5, humanProtectChance: 0.7 },
        CHARMING: { name: '魅惑', wolfKillChance: 0.6, humanProtectChance: 0.5 },
        LOGICAL: { name: '理性', wolfKillChance: 0.7, humanProtectChance: 0.6 },
        RANDOM: { name: '随机', wolfKillChance: 0.5, humanProtectChance: 0.5 }
    },

    // AI说话风格
    SPEAKING_STYLES: {
        FORMAL: '正式',
        CASUAL: '随意',
        EMOTIONAL: '情绪化',
        LOGICAL: '逻辑性强',
        MYSTERIOUS: '神秘'
    }
};

// AI角色类
class AIAgent {
    constructor(name, role, intelligence = AICharacter.INTELLIGENCE_LEVELS.INTERMEDIATE) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.role = role;
        this.alive = true;
        this.intelligence = intelligence;
        this.personality = this.getRandomPersonality();
        this.speakingStyle = this.getRandomSpeakingStyle();
        this.memory = new AIMemory();
        this.trustLevels = new Map();
        this.suspicionLevels = new Map();
        this.strategy = new AIStrategy(this);
    }

    getRandomPersonality() {
        const personalities = Object.values(AICharacter.PERSONALITY_TRAITS);
        return personalities[Math.floor(Math.random() * personalities.length)];
    }

    getRandomSpeakingStyle() {
        const styles = Object.values(AICharacter.SPEAKING_STYLES);
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // AI思考过程
    async think(gameState) {
        if (!this.alive) return null;

        // 记忆当前游戏状态
        this.memory.remember(gameState);

        // 分析当前局势
        const analysis = await this.analyzeSituation(gameState);

        // 制定策略
        const strategy = this.strategy.makeDecision(analysis);

        // 生成对话
        const dialogue = await this.generateDialogue(gameState, analysis, strategy);

        return {
            analysis,
            strategy,
            dialogue,
            trustLevels: this.trustLevels,
            suspicionLevels: this.suspicionLevels
        };
    }

    // 分析局势
    async analyzeSituation(gameState) {
        const analysis = {
            round: gameState.round,
            playersAlive: gameState.players.filter(p => p.alive).length,
            wolvesAlive: gameState.players.filter(p => p.alive && p.role === '狼人').length,
            villagersAlive: gameState.players.filter(p => p.alive && p.role === '村民').length,
            specialRolesAlive: gameState.players.filter(p => p.alive && isSpecialRole(p.role)).length,

            // 推测身份
            suspectedWolves: [],
            suspectedVillagers: [],
            suspiciousActions: [],

            // 评估局势
            riskLevel: this.calculateRiskLevel(gameState),
            winProbability: this.calculateWinProbability(gameState),

            // 历史分析
            votingHistory: this.memory.getVotingHistory(),
            speechPatterns: this.memory.getSpeechPatterns()
        };

        // 根据智能程度分析
        switch (this.intelligence) {
            case AICharacter.INTELLIGENCE_LEVELS.BEGINNER:
                analysis.suspectedWolves = this.guessRandomPlayers(3);
                break;
            case AICharacter.INTELLIGENCE_LEVELS.INTERMEDIATE:
                analysis.suspectedWolves = await this.analyzeVotingPatterns(gameState);
                analysis.suspiciousActions = this.findSuspiciousActions(gameState);
                break;
            case AICharacter.INTELLIGENCE_LEVELS.ADVANCED:
                analysis.suspectedWolves = await this.analyzeBehavioralPatterns(gameState);
                analysis.suspiciousActions = this.findSuspiciousActions(gameState);
                analysis.trustedPlayers = await this.findTrustedPlayers(gameState);
                break;
            case AICharacter.INTELLIGENCE_LEVELS.EXPERT:
                analysis.suspectedWolves = await this.deepAnalysis(gameState);
                analysis.networkAnalysis = this.analyzePlayerNetwork(gameState);
                break;
        }

        return analysis;
    }

    // 计算风险等级
    calculateRiskLevel(gameState) {
        const wolvesAlive = gameState.players.filter(p => p.alive && p.role === '狼人').length;
        const totalAlive = gameState.players.filter(p => p.alive).length;

        if (this.role === '狼人') {
            // 狼人视角：狼人数量越多风险越低
            return wolvesAlive / totalAlive;
        } else {
            // 村民视角：狼人比例越高风险越高
            return wolvesAlive / totalAlive;
        }
    }

    // 计算胜率
    calculateWinProbability(gameState) {
        const wolvesAlive = gameState.players.filter(p => p.alive && p.role === '狼人').length;
        const villagersAlive = gameState.players.filter(p => p.alive && p.role === '村民').length;
        const totalAlive = wolvesAlive + villagersAlive;

        if (this.role === '狼人') {
            // 狼人胜率：狼人数量 > 村民数量 * 0.5
            return wolvesAlive > villagersAlive * 0.5 ? 0.8 : 0.3;
        } else {
            // 村民胜率：狼人数量较少时胜率高
            return wolvesAlive < villagersAlive * 0.3 ? 0.9 : 0.4;
        }
    }

    // 分析投票模式
    async analyzeVotingPatterns(gameState) {
        const suspected = [];
        const votingHistory = this.memory.getVotingHistory();

        // 找出总是跟风投票的玩家
        const followers = this.findFollowers(votingHistory);
        suspected.push(...followers);

        // 找出从不投票的玩家
        const abstainers = this.findAbstainers(votingHistory);
        suspected.push(...abstainers);

        return suspected.slice(0, 3);
    }

    // 查找可疑行为
    findSuspiciousActions(gameState) {
        const suspicious = [];

        // 检查快速投票
        const fastVotes = gameState.votes.filter(v =>
            v.timestamp - gameState.roundStartTime < 5000
        );
        suspicious.push(...fastVotes.map(v => v.voterId));

        // 检查重复投票模式
        const repetitiveVoters = this.findRepetitiveVoters(gameState.votes);
        suspicious.push(...repetitiveVoters);

        return [...new Set(suspicious)];
    }

    // 生成AI对话
    async generateDialogue(gameState, analysis, strategy) {
        const dialogues = {
            FORMAL: [
                '我认为我们需要更仔细地分析每个人的发言。',
                '根据之前的投票记录，我注意到一些可疑的模式。',
                '大家是否考虑过，真正的狼人可能隐藏得很好？'
            ],
            CASUAL: [
                '喂，我觉得那个人有点怪怪的。',
                '你们说要不要投他试试？',
                '反正我觉得狼人就在我们中间。'
            ],
            EMOTIONAL: [
                '我真的很担心！我们要小心啊！',
                '天啊，这个人太可疑了！',
                '我必须说出我的怀疑！'
            ],
            LOGICAL: [
                '基于逻辑分析，我倾向于相信X号玩家是好人。',
                '从概率角度看，Y号玩家有更高的嫌疑。',
                '我们需要更多的信息来做决定。'
            ],
            MYSTERIOUS: [
                '有些事情，表面上看不出来...',
                '真相往往隐藏在细节之中。',
                '你们注意到什么异常了吗？'
            ]
        };

        const styleDialogues = dialogues[this.speakingStyle] || dialogues.CASUAL;

        // 根据策略调整对话内容
        let finalDialogue = styleDialogues[Math.floor(Math.random() * styleDialogues.length)];

        if (strategy.aggressive && this.role === '狼人') {
            finalDialogue = '我强烈建议投票给' + this.suspicionLevels.getHighest() + '！';
        } else if (strategy.caution && this.role === '村民') {
            finalDialogue = '我们应该更加小心，避免误伤好人。';
        }

        return finalDialogue;
    }
}

// AI记忆系统
class AIMemory {
    constructor() {
        this.memories = [];
        this.maxMemories = 50;
    }

    remember(gameState) {
        const memory = {
            timestamp: Date.now(),
            round: gameState.round,
            events: [],
            players: gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role,
                alive: p.alive,
                suspicionLevel: p.suspicionLevel || 0
            }))
        };

        // 记录关键事件
        if (gameState.lastEliminated) {
            memory.events.push({
                type: 'elimination',
                playerId: gameState.lastEliminated.id,
                playerRole: gameState.lastEliminated.role,
                votes: gameState.lastEliminated.votes || []
            });
        }

        this.memories.push(memory);

        // 保持记忆数量限制
        if (this.memories.length > this.maxMemories) {
            this.memories.shift();
        }
    }

    getVotingHistory() {
        return this.memories.flatMap(m => m.events)
            .filter(e => e.type === 'elimination')
            .map(e => e.votes);
    }

    getSpeechPatterns() {
        // 这里可以存储和分析玩家的发言模式
        return [];
    }
}

// AI策略系统
class AIStrategy {
    constructor(agent) {
        this.agent = agent;
        this.decisionHistory = [];
    }

    makeDecision(analysis) {
        const decision = {
            action: 'vote',
            target: null,
            reason: '',
            confidence: 0,
            aggressive: false,
            caution: false
        };

        switch (this.agent.role) {
            case '狼人':
                decision = this.wolfStrategy(analysis);
                break;
            case '村民':
                decision = this.villagerStrategy(analysis);
                break;
            case '预言家':
                decision = this.seerStrategy(analysis);
                break;
            case '女巫':
                decision = this.witchStrategy(analysis);
                break;
            case '猎人':
                decision = this.hunterStrategy(analysis);
                break;
        }

        this.decisionHistory.push(decision);
        return decision;
    }

    // 狼人策略
    wolfStrategy(analysis) {
        const decision = {
            action: 'vote',
            target: null,
            reason: '',
            confidence: 0,
            aggressive: this.agent.personality.wolfKillChance > 0.6,
            caution: false
        };

        // 寻找目标
        const targets = analysis.suspectedVillagers || analysis.suspectedWolves;

        if (targets.length > 0) {
            // 优先投票给特殊角色（如果知道的话）
            const specialTargets = targets.filter(id =>
                analysis.playersAlive.find(p => p.id === id && isSpecialRole(p.role))
            );

            if (specialTargets.length > 0) {
                decision.target = specialTargets[0];
                decision.reason = '优先消灭特殊角色';
            } else {
                decision.target = targets[0];
                decision.reason = '减少威胁';
            }
            decision.confidence = 0.8;
        }

        return decision;
    }

    // 村民策略
    villagerStrategy(analysis) {
        const decision = {
            action: 'vote',
            target: null,
            reason: '',
            confidence: 0,
            aggressive: false,
            caution: this.agent.personality.humanProtectChance > 0.5
        };

        // 基于分析选择投票目标
        const suspectedWolves = analysis.suspectedWolves.filter(id =>
            this.agent.suspicionLevels.get(id) > 0.5
        );

        if (suspectedWolves.length > 0) {
            decision.target = suspectedWolves[0];
            decision.reason = '高度可疑';
            decision.confidence = 0.7;
        } else {
            // 随机选择
            const alivePlayers = analysis.playersAlive.filter(p => p.id !== this.agent.id);
            if (alivePlayers.length > 0) {
                decision.target = alivePlayers[0].id;
                decision.reason = '随机选择';
                decision.confidence = 0.3;
            }
        }

        return decision;
    }

    // 预言家策略
    seerStrategy(analysis) {
        const decision = {
            action: 'check',
            target: null,
            reason: '',
            confidence: 0.9,
            aggressive: false,
            caution: true
        };

        // 选择要查验的玩家
        const suspiciousPlayers = analysis.suspectedWolves.filter(id =>
            !this.agent.memory.hasChecked(id)
        );

        if (suspiciousPlayers.length > 0) {
            decision.target = suspiciousPlayers[0];
            decision.reason = '查验可疑玩家';
        } else {
            // 随机选择未查验过的玩家
            const uncheckedPlayers = analysis.playersAlive.filter(p =>
                !this.agent.memory.hasChecked(p.id) && p.id !== this.agent.id
            );
            if (uncheckedPlayers.length > 0) {
                decision.target = uncheckedPlayers[0].id;
                decision.reason = '收集更多信息';
            }
        }

        return decision;
    }

    // 女巫策略
    witchStrategy(analysis) {
        const decision = {
            action: 'save' | 'poison',
            target: null,
            reason: '',
            confidence: 0,
            aggressive: false,
            caution: true
        };

        // 根据情况决定是否使用药水
        if (analysis.riskLevel > 0.7) {
            decision.action = 'save';
            decision.reason = '高风险情况，使用解药';
            decision.confidence = 0.8;
        } else if (analysis.suspectedWolves.length > 0) {
            decision.action = 'poison';
            decision.target = analysis.suspectedWolves[0];
            decision.reason = '消灭可疑的狼人';
            decision.confidence = 0.6;
        }

        return decision;
    }

    // 猎人策略
    hunterStrategy(analysis) {
        const decision = {
            action: 'vote',
            target: null,
            reason: '',
            confidence: 0,
            aggressive: false,
            caution: true
        };

        // 如果自己死亡，可以选择带走一个怀疑的对象
        const suspiciousWolves = analysis.suspectedWolves.filter(id =>
            this.agent.suspicionLevels.get(id) > 0.6
        );

        if (suspiciousWolves.length > 0) {
            decision.target = suspiciousWolves[0];
            decision.reason = '死后带走狼人';
            decision.confidence = 0.8;
        }

        return decision;
    }
}

// ==================== AI决策辅助工具 ====================

// 玩家网络分析
class PlayerNetworkAnalyzer {
    constructor() {
        this.network = new Map();
    }

    // 分析玩家关系网络
    analyze(gameState) {
        // 构建投票关系图
        const votingGraph = this.buildVotingGraph(gameState.votes);

        // 识别派系
        const factions = this.identifyFactions(votingGraph);

        // 发现异常连接
        const suspiciousConnections = this.findSuspiciousConnections(votingGraph);

        return {
            votingGraph,
            factions,
            suspiciousConnections
        };
    }

    buildVotingGraph(votes) {
        const graph = new Map();

        votes.forEach(vote => {
            if (!graph.has(vote.voterId)) {
                graph.set(vote.voterId, new Set());
            }
            graph.get(vote.voterId).add(vote.targetId);
        });

        return graph;
    }

    identifyFactions(graph) {
        // 使用聚类算法识别可能的派系
        const factions = [];
        const visited = new Set();

        graph.forEach((targets, playerId) => {
            if (!visited.has(playerId)) {
                const faction = this.findCluster(playerId, graph);
                factions.push(faction);
                faction.forEach(id => visited.add(id));
            }
        });

        return factions;
    }

    findSuspiciousConnections(graph) {
        const suspicious = [];

        // 查找不寻常的投票模式
        graph.forEach((targets, playerId) => {
            // 如果玩家总是投票给同一个人
            if (targets.size === 1 && [...targets][0] === playerId) {
                suspicious.push({
                    playerId,
                    type: 'self_voter',
                    reason: '总是投给自己'
                });
            }

            // 如果玩家投票模式突变
            if (this.hasVotingPatternChanged(playerId, graph)) {
                suspicious.push({
                    playerId,
                    type: 'inconsistent_voter',
                    reason: '投票模式不一致'
                });
            }
        });

        return suspicious;
    }
}

// AI说话生成器
class DialogueGenerator {
    constructor() {
        this.templates = {
            accusation: [
                '我觉得{player}很可疑！',
                '我怀疑{player}是狼人。',
                '{player}的行为让我感到不安。',
                '大家注意看{player}的表现！'
            ],
            defense: [
                '我不是狼人！请大家相信我！',
                '我一直在努力帮助好人阵营。',
                '我的投票都是有根据的。',
                '如果我是狼人，我早就做其他事了。'
            ],
            reasoning: [
                '基于之前的投票记录，我认为...',
                '从逻辑上讲，最可能的是...',
                '让我们分析一下每个人的表现...',
                '我觉得我们应该...'
            ],
            uncertainty: [
                '我不是很确定，但...',
                '也许我们应该再考虑一下...',
                '我只是有一个想法...',
                '大家觉得怎么样？'
            ]
        };
    }

    generateDialogue(situation, aiPersonality) {
        let templateKey;

        switch (situation.type) {
            case 'accuse':
                templateKey = 'accusation';
                break;
            case 'defend':
                templateKey = 'defense';
                break;
            case 'reason':
                templateKey = 'reasoning';
                break;
            default:
                templateKey = 'uncertainty';
        }

        const templates = this.templates[templateKey];
        const template = templates[Math.floor(Math.random() * templates.length)];

        return template.replace('{player}', situation.target || '某人');
    }
}

// ==================== AI控制接口 ====================

// AI控制器
class AIController {
    constructor() {
        this.agents = new Map();
        this.dialogueGenerator = new DialogueGenerator();
        this.networkAnalyzer = new PlayerNetworkAnalyzer();
    }

    // 创建AI玩家
    createAIPlayer(name, role, intelligence = 1) {
        const agent = new AIAgent(name, role, intelligence);
        this.agents.set(agent.id, agent);
        return agent;
    }

    // 获取AI决策
    async getAIDecision(agentId, gameState) {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error('AI agent not found');

        return await agent.think(gameState);
    }

    // 获取AI对话
    getAIDialogue(agentId, gameState, situation) {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error('AI agent not found');

        return this.dialogueGenerator.generateDialogue(situation, agent.personality);
    }

    // 更新AI信任度
    updateTrustLevels(agentId, trustChanges) {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        trustChanges.forEach(change => {
            const current = agent.trustLevels.get(change.playerId) || 0;
            agent.trustLevels.set(change.playerId, Math.max(0, Math.min(1, current + change.change)));
        });
    }

    // 更新AI怀疑度
    updateSuspicionLevels(agentId, suspicionChanges) {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        suspicionChanges.forEach(change => {
            const current = agent.suspicionLevels.get(change.playerId) || 0;
            agent.suspicionLevels.set(change.playerId, Math.max(0, Math.min(1, current + change.change)));
        });
    }
}

// 初始化AI控制器
const aiController = new AIController();

// 导出到全局
window.WerewolfAI = {
    AICharacter,
    AIAgent,
    AIMemory,
    AIStrategy,
    PlayerNetworkAnalyzer,
    DialogueGenerator,
    AIController: aiController
};

// 工具函数
function isSpecialRole(role) {
    return ['预言家', '女巫', '猎人', '长老', '禁言长老', '摄梦人', '魔术师', '骑士', '白狼王', '狼美人'].includes(role);
}

// 查找跟随者
function findFollowers(votingHistory) {
    // 实现跟随者检测逻辑
    return [];
}

// 查找弃权者
function findAbstainers(votingHistory) {
    // 实现弃权者检测逻辑
    return [];
}

// 查找重复投票者
function findRepetitiveVoters(votes) {
    // 实现重复投票检测逻辑
    return [];
}

// 深度分析
async function deepAnalysis(gameState) {
    // 实现深度分析逻辑
    return [];
}

// 查找集群
function findCluster(playerId, graph) {
    // 实现聚类逻辑
    return new Set([playerId]);
}

// 检查投票模式变化
function hasVotingPatternChanged(playerId, graph) {
    // 实现投票模式变化检测
    return false;
}