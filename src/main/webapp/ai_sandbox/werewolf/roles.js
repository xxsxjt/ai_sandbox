// 狼人杀高级角色能力系统
class RoleAbilitySystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // ============= 守卫阵营能力 =============

    // 长老 - 被投票时存活，需二次投票
    elderSurvive(player) {
        if (player.role === 'elder') {
            this.gameState.elderLivedOnce = true;
            this.gameState.systemMessages.push(`长老${player.name}被投票出局，但长老身份发动，再次存活！`);
            return true;
        }
        return false;
    }

    // 禁言长老 - 禁言指定玩家一天
    elderSilencer(target) {
        if (!this.gameState.silenced) {
            this.gameState.silenced = target.name;
            this.gameState.systemMessages.push(`禁言长老禁言了${target.name}，${target.name}本天无法发言`);
            return true;
        }
        return false;
    }

    // 骑士 - 每天可选择守护一人
    knightProtect(target) {
        this.gameState.knightProtected = target.name;
        this.gameState.systemMessages.push(`骑士选择守护${target.name}，${target.name}今天免受狼击`);
        return true;
    }

    // ============= 狼人阵营能力 =============

    // 白狼王 - 自爆带走一人
    whiteWolfKingSuicide(target) {
        const player = this.gameState.players.find(p => p.name === target);
        if (player && player.role === 'whiteWolfKing') {
            this.gameState.systemMessages.push(`白狼王${target}自爆，带走了${this.gameState.wolfTarget || '未知玩家'}！`);
            this.gameState.whiteWolfKingKilled = true;
            return true;
        }
        return false;
    }

    // 狼美人 - 击败目标后获得护身符
    wolfBeautyKill(target) {
        const player = this.gameState.players.find(p => p.name === target);
        if (player && player.role === 'wolfBeauty') {
            this.gameState.wolfBeautyAlive = true;
            this.gameState.systemMessages.push(`狼美人${target}击败了目标，获得了护身符！`);
            return true;
        }
        return false;
    }

    // ============= 中立阵营能力 =============

    // 摄梦人 - 修改投票目标
    dreamEaterModifyVote(originalTarget, newTarget) {
        if (this.gameState.dreamEaterUsed) return false;

        this.gameState.dreamEaterUsed = true;
        this.gameState.voteOverride = { original: originalTarget, new: newTarget };
        this.gameState.systemMessages.push(`摄梦人发动能力，将投票从${originalTarget}改为${newTarget}！`);
        return true;
    }

    // 魔术师 - 复活一人
    magicianRevive(target) {
        const player = this.gameState.players.find(p => p.name === target);
        if (player && player.dead) {
            player.dead = false;
            player.revived = true;
            this.gameState.systemMessages.push(`魔术师复活了${target}！`);
            return true;
        }
        return false;
    }

    // ============= 夜晚行动系统 =============

    // 执行夜晚行动
    async executeNightActions() {
        const nightActions = this.gameState.nightActions || [];

        // 验证行动的合理性
        for (const action of nightActions) {
            this.validateNightAction(action);
        }

        // 按角色优先级执行
        await this.executeByPriority(nightActions);
    }

    // 验证夜晚行动
    validateNightAction(action) {
        const actor = this.gameState.players.find(p => p.name === action.actor);
        if (!actor || actor.dead) {
            throw new Error(`${action.actor}已死亡，无法行动`);
        }

        if (this.gameState.silenced === actor.name) {
            throw new Error(`${actor.name}被禁言，无法行动`);
        }

        // 特殊角色限制
        if (actor.role === 'elder' && this.gameState.elderLivedOnce) {
            throw new Error('长老已经被触发过，今晚无法行动');
        }
    }

    // 按优先级执行行动
    async executeByPriority(actions) {
        const priority = ['knight', 'seer', 'witch', 'hunter', 'elder', 'silencer', 'magician', 'dreamEater', 'wolf'];

        for (const role of priority) {
            const roleActions = actions.filter(a => this.getRoleByPlayer(a.actor) === role);
            if (roleActions.length > 0) {
                await this.executeRoleActions(role, roleActions);
            }
        }
    }

    // 执行特定角色的行动
    async executeRoleActions(role, actions) {
        switch (role) {
            case 'wolf':
                await this.executeWolfActions(actions);
                break;
            case 'seer':
                await this.executeSeerActions(actions);
                break;
            case 'witch':
                await this.executeWitchActions(actions);
                break;
            case 'hunter':
                await this.executeHunterActions(actions);
                break;
            case 'knight':
                await this.executeKnightActions(actions);
                break;
            case 'elder':
                await this.executeElderActions(actions);
                break;
            case 'silencer':
                await this.executeSilencerActions(actions);
                break;
            case 'magician':
                await this.executeMagicianActions(actions);
                break;
            case 'dreamEater':
                await this.executeDreamEaterActions(actions);
                break;
        }
    }

    // ============= AI决策辅助 =============

    // 获取角色的能力提示
    getRoleAbilityPrompt(role) {
        const abilityMap = {
            'elder': '你是长老。投票阶段被投票出局时，你会存活下来并需要再次被投票。每晚可以执行特殊能力。',
            'silencer': '你是禁言长老。每晚可以禁言一名玩家，被禁言的玩家当天无法发言。',
            'knight': '你是骑士。每天可以选择守护一名玩家，被守护的玩家当天免受狼人袭击。',
            'magician': '你是魔术师。拥有一次复活能力，可以让一名已死亡的玩家复活。',
            'dreamEater': '你是摄梦人。可以修改投票结果，将一个人的投票转移到另一个人身上。',
            'whiteWolfKing': '你是白狼王。自爆时可以选择带走一名玩家。',
            'wolfBeauty': '你是狼美人。如果击杀目标，会获得护身符（免疫一次狼击）。'
        };

        return abilityMap[role] || '';
    }

    // 根据玩家名称获取角色
    getRoleByPlayer(playerName) {
        const player = this.gameState.players.find(p => p.name === playerName);
        return player ? player.role : null;
    }

    // 获取可用的能力列表
    getAvailableAbilities(playerName) {
        const player = this.gameState.players.find(p => p.name === playerName);
        if (!player || player.dead) return [];

        const abilities = [];

        switch (player.role) {
            case 'elder':
                if (!this.gameState.elderLivedOnce) {
                    abilities.push('saveOnVote');
                }
                break;
            case 'silencer':
                if (!this.gameState.silenced) {
                    abilities.push('silence');
                }
                break;
            case 'knight':
                abilities.push('protect');
                break;
            case 'magician':
                if (!this.gameState.magicianRevived) {
                    abilities.push('revive');
                }
                break;
            case 'dreamEater':
                if (!this.gameState.dreamEaterUsed) {
                    abilities.push('modifyVote');
                }
                break;
            case 'whiteWolfKing':
                abilities.push('suicide');
                break;
        }

        return abilities;
    }
}

// AI决策增强
class WerewolfAIEnhancer {
    constructor(roleAbilitySystem) {
        this.roleAbilitySystem = roleAbilitySystem;
    }

    // 增强的AI决策逻辑
    makeAIDecision(player, gameState) {
        const role = player.role;
        const availableAbilities = this.roleAbilitySystem.getAvailableAbilities(player.name);

        // 基础决策
        const baseDecision = this.makeBaseDecision(player, gameState);

        // 根据角色能力调整决策
        if (availableAbilities.length > 0) {
            return this.makeAbilityDecision(player, gameState, availableAbilities, baseDecision);
        }

        return baseDecision;
    }

    makeBaseDecision(player, gameState) {
        const alivePlayers = gameState.players.filter(p => !p.dead);
        const myTeam = this.getTeam(player.role);

        if (myTeam === 'wolf') {
            // 狼队决策逻辑
            const nonWolves = alivePlayers.filter(p => this.getTeam(p.role) !== 'wolf');
            if (nonWolves.length > 0) {
                // 选择最可疑的神民
                return {
                    action: 'kill',
                    target: this.selectMostSuspicious(nonWolves, gameState),
                    reason: '狼人行动'
                };
            }
        } else if (myTeam === 'good') {
            // 好人决策逻辑
            const wolves = alivePlayers.filter(p => this.getTeam(p.role) === 'wolf');
            if (wolves.length > 0) {
                return {
                    action: 'vote',
                    target: this.selectMostSuspicious(wolves, gameState),
                    reason: '投票给最可疑的狼人'
                };
            }
        }

        return {
            action: 'pass',
            reason: '暂无明确目标'
        };
    }

    makeAbilityDecision(player, gameState, abilities, baseDecision) {
        // 根据角色决定是否使用能力
        const shouldUseAbility = this.shouldUseAbility(player, gameState, abilities);

        if (shouldUseAbility) {
            const ability = abilities[0];
            const target = this.selectAbilityTarget(player, gameState, ability);

            return {
                action: ability,
                target: target,
                reason: `${player.role}使用特殊能力`
            };
        }

        return baseDecision;
    }

    shouldUseAbility(player, gameState, abilities) {
        // 根据游戏状态决定是否使用能力
        switch (player.role) {
            case 'silencer':
                // 如果有玩家发言可疑，禁言
                return gameState.suspiciousPlayers.length > 0;
            case 'knight':
                // 保护重要的神民
                return true;
            case 'elder':
                // 保留能力关键时刻使用
                return gameState.dayCount > 2 && !gameState.elderLivedOnce;
            default:
                return true;
        }
    }

    selectAbilityTarget(player, gameState, ability) {
        const alivePlayers = gameState.players.filter(p => !p.dead);

        switch (ability) {
            case 'silence':
                // 禁言最可疑的玩家
                const suspicious = alivePlayers.filter(p => gameState.suspiciousPlayers.includes(p.name));
                return suspicious[0] || alivePlayers[0];
            case 'protect':
                // 保护神民或重要玩家
                const goodPlayers = alivePlayers.filter(p => this.getTeam(p.role) === 'good' && p.role !== 'hunter');
                return goodPlayers[0] || alivePlayers[0];
            case 'revive':
                // 复活重要的神民
                const deadGood = gameState.players.filter(p => p.dead && this.getTeam(p.role) === 'good');
                return deadGood[0];
            default:
                return alivePlayers[0];
        }
    }

    getTeam(role) {
        if (['wolf', 'whiteWolfKing', 'wolfBeauty'].includes(role)) return 'wolf';
        if (['seer', 'witch', 'hunter', 'elder', 'silencer', 'knight', 'magician', 'dreamEater'].includes(role)) return 'good';
        return 'neutral';
    }

    selectMostSuspicious(players, gameState) {
        // 根据发言和行动历史选择最可疑的玩家
        let maxSuspicion = -1;
        let mostSuspicious = players[0];

        for (const player of players) {
            const suspicion = calculateSuspicionScore(player, gameState);
            if (suspicion > maxSuspicion) {
                maxSuspicion = suspicion;
                mostSuspicious = player;
            }
        }

        return mostSuspicious;
    }
}

// 计算可疑度分数
function calculateSuspicionScore(player, gameState) {
    let score = 0;

    // 基于发言历史
    if (gameState.suspiciousPlayers.includes(player.name)) {
        score += 30;
    }

    // 基于投票历史
    const playerVotes = gameState.votes.filter(v => v.voter === player.name);
    if (playerVotes.length > 0) {
        score += playerVotes.length * 5;
    }

    // 基于行动异常
    if (player.unusualActions) {
        score += player.unusualActions.length * 10;
    }

    return score;
}

// 导出
window.RoleAbilitySystem = RoleAbilitySystem;
window.WerewolfAIEnhancer = WerewolfAIEnhancer;