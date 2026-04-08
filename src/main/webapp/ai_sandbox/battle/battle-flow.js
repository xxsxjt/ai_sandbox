// 战斗流程管理系统
class BattleFlowManager {
    constructor(combatSystem, combatAI) {
        this.combatSystem = combatSystem;
        this.combatAI = combatAI;
        this.currentRoundActions = [];
        this.combatLog = [];
    }

    // 执行完整战斗回合
    async executeRound(gameState) {
        const roundNumber = gameState.currentRound;
        const aliveFighters = gameState.fighters.filter(f => f.alive);

        // 1. AI决策阶段
        await this.phaseAIDecision(aliveFighters);

        // 2. 战斗计算阶段
        const roundResults = await this.phaseCombatCalculation(aliveFighters);

        // 3. 状态更新阶段
        await this.phaseStatusUpdates(aliveFighters);

        // 4. 胜利条件检查
        const winner = this.checkVictoryConditions(gameState);

        // 5. 记录回合
        this.recordRound(roundNumber, roundResults, winner);

        return { winner, roundResults };
    }

    // AI决策阶段
    async phaseAIDecision(aliveFighters) {
        const decisions = [];

        for (const fighter of aliveFighters) {
            // 如果是AI角色，调用AI决策
            if (fighter.model !== 'user') {
                const decision = await this.combatAI.makeDecision(fighter, {
                    fighters: aliveFighters,
                    round: gameState.currentRound
                });

                decisions.push({
                    fighter: fighter,
                    decision: decision
                });

                // 记录决策
                this.combatLog.push({
                    type: 'decision',
                    fighter: fighter.name,
                    action: decision.action,
                    target: decision.target,
                    reason: decision.reason,
                    time: Date.now()
                });
            }
        }

        this.currentRoundActions = decisions;
    }

    // 战斗计算阶段
    async phaseCombatCalculation(aliveFighters) {
        const results = [];
        const processedPairs = new Set();

        // 根据速度排序
        const sortedBySpeed = [...aliveFighters].sort((a, b) => b.speed - a.speed);

        // 处理每对战斗者
        for (let i = 0; i < sortedBySpeed.length; i++) {
            const attacker = sortedBySpeed[i];

            // 获取攻击者的决策
            const attackerAction = this.currentRoundActions.find(a => a.fighter === attacker);
            if (!attackerAction) continue;

            const targetName = attackerAction.decision.target;
            const target = aliveFighters.find(f => f.name === targetName);

            if (!target || target === attacker) continue;

            // 检查是否已经处理过这对组合
            const pairKey = [attacker.name, target.name].sort().join('-');
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            // 执行战斗
            const combatResult = this.combatSystem.executeCombat(attacker, target, attackerAction.decision.action);

            // 验证结果
            const validation = this.combatSystem.validateCombatResult(combatResult);
            if (!validation.valid) {
                console.error('战斗结果验证失败:', validation.errors);
                continue;
            }

            // 记录结果
            results.push({
                attacker: attacker.name,
                defender: target.name,
                ...combatResult
            });

            // 添加到战斗日志
            this.combatLog.push({
                type: 'combat',
                ...combatResult,
                time: Date.now()
            });
        }

        return results;
    }

    // 状态更新阶段
    async phaseStatusUpdates(aliveFighters) {
        const statusUpdates = [];

        for (const fighter of aliveFighters) {
            // 更新状态效果
            const expired = this.combatSystem.updateStatusEffects(fighter);

            if (expired.length > 0) {
                statusUpdates.push({
                    fighter: fighter.name,
                    expired: expired
                });
            }

            // 随机应用新状态效果（根据特定条件）
            if (Math.random() < 0.1) { // 10%概率获得随机效果
                const effectTypes = ['stun', 'bleed', 'buff', 'debuff'];
                const randomEffect = effectTypes[Math.floor(Math.random() * effectTypes.length)];
                const effectMessage = this.combatSystem.applyStatusEffect(fighter, randomEffect);

                statusUpdates.push({
                    fighter: fighter.name,
                    newEffect: randomEffect,
                    message: effectMessage
                });
            }
        }

        return statusUpdates;
    }

    // 检查胜利条件
    checkVictoryConditions(gameState) {
        const aliveFighters = gameState.fighters.filter(f => f.alive);

        if (gameState.battleMode === 'duel') {
            // 单挑模式
            if (aliveFighters.length === 1) {
                return aliveFighters[0];
            }
        } else if (gameState.battleMode === 'team') {
            // 团队模式
            const team1Alive = aliveFighters.filter(f => f.team === 'team1').length;
            const team2Alive = aliveFighters.filter(f => f.team === 'team2').length;

            if (team1Alive === 0) {
                return { team: 'team2', fighters: gameState.fighters.filter(f => f.team === 'team2') };
            } else if (team2Alive === 0) {
                return { team: 'team1', fighters: gameState.fighters.filter(f => f.team === 'team1') };
            }
        } else if (gameState.battleMode === 'battle royale') {
            // 大逃杀模式
            if (aliveFighters.length === 1) {
                return aliveFighters[0];
            }
        }

        // 乱斗模式继续直到达到最大回合数
        return null;
    }

    // 记录回合
    recordRound(roundNumber, results, winner) {
        this.combatLog.push({
            type: 'round_end',
            round: roundNumber,
            results: results,
            winner: winner,
            time: Date.now()
        });
    }

    // 获取战斗统计
    getBattleStats() {
        const stats = {
            totalDamage: 0,
            totalCrits: 0,
            totalDodges: 0,
            totalBlocks: 0,
            totalCounters: 0,
            fighterStats: {}
        };

        // 统计每个战斗者的数据
        for (const fighter of gameState.fighters) {
            const dealt = fighter.fightHistory?.reduce((sum, h) => sum + h.damage, 0) || 0;
            const received = gameState.fighters
                .filter(f => f !== fighter)
                .flatMap(f => f.fightHistory?.filter(h => h.target === fighter.name) || [])
                .reduce((sum, h) => sum + h.damage, 0);

            stats.fighterStats[fighter.name] = {
                totalDealt: dealt,
                totalReceived: received,
                kdRatio: dealt / Math.max(1, received),
                efficiency: (dealt / fighter.maxHp * 100).toFixed(1) + '%',
                accuracy: fighter.fightHistory?.filter(h => h.damage > 0).length / Math.max(1, fighter.fightHistory?.length || 1) * 100
            };
        }

        return stats;
    }

    // 生成战斗报告
    generateBattleReport() {
        const stats = this.getBattleStats();
        const report = {
            summary: {
                totalRounds: gameState.currentRound,
                totalCombats: this.combatLog.filter(l => l.type === 'combat').length,
                duration: this.formatDuration(Date.now() - gameState.startTime)
            },
            fighters: stats.fighterStats,
            highlights: this.getHighlights(),
            log: this.combatLog
        };

        return report;
    }

    // 获取战斗亮点
    getHighlights() {
        const highlights = [];

        // 最高伤害
        const highestDamage = this.combatLog
            .filter(l => l.type === 'combat' && l.damage > 0)
            .sort((a, b) => b.damage - a.damage)[0];

        if (highestDamage) {
            highlights.push({
                type: 'highest_damage',
                value: highestDamage.damage,
                text: `${highestDamage.attacker}对${highestDamage.defender}造成了${highestDamage.damage}点最高伤害！`
            });
        }

        // 最多暴击
        const mostCrits = this.combatLog
            .filter(l => l.type === 'combat' && l.crit)
            .reduce((acc, l) => {
                acc[l.attacker] = (acc[l.attacker] || 0) + 1;
                return acc;
            }, {});

        const topCritter = Object.entries(mostCrits)
            .sort((a, b) => b[1] - a[1])[0];

        if (topCritter) {
            highlights.push({
                type: 'most_crits',
                value: topCritter[1],
                text: `${topCritter[0]}发动了${topCritter[1]}次暴击！`
            });
        }

        return highlights;
    }

    // 格式化持续时间
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}分${remainingSeconds}秒`;
        } else {
            return `${remainingSeconds}秒`;
        }
    }

    // 重置战斗
    reset() {
        this.currentRoundActions = [];
        this.combatLog = [];
    }
}

// 团队战分队系统
class TeamBattleSystem {
    constructor() {
        this.teams = new Map();
    }

    // 自动分队
    autoAssignTeams(fighters, mode = 'balanced') {
        // 清空现有团队
        this.teams.clear();

        switch (mode) {
            case 'balanced':
                // 平衡分队：根据战斗力分配
                const sortedFighters = [...fighters].sort((a, b) => {
                    const powerA = a.attack + a.defense + a.hp;
                    const powerB = b.attack + b.defense + b.hp;
                    return powerB - powerA;
                });

                // 蛇形分配
                for (let i = 0; i < sortedFighters.length; i++) {
                    const teamIndex = i % 2 === 0 ? 0 : 1;
                    const teamName = `team${teamIndex + 1}`;

                    sortedFighters[i].team = teamName;

                    if (!this.teams.has(teamName)) {
                        this.teams.set(teamName, []);
                    }

                    this.teams.get(teamName).push(sortedFighters[i]);
                }
                break;

            case 'random':
                // 随机分队
                const shuffled = [...fighters].sort(() => Math.random() - 0.5);
                shuffled.forEach((fighter, i) => {
                    const teamIndex = i % 2;
                    const teamName = `team${teamIndex + 1}`;
                    fighter.team = teamName;

                    if (!this.teams.has(teamName)) {
                        this.teams.set(teamName, []);
                    }

                    this.teams.get(teamName).push(fighter);
                });
                break;

            case 'class':
                // 按职业分队
                const classes = ['warrior', 'mage', 'assassin', 'tank', 'healer'];
                classes.forEach((cls, i) => {
                    const classFighters = fighters.filter(f => f.class === cls);
                    const teamIndex = i % 2;
                    const teamName = `team${teamIndex + 1}`;

                    classFighters.forEach(f => {
                        f.team = teamName;

                        if (!this.teams.has(teamName)) {
                            this.teams.set(teamName, []);
                        }

                        this.teams.get(teamName).push(f);
                    });
                });
                break;
        }

        return this.teams;
    }

    // 获取团队信息
    getTeamInfo(teamName) {
        const team = this.teams.get(teamName);
        if (!team) return null;

        const alive = team.filter(f => f.alive);
        const totalHp = alive.reduce((sum, f) => sum + f.hp, 0);
        const maxHp = team.reduce((sum, f) => sum + f.maxHp, 0);
        const avgAttack = team.reduce((sum, f) => sum + f.attack, 0) / team.length;

        return {
            name: teamName,
            members: team,
            alive: alive,
            aliveCount: alive.length,
            totalHp: totalHp,
            maxHp: maxHp,
            hpPercent: (totalHp / maxHp * 100).toFixed(1),
            avgAttack: avgAttack.toFixed(1),
            hasHealer: team.some(f => f.class === 'healer'),
            hasTank: team.some(f => f.class === 'tank')
        };
    }

    // 检查团队胜利条件
    checkTeamVictory(gameState) {
        const team1 = this.getTeamInfo('team1');
        const team2 = this.getTeamInfo('team2');

        if (!team1 || !team2) return null;

        if (team1.aliveCount === 0) {
            return { winner: 'team2', info: team2 };
        } else if (team2.aliveCount === 0) {
            return { winner: 'team1', info: team1 };
        }

        return null;
    }
}

// 大逃杀系统
class BattleRoyaleSystem {
    constructor() {
        this.safetyZone = null;
        this.zoneDamage = 0;
        this.lootSpawns = [];
    }

    // 初始化大逃杀
    initializeRoyale(fighters, mapSize = 1000) {
        // 创建安全区域
        this.safetyZone = {
            center: { x: mapSize / 2, y: mapSize / 2 },
            radius: mapSize * 0.8,
            damage: 10,
            shrinkRate: 0.95
        };

        // 生成随机战利品
        this.generateLoot(mapSize);

        // 随机放置玩家
        this.placePlayers(fighters, mapSize);
    }

    // 生成战利品
    generateLoot(mapSize) {
        const lootTypes = [
            { type: 'health', value: 30, chance: 0.3 },
            { type: 'damage_boost', value: 20, chance: 0.2 },
            { type: 'shield', value: 50, chance: 0.2 },
            { type: 'speed_boost', value: 15, chance: 0.15 }
        ];

        this.lootSpawns = [];

        // 生成50个战利品点
        for (let i = 0; i < 50; i++) {
            const loot = lootTypes[Math.floor(Math.random() * lootTypes.length)];
            const position = {
                x: Math.random() * mapSize,
                y: Math.random() * mapSize,
                ...loot
            };

            this.lootSpawns.push(position);
        }
    }

    // 放置玩家
    placePlayers(fighters, mapSize) {
        fighters.forEach(fighter => {
            fighter.position = {
                x: Math.random() * mapSize,
                y: Math.random() * mapSize
            };
        });
    }

    // 更新安全区域
    updateSafetyZone() {
        this.safetyZone.radius *= this.safetyZone.shrinkRate;
        this.safetyZone.damage = Math.floor(this.safetyZone.damage * 1.1);

        // 通知玩家
        this.notifyZoneShrink();
    }

    // 通知区域收缩
    notifyZoneShrink() {
        const message = `⚠️ 安全区域正在收缩！当前半径：${this.safetyZone.radius.toFixed(0)}，伤害：${this.safetyZone.damage}`;

        // 这里可以添加UI更新逻辑
        console.log(message);
    }

    // 检查玩家是否在安全区域
    isPlayerInZone(player) {
        if (!player.position || !this.safetyZone) return true;

        const distance = Math.sqrt(
            Math.pow(player.position.x - this.safetyZone.center.x, 2) +
            Math.pow(player.position.y - this.safetyZone.center.y, 2)
        );

        return distance <= this.safetyZone.radius;
    }

    // 应用区域伤害
    applyZoneDamage(player) {
        if (this.isPlayerInZone(player)) return;

        const damage = this.safetyZone.damage;
        player.hp = Math.max(0, player.hp - damage);

        return {
            player: player.name,
            damage: damage,
            reason: '安全区域外受到伤害'
        };
    }

    // 收集战利品
    collectLoot(player, lootIndex) {
        const loot = this.lootSpawns[lootIndex];
        if (!loot) return null;

        // 应用战利品效果
        switch (loot.type) {
            case 'health':
                player.hp = Math.min(player.maxHp, player.hp + loot.value);
                break;
            case 'damage_boost':
                player.attack += loot.value;
                break;
            case 'shield':
                player.shield = (player.shield || 0) + loot.value;
                break;
            case 'speed_boost':
                player.speed += loot.value;
                break;
        }

        // 移除战利品
        this.lootSpawns.splice(lootIndex, 1);

        return {
            player: player.name,
            loot: loot,
            effect: this.getLootEffectText(loot)
        };
    }

    // 获取战利品效果文本
    getLootEffectText(loot) {
        const effects = {
            health: `恢复${loot.value}点生命值`,
            damage_boost: `攻击力提升${loot.value}点`,
            shield: `获得${loot.value}点护盾`,
            speed_boost: `速度提升${loot.value}点`
        };

        return effects[loot.type] || '获得神秘效果';
    }
}

// 导出
window.BattleFlowManager = BattleFlowManager;
window.TeamBattleSystem = TeamBattleSystem;
window.BattleRoyaleSystem = BattleRoyaleSystem;