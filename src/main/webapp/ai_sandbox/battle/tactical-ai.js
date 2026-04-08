// 高级战术AI系统
class TacticalAI {
    constructor(combatSystem) {
        this.combatSystem = combatSystem;
        this.threatAnalysis = new Map();
        this.battlePattern = new Map();
        this.tacticalMemory = [];
        this.abilities = new Map();
    }

    // 分析战场威胁
    analyzeBattlefield(fighter, gameState) {
        const analysis = {
            immediateThreats: [],
            opportunities: [],
            tacticalPosition: this.evaluatePosition(fighter, gameState),
            teamStatus: this.evaluateTeamStatus(fighter, gameState),
            enemyFocus: this.detectEnemyFocus(fighter, gameState),
            weakness: this.detectWeakness(fighter, gameState)
        };

        // 更新威胁分析
        this.threatAnalysis.set(fighter.id, analysis);

        return analysis;
    }

    // 评估战术位置
    evaluatePosition(fighter, gameState) {
        const aliveEnemies = gameState.fighters.filter(f =>
            f.alive && f.team !== fighter.team
        );
        const aliveAllies = gameState.fighters.filter(f =>
            f.alive && f.team === fighter.team && f !== fighter
        );

        let score = 50; // 中性位置

        // 如果是治疗师，应该在后方
        if (fighter.class === 'healer') {
            if (aliveAllies.length > 0) {
                score += 20; // 有队友保护
            }
            score -= 30; // 容易成为目标
        }

        // 如果是坦克，应该在前方
        if (fighter.class === 'tank') {
            score += 25; // 适合承受伤害
            if (fighter.hp < fighter.maxHp * 0.5) {
                score -= 15; // 血量低，应该后撤
            }
        }

        // 如果是刺客，应该寻找机会
        if (fighter.class === 'assassin') {
            const lowHpEnemies = aliveEnemies.filter(e => e.hp < e.maxHp * 0.3);
            if (lowHpEnemies.length > 0) {
                score += 35; // 有击杀机会
            }
        }

        return {
            score: score,
            recommendation: this.getPositionRecommendation(score, fighter.class)
        };
    }

    // 获取位置建议
    getPositionRecommendation(score, classType) {
        if (score >= 80) {
            return '优秀位置，保持当前策略';
        } else if (score >= 60) {
            switch (classType) {
                case 'tank': return '可以稍微前压';
                case 'healer': return '寻找更好的掩护';
                case 'mage': return '保持距离输出';
                default: return '可以调整位置';
            }
        } else if (score >= 40) {
            switch (classType) {
                case 'tank': return '需要后撤调整';
                case 'healer': return '必须寻找安全位置';
                case 'mage': return '远离敌人';
                case 'assassin': return '寻找突袭机会';
                default: return '需要调整战术';
            }
        } else {
            return '危险位置，立即转移';
        }
    }

    // 评估团队状态
    evaluateTeamStatus(fighter, gameState) {
        const team = gameState.fighters.filter(f => f.team === fighter.team);
        const aliveTeam = team.filter(f => f.alive);
        const enemyTeam = gameState.fighters.filter(f => f.team !== fighter.team);
        const aliveEnemy = enemyTeam.filter(f => f.alive);

        // 计算团队战斗力
        const teamPower = aliveTeam.reduce((sum, f) =>
            sum + f.attack + f.defense + f.hp, 0
        );
        const enemyPower = aliveEnemy.reduce((sum, f) =>
            sum + f.attack + f.defense + f.hp, 0
        );

        // 分析团队构成
        const hasHealer = aliveTeam.some(f => f.class === 'healer');
        const hasTank = aliveTeam.some(f => f.class === 'tank');
        const hasMage = aliveTeam.some(f => f.class === 'mage');
        const hasAssassin = aliveTeam.some(f => f.class === 'assassin');

        return {
            teamPower: teamPower,
            enemyPower: enemyPower,
            powerRatio: teamPower / Math.max(1, enemyPower),
            teamHealth: aliveTeam.reduce((sum, f) => sum + f.hp, 0),
            maxTeamHealth: team.reduce((sum, f) => sum + f.maxHp, 0),
            healthPercent: (aliveTeam.reduce((sum, f) => sum + f.hp, 0) /
                team.reduce((sum, f) => sum + f.maxHp, 0) * 100).toFixed(1),
            composition: {
                healer: hasHealer,
                tank: hasTank,
                mage: hasMage,
                assassin: hasAssassin
            },
            needs: this.identifyTeamNeeds(aliveTeam, aliveEnemy)
        };
    }

    // 识别团队需求
    identifyTeamNeeds(team, enemies) {
        const needs = [];

        // 检查治疗需求
        const lowHpTeam = team.filter(f => f.hp < f.maxHp * 0.5);
        if (lowHpTeam.length > team.length * 0.3) {
            needs.push('healing');
        }

        // 检查坦克需求
        if (!team.some(f => f.class === 'tank') && enemies.some(f => f.class === 'tank')) {
            needs.push('tank');
        }

        // 检查输出需求
        const teamDamage = team.reduce((sum, f) => sum + f.attack, 0);
        const enemyTank = enemies.filter(f => f.class === 'tank');
        if (enemyTank.length > 0 && teamDamage < 50) {
            needs.push('damage');
        }

        return needs;
    }

    // 检测敌人焦点
    detectEnemyFocus(fighter, gameState) {
        const recentAttacks = this.tacticalMemory.filter(m =>
            m.type === 'attack' &&
            m.target === fighter.name &&
            Date.now() - m.time < 30000 // 30秒内
        );

        const attackers = [...new Set(recentAttacks.map(m => m.attacker))];

        return {
            focused: attackers.length >= 2,
            attackers: attackers,
            intensity: attackers.length,
            since: attackers.length > 0 ? recentAttacks[0].time : null
        };
    }

    // 检测弱点
    detectWeakness(fighter, gameState) {
        const weaknesses = [];

        // 检查血量
        if (fighter.hp < fighter.maxHp * 0.3) {
            weaknesses.push({
                type: 'health',
                severity: 'critical',
                message: '血量过低，需要治疗或撤退'
            });
        }

        // 检查状态效果
        if (fighter.stunned) {
            weaknesses.push({
                type: 'status',
                severity: 'high',
                message: '被眩晕，无法行动'
            });
        }

        // 检查防御过低
        if (fighter.defense < 15) {
            weaknesses.push({
                type: 'defense',
                severity: 'medium',
                message: '防御力较低，容易被击杀'
            });
        }

        // 检查被针对
        if (this.detectEnemyFocus(fighter, gameState).focused) {
            weaknesses.push({
                type: 'focus',
                severity: 'high',
                message: '被多个敌人针对'
            });
        }

        return weaknesses;
    }

    // 制定战术决策
    makeTacticalDecision(fighter, gameState) {
        const analysis = this.analyzeBattlefield(fighter, gameState);

        // 基础战术框架
        const tacticalFramework = {
            primaryGoal: this.determinePrimaryGoal(analysis, fighter),
            targetPriority: this.determineTargetPriority(analysis, fighter),
            actionPriority: this.determineActionPriority(analysis, fighter),
            positioning: analysis.tacticalPosition.recommendation,
            teamContribution: this.determineTeamContribution(analysis, fighter)
        };

        // 根据角色类型细化战术
        const roleSpecificTactics = this.getRoleSpecificTactics(
            fighter,
            analysis,
            tacticalFramework
        );

        // 添加记忆和经验
        const experiencedTactics = this.applyExperiencedTactics(
            fighter,
            tacticalFramework
        );

        return {
            ...tacticalFramework,
            ...roleSpecificTactics,
            ...experiencedTactics,
            confidence: this.calculateConfidence(analysis, fighter),
            reasoning: this.generateReasoning(analysis, fighter)
        };
    }

    // 确定主要目标
    determinePrimaryGoal(analysis, fighter) {
        // 1. 如果血量极低，生存是首要目标
        if (fighter.hp < fighter.maxHp * 0.2) {
            return 'survival';
        }

        // 2. 如果是治疗师，治疗队友
        if (fighter.class === 'healer' && analysis.teamStatus.needs.includes('healing')) {
            return 'support';
        }

        // 3. 如果有击杀机会，优先击杀
        const lowHpEnemies = gameState.fighters.filter(f =>
            f.alive &&
            f.team !== fighter.team &&
            f.hp < f.maxHp * 0.3
        );
        if (lowHpEnemies.length > 0) {
            return 'finish';
        }

        // 4. 默认：削弱敌人
        return 'weaken';
    }

    // 确定目标优先级
    determineTargetPriority(analysis, fighter) {
        const aliveEnemies = gameState.fighters.filter(f =>
            f.alive && f.team !== fighter.team
        );

        const targets = aliveEnemies.map(enemy => {
            let priority = 50; // 基础优先级

            // 威胁程度
            const threat = enemy.attack / fighter.defense;
            priority += threat * 20;

            // 血量状态
            if (enemy.hp < enemy.maxHp * 0.5) {
                priority += 30; // 低血量目标更易击杀
            }

            // 角色价值
            switch (enemy.class) {
                case 'healer':
                    priority += 40; // 优先击杀治疗师
                    break;
                case 'mage':
                    priority += 35; // 高输出威胁大
                    break;
                case 'tank':
                    priority += 25; // 优先攻击坦克
                    break;
                case 'assassin':
                    priority += 30; // 刺客威胁大
                    break;
            }

            // 是否在针对我
            if (analysis.enemyFocus.attackers.includes(enemy.name)) {
                priority += 20; // 针对我的优先攻击
            }

            return {
                target: enemy,
                priority: priority,
                reason: this.getPriorityReason(enemy, threat)
            };
        });

        return targets.sort((a, b) => b.priority - a.priority);
    }

    // 获取优先级原因
    getPriorityReason(enemy, threat) {
        const reasons = [];

        if (threat > 2) {
            reasons.push('高威胁目标');
        }

        if (enemy.hp < enemy.maxHp * 0.5) {
            reasons.push('残血目标');
        }

        switch (enemy.class) {
            case 'healer':
                reasons.push('关键治疗');
                break;
            case 'mage':
                reasons.push('高输出');
                break;
            case 'tank':
                reasons.push('防御核心');
                break;
            case 'assassin':
                reasons.push('刺杀威胁');
                break;
        }

        return reasons.join('、');
    }

    // 确定行动优先级
    determineActionPriority(analysis, fighter) {
        const actions = [];

        // 根据主要目标选择行动
        switch (analysis.primaryGoal) {
            case 'survival':
                actions.push(
                    { action: '防御', priority: 90, reason: '保护自己' },
                    { action: '撤退', priority: 80, reason: '寻找安全位置' },
                    { action: '治疗', priority: 70, reason: '恢复生命值' }
                );
                break;

            case 'support':
                actions.push(
                    { action: '治疗', priority: 90, reason: '救助队友' },
                    { action: '保护', priority: 75, reason: '保护队友' },
                    { action: '防御', priority: 60, reason: '保持安全' }
                );
                break;

            case 'finish':
                actions.push(
                    { action: '攻击', priority: 95, reason: '击杀残血敌人' },
                    { action: '冲锋', priority: 85, reason: '快速接近' },
                    { action: '蓄力', priority: 75, reason: '造成更大伤害' }
                );
                break;

            case 'weaken':
                actions.push(
                    { action: '攻击', priority: 80, reason: '削弱敌人' },
                    { action: '突袭', priority: 75, reason: '偷袭后排' },
                    { action: '防御', priority: 65, reason: '保持输出位置' }
                );
                break;
        }

        // 根据角色特性调整
        if (fighter.class === 'assassin') {
            actions.unshift(
                { action: '突袭', priority: 95, reason: '刺客特色' }
            );
        }

        if (fighter.class === 'mage') {
            actions.unshift(
                { action: '蓄力', priority: 90, reason: '法师特色' }
            );
        }

        return actions;
    }

    // 获取角色特定战术
    getRoleSpecificTactics(fighter, analysis, framework) {
        const tactics = {};

        switch (fighter.class) {
            case 'tank':
                // 坦克战术：吸收伤害，保护队友
                tactics.roleStrategy = 'absorb_damage';
                tactics.positioning = 'front_line';
                tactics.abilityUsage = 'use_taunt';

                if (fighter.hp < fighter.maxHp * 0.3) {
                    tactics.emergencyAction = 'retreat';
                }
                break;

            case 'healer':
                // 治疗师战术：保持安全，优先治疗
                tactics.roleStrategy = 'support_team';
                tactics.positioning = 'back_line';
                tactics.abilityUsage = 'prioritize_healing';

                if (analysis.teamStatus.needs.includes('damage')) {
                    tactics.emergencyAction = 'dps_mode';
                }
                break;

            case 'mage':
                // 法师战术：远程输出，控制战场
                tactics.roleStrategy = 'ranged_dps';
                tactics.positioning = 'maintain_distance';
                tactics.abilityUsage = 'burst_damage';

                if (analysis.enemyFocus.intensity > 2) {
                    tactics.emergencyAction = 'reposition';
                }
                break;

            case 'assassin':
                // 刺客战术：寻找弱点，爆发输出
                tactics.roleStrategy = 'burst_target';
                tactics.positioning = 'flank_enemies';
                tactics.abilityUsage = 'focus_fire';

                const highValueTargets = framework.targetPriority.filter(t => t.priority > 70);
                if (highValueTargets.length > 0) {
                    tactics.target = highValueTargets[0].target.name;
                }
                break;

            case 'warrior':
                // 战士战术：均衡发展，适应战场
                tactics.roleStrategy = 'balanced_combat';
                tactics.positioning = 'adaptive_position';
                tactics.abilityUsage = 'versatile';
                break;
        }

        return tactics;
    }

    // 应用战术经验
    applyExperiencedTactics(fighter, framework) {
        const experienced = {};

        // 检查是否有类似战斗的经验
        const similarBattles = this.battlePattern.get(fighter.id) || [];

        if (similarBattles.length > 0) {
            // 分析过去成功的战术
            const successfulTactics = similarBattles.filter(b => b.won);
            if (successfulTactics.length > 0) {
                experienced.successfulPattern = successfulTactics[0].pattern;
            }
        }

        // 根据当前局势调整
        if (gameState.currentRound > 5) {
            experienced.lateGame = true;
            experienced.aggression = framework.teamStatus.powerRatio > 1.2 ? 'high' : 'low';
        }

        return experienced;
    }

    // 计算决策置信度
    calculateConfidence(analysis, fighter) {
        let confidence = 50; // 基础置信度

        // 根据信息完整度调整
        const infoCompleteness = (
            analysis.immediateThreats.length > 0 &&
            analysis.opportunities.length > 0 &&
            analysis.tacticalPosition.score > 0
        ) ? 20 : 0;
        confidence += infoCompleteness;

        // 根据战斗经验调整
        const experienceBonus = Math.min(this.tacticalMemory.length / 10, 20);
        confidence += experienceBonus;

        // 根据角色熟练度调整
        const roleExperience = (this.abilities.get(fighter.id) || 0) * 2;
        confidence += roleExperience;

        // 根据局势清晰度调整
        const clarityScore = analysis.weakness.length < 2 ? 10 : -10;
        confidence += clarityScore;

        return Math.min(Math.max(confidence, 0), 100);
    }

    // 生成决策理由
    generateReasoning(analysis, fighter) {
        const reasons = [];

        // 基于主要目标
        reasons.push(`主要目标：${this.getGoalText(analysis.primaryGoal)}`);

        // 基于团队状态
        if (analysis.teamStatus.healthPercent < 50) {
            reasons.push('团队血量较低，需要谨慎');
        }

        // 基于威胁分析
        if (analysis.immediateThreats.length > 0) {
            reasons.push(`面临${analysis.immediateThreats.length}个直接威胁`);
        }

        // 基于战术位置
        reasons.push(`位置评估：${analysis.tacticalPosition.recommendation}`);

        return reasons.join('，');
    }

    // 获取目标文本
    getGoalText(goal) {
        const goalMap = {
            'survival': '生存',
            'support': '支援',
            'finish': '击杀',
            'weaken': '削弱'
        };
        return goalMap[goal] || '未知';
    }

    // 更新战斗记忆
    updateBattleMemory(action, result) {
        this.tacticalMemory.push({
            type: action.type,
            actor: action.actor,
            target: action.target,
            result: result,
            time: Date.now(),
            won: result.winner === action.actor.team
        });

        // 保持记忆在合理范围内
        if (this.tacticalMemory.length > 100) {
            this.tacticalMemory = this.tacticalMemory.slice(-50);
        }
    }

    // 记录能力使用
    recordAbilityUsage(fighter, ability) {
        const count = (this.abilities.get(fighter.id) || 0) + 1;
        this.abilities.set(fighter.id, count);
    }
}

// 扩展的战斗AI决策
class EnhancedBattleAI extends CombatAI {
    constructor(combatSystem) {
        super(combatSystem);
        this.tacticalAI = new TacticalAI(combatSystem);
    }

    // 重写决策方法，使用战术AI
    async makeDecision(fighter, gameState) {
        // 获取战术分析
        const tacticalDecision = this.tacticalAI.makeTacticalDecision(fighter, gameState);

        // 构建增强的提示
        const enhancedPrompt = this.buildTacticalPrompt(fighter, tacticalDecision, gameState);

        // 调用AI获取最终决策
        const response = await this.callAIWithEnhancedPrompt(fighter, enhancedPrompt);

        // 解析并验证决策
        const finalDecision = this.parseAndValidateDecision(response, fighter, tacticalDecision);

        // 更新记忆
        this.tacticalAI.updateBattleMemory(finalDecision, { success: true });

        return finalDecision;
    }

    // 构建战术提示
    buildTacticalPrompt(fighter, tacticalDecision, gameState) {
        const aliveEnemies = gameState.fighters.filter(f =>
            f.alive && f.team !== fighter.team
        );
        const aliveAllies = gameState.fighters.filter(f =>
            f.alive && f.team === fighter.team && f !== fighter
        );

        let prompt = `你是${fighter.name}（${fighter.class}），正在战斗中。

当前局势：
- 你当前血量：${fighter.hp}/${fighter.maxHp} (${(fighter.fighter.maxHp * 100).toFixed(1)}%)
- 团队血量：${tacticalDecision.teamStatus.healthPercent}%
- 主要战术目标：${tacticalDecision.primaryGoal}
- 战术位置：${tacticalDecision.positioning}

可选目标：${aliveEnemies.map(e => e.name).join('、')}

请根据以下建议做出决策：
${tacticalDecision.reasoning}

可选行动：
${tacticalDecision.actionPriority.map(a =>
    `- ${a.action}（优先级：${a.priority}，原因：${a.reason}）`
).join('\n')}

请选择最合适的行动，格式：行动：[行动类型]，目标：[目标名称]，原因：[简要说明]`;

        return prompt;
    }

    // 调用AI增强提示
    async callAIWithEnhancedPrompt(fighter, prompt) {
        // 这里可以添加更多的AI处理逻辑
        // 例如：添加角色特定提示、历史经验等

        // 使用基类的callAPI方法
        return await super.callAI(fighter, prompt, { cache: false });
    }

    // 解析和验证决策
    parseAndValidateDecision(response, fighter, tacticalDecision) {
        const parsed = {
            fighter: fighter,
            action: '攻击',
            target: tacticalDecision.targetPriority[0]?.target.name ||
                    gameState.fighters.find(f => f.alive && f.team !== fighter.team)?.name,
            reason: '',
            confidence: tacticalDecision.confidence,
            tactical: tacticalDecision
        };

        // 尝试从响应中提取决策
        const actionMatch = response.match(/行动[：:]\s*([^，,。！？\s]+)/);
        const targetMatch = response.match(/目标[：:]\s*([^，,。！？\s]+)/);

        if (actionMatch) {
            parsed.action = actionMatch[1];
        }

        if (targetMatch) {
            parsed.target = targetMatch[1];
        }

        // 提取原因
        const reasonMatch = response.match(/原因[：:]\s*([^.。！？]+)/);
        if (reasonMatch) {
            parsed.reason = reasonMatch[1];
        }

        return parsed;
    }
}

// 导出
window.TacticalAI = TacticalAI;
window.EnhancedBattleAI = EnhancedBattleAI;