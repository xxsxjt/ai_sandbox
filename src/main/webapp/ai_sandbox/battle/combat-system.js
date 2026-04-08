// 战斗伤害计算和状态效果系统
class CombatSystem {
    constructor() {
        // 基础角色属性模板
        this.baseStats = {
            warrior: {
                hp: 120,
                attack: 25,
                defense: 20,
                speed: 15,
                critChance: 20,
                critDamage: 150,
                dodgeChance: 10,
                counterChance: 15,
                blockChance: 30,
                blockReduction: 50
            },
            mage: {
                hp: 80,
                attack: 35,
                defense: 10,
                speed: 20,
                critChance: 25,
                critDamage: 200,
                dodgeChance: 15,
                counterChance: 5,
                blockChance: 20,
                blockReduction: 30
            },
            assassin: {
                hp: 90,
                attack: 30,
                defense: 12,
                speed: 30,
                critChance: 35,
                critDamage: 180,
                dodgeChance: 25,
                counterChance: 20,
                blockChance: 15,
                blockReduction: 40
            },
            tank: {
                hp: 150,
                attack: 20,
                defense: 35,
                speed: 10,
                critChance: 10,
                critDamage: 120,
                dodgeChance: 5,
                counterChance: 10,
                blockChance: 50,
                blockReduction: 70
            },
            healer: {
                hp: 100,
                attack: 15,
                defense: 18,
                speed: 18,
                critChance: 15,
                critDamage: 160,
                dodgeChance: 12,
                counterChance: 8,
                blockChance: 25,
                blockReduction: 45
            }
        };

        // 战斗公式配置
        this.formula = {
            // 基础伤害计算
            baseDamage: (attacker, defender, action) => {
                let damage = attacker.attack;

                // 动作加成
                const actionMultipliers = {
                    '攻击': 1.0,
                    '防御': 0.5,
                    '闪避': 0.3,
                    '冲锋': 1.3,
                    '突袭': 1.2,
                    '蓄力': 1.5
                };

                if (actionMultipliers[action]) {
                    damage *= actionMultipliers[action];
                }

                // 防御减伤
                const defenseReduction = defender.defense / 100;
                damage = Math.floor(damage * (1 - defenseReduction * 0.5));

                return Math.max(1, damage);
            },

            // 暴击判定
            checkCrit: (attacker) => {
                const roll = Math.random() * 100;
                return roll < attacker.critChance;
            },

            // 暴击伤害
            calculateCritDamage: (baseDamage, attacker) => {
                const critMultiplier = attacker.critDamage / 100;
                return Math.floor(baseDamage * critMultiplier);
            },

            // 闪避判定
            checkDodge: (defender) => {
                const roll = Math.random() * 100;
                return roll < defender.dodgeChance;
            },

            // 格挡判定
            checkBlock: (defender) => {
                const roll = Math.random() * 100;
                return roll < defender.blockChance;
            },

            // 反击判定
            checkCounter: (defender) => {
                const roll = Math.random() * 100;
                return roll < defender.counterChance;
            },

            // 反伤伤害
            calculateCounterDamage: (defender, attacker) => {
                const counterPercent = 30; // 反击造成30%的伤害
                return Math.floor(attacker.attack * counterPercent / 100);
            }
        };

        // 状态效果
        this.statusEffects = {
            stun: {
                name: '眩晕',
                duration: 1,
                effect: (fighter) => {
                    fighter.stunned = true;
                    return '被眩晕，无法行动';
                }
            },
            bleed: {
                name: '流血',
                duration: 3,
                effect: (fighter) => {
                    const damage = Math.floor(fighter.maxHp * 0.05);
                    fighter.hp = Math.max(0, fighter.hp - damage);
                    return `受到${damage}点流血伤害`;
                }
            },
            buff: {
                name: '增强',
                duration: 2,
                effect: (fighter) => {
                    fighter.attack = Math.floor(fighter.attack * 1.2);
                    fighter.defense = Math.floor(fighter.defense * 1.1);
                    return '攻击力和防御力提升';
                }
            },
            debuff: {
                name: '虚弱',
                duration: 2,
                effect: (fighter) => {
                    fighter.attack = Math.floor(fighter.attack * 0.8);
                    fighter.defense = Math.floor(fighter.defense * 0.8);
                    return '攻击力和防御力下降';
                }
            }
        };
    }

    // 初始化战士属性
    initializeFighter(fighter) {
        const baseStats = this.baseStats[fighter.class] || this.baseStats.warrior;

        // 复制基础属性
        fighter.maxHp = baseStats.hp;
        fighter.hp = baseStats.hp;
        fighter.attack = baseStats.attack;
        fighter.defense = baseStats.defense;
        fighter.speed = baseStats.speed;
        fighter.critChance = baseStats.critChance;
        fighter.critDamage = baseStats.critDamage;
        fighter.dodgeChance = baseStats.dodgeChance;
        fighter.counterChance = baseStats.counterChance;
        fighter.blockChance = baseStats.blockChance;
        fighter.blockReduction = baseStats.blockReduction;

        // 重置状态
        fighter.stunned = false;
        fighter.statusEffects = [];
        fighter.fightHistory = [];
    }

    // 执行单次战斗计算
    executeCombat(attacker, defender, action) {
        const result = {
            attacker: attacker.name,
            defender: defender.name,
            action: action,
            damage: 0,
            crit: false,
            dodge: false,
            block: false,
            counter: false,
            counterDamage: 0,
            statusEffects: [],
            description: ''
        };

        // 1. 检查眩晕
        if (attacker.stunned) {
            result.description = `${attacker.name}被眩晕，无法行动！`;
            return result;
        }

        // 2. 检查闪避
        if (this.formula.checkDodge(defender)) {
            result.dodge = true;
            result.description = `${defender.name}闪避了攻击！`;
            return result;
        }

        // 3. 计算基础伤害
        let damage = this.formula.baseDamage(attacker, defender, action);

        // 4. 检查暴击
        if (this.formula.checkCrit(attacker)) {
            result.crit = true;
            damage = this.formula.calculateCritDamage(damage, attacker);
        }

        // 5. 检查格挡
        if (this.formula.checkBlock(defender)) {
            result.block = true;
            const reduction = defender.blockReduction / 100;
            damage = Math.floor(damage * (1 - reduction));
            result.description += `${defender.name}格挡了攻击，减少${Math.floor(reduction * 100)}%伤害！`;
        }

        // 6. 应用伤害
        result.damage = damage;
        defender.hp = Math.max(0, defender.hp - damage);

        // 7. 检查反击
        if (!result.dodge && !result.block && this.formula.checkCounter(defender)) {
            result.counter = true;
            result.counterDamage = this.formula.calculateCounterDamage(defender, attacker);
            attacker.hp = Math.max(0, attacker.hp - result.counterDamage);
        }

        // 8. 构建描述
        result.description = this.buildCombatDescription(result);

        // 9. 记录战斗历史
        this.recordFightHistory(attacker, defender, result);

        return result;
    }

    // 构建战斗描述
    buildCombatDescription(result) {
        const parts = [];

        if (result.dodge) {
            parts.push(`${result.defender}闪避了攻击！`);
        } else if (result.block) {
            parts.push(`${result.defender}格挡了攻击，只受到${result.damage}点伤害！`);
        } else if (result.crit) {
            parts.push(`${result.attacker}发动暴击，造成${result.damage}点暴击伤害！`);
        } else {
            parts.push(`${result.attacker}对${result.defender}造成${result.damage}点伤害！`);
        }

        if (result.counter && result.counterDamage > 0) {
            parts.push(`${result.defender}反击造成${result.counterDamage}点反伤！`);
        }

        return parts.join(' ');
    }

    // 记录战斗历史
    recordFightHistory(attacker, defender, result) {
        attacker.fightHistory = attacker.fightHistory || [];
        defender.fightHistory = defender.fightHistory || [];

        attacker.fightHistory.push({
            target: defender.name,
            action: result.action,
            damage: result.damage,
            counterDamage: result.counterDamage,
            time: Date.now()
        });

        defender.fightHistory.push({
            from: attacker.name,
            damage: result.damage + result.counterDamage,
            time: Date.now()
        });
    }

    // 应用状态效果
    applyStatusEffect(fighter, effectName) {
        const effect = this.statusEffects[effectName];
        if (!effect) return false;

        const status = {
            name: effect.name,
            duration: effect.duration,
            startTime: Date.now()
        };

        fighter.statusEffects = fighter.statusEffects || [];
        fighter.statusEffects.push(status);

        // 立即生效
        const effectMessage = effect.effect(fighter);
        return `${fighter.name}获得了${effect.name}效果：${effectMessage}`;
    }

    // 更新状态效果
    updateStatusEffects(fighter) {
        if (!fighter.statusEffects) return [];

        const expiredEffects = [];
        fighter.statusEffects = fighter.statusEffects.filter(effect => {
            const elapsed = (Date.now() - effect.startTime) / 1000;

            if (elapsed >= effect.duration) {
                expiredEffects.push(effect.name);
                return false;
            }

            // 每秒应用效果
            if (Math.floor(elapsed) !== Math.floor(elapsed - 1)) {
                const effect = this.statusEffects[effect.name];
                if (effect && effect.effect) {
                    effect.effect(fighter);
                }
            }

            return true;
        });

        return expiredEffects;
    }

    // 计算伤害统计
    calculateDamageStats(fighters) {
        const stats = {};

        fighters.forEach(fighter => {
            const dealt = fighter.fightHistory?.reduce((sum, h) => sum + h.damage, 0) || 0;
            const received = fighters
                .filter(f => f !== fighter)
                .flatMap(f => f.fightHistory?.filter(h => h.target === fighter.name) || [])
                .reduce((sum, h) => sum + h.damage, 0);

            stats[fighter.name] = {
                dealt: dealt,
                received: received,
                efficiency: dealt / (fighter.maxHp || 1),
                accuracy: fighter.fightHistory?.filter(h => h.damage > 0).length / (fighter.fightHistory?.length || 1) * 100
            };
        });

        return stats;
    }

    // 获取角色建议
    getFighterAdvice(fighter, gameState) {
        const aliveFighters = gameState.fighters.filter(f => f.hp > 0);
        const enemies = aliveFighters.filter(f => f.team !== fighter.team);
        const allies = aliveFighters.filter(f => f.team === fighter.team);

        const advice = {
            currentHp: fighter.hp,
            maxHp: fighter.maxHp,
            hpPercent: (fighter.hp / fighter.maxHp * 100).toFixed(1),
            threats: [],
            opportunities: []
        };

        // 分析威胁
        enemies.forEach(enemy => {
            if (enemy.attack > fighter.defense * 1.5) {
                advice.threats.push(`${enemy.name}威胁较大，攻击力${enemy.attack} > 防御${fighter.defense}`);
            }
        });

        // 分析机会
        const lowHpEnemies = enemies.filter(e => e.hp < e.maxHp * 0.3);
        if (lowHpEnemies.length > 0) {
            advice.opportunities.push(`优先攻击低血量敌人：${lowHpEnemies.map(e => `${e.name}(${e.hp}/${e.maxHp})`).join('、')}`);
        }

        // 根据角色类型给出战术建议
        switch (fighter.class) {
            case 'tank':
                if (fighter.hp < fighter.maxHp * 0.5 && allies.length > 0) {
                    advice.opportunities.push('血量较低，建议寻找队友保护或使用防御');
                }
                break;
            case 'mage':
                advice.opportunities.push('远程角色，保持距离输出');
                break;
            case 'assassin':
                if (fighter.speed > 20) {
                    advice.opportunities.push('高速度，可以考虑突袭后排敌人');
                }
                break;
        }

        return advice;
    }

    // 验证战斗结果
    validateCombatResult(result) {
        const errors = [];

        if (result.damage < 0) {
            errors.push('伤害不能为负数');
        }

        if (result.attacker === result.defender) {
            errors.push('不能攻击自己');
        }

        if (result.counterDamage < 0) {
            errors.push('反伤不能为负数');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// 战斗AI决策系统
class CombatAI {
    constructor(combatSystem) {
        this.combatSystem = combatSystem;
    }

    // AI决策逻辑
    makeDecision(fighter, gameState) {
        const aliveEnemies = gameState.fighters.filter(f =>
            f.hp > 0 && f.team !== fighter.team
        );
        const aliveAllies = gameState.fighters.filter(f =>
            f.hp > 0 && f.team === fighter.team && f !== fighter
        );

        // 获取战斗建议
        const advice = this.combatSystem.getFighterAdvice(fighter, gameState);

        // 基于血量和局势的决策
        if (fighter.hp < fighter.maxHp * 0.3) {
            // 低血量策略
            return this.lowHpStrategy(fighter, aliveEnemies, aliveAllies, advice);
        } else if (fighter.hp < fighter.maxHp * 0.6) {
            // 中等血量策略
            return this.mediumHpStrategy(fighter, aliveEnemies, aliveAllies, advice);
        } else {
            // 高血量策略
            return this.highHpStrategy(fighter, aliveEnemies, aliveAllies, advice);
        }
    }

    // 低血量策略
    lowHpStrategy(fighter, enemies, allies, advice) {
        // 优先治疗或防御
        if (fighter.class === 'healer' && allies.length > 0) {
            const lowHpAllies = allies.filter(a => a.hp < a.maxHp * 0.5);
            if (lowHpAllies.length > 0) {
                return {
                    action: '治疗',
                    target: lowHpAllies[0].name,
                    reason: '治疗低血量队友'
                };
            }
        }

        // 搜索血量最低的敌人
        const weakestEnemy = enemies.reduce((min, e) =>
            e.hp < min.hp ? e : min
        );

        if (weakestEnemy.hp < fighter.maxHp * 0.3) {
            return {
                action: '攻击',
                target: weakestEnemy.name,
                reason: '击杀残血敌人'
            };
        }

        // 否则防御
        return {
            action: '防御',
            target: fighter.name,
            reason: '血量较低，需要防御'
        };
    }

    // 中等血量策略
    mediumHpStrategy(fighter, enemies, allies, advice) {
        // 搜索威胁最大的敌人
        const biggestThreat = enemies.reduce((max, e) =>
            e.attack > max.attack ? e : max
        );

        // 高输出角色优先输出
        if (fighter.attack > 20) {
            return {
                action: '攻击',
                target: biggestThreat.name,
                reason: '针对高威胁目标'
            };
        }

        // 治疗角色优先治疗
        if (fighter.class === 'healer' && allies.length > 0) {
            const injuredAllies = allies.filter(a => a.hp < a.maxHp * 0.7);
            if (injuredAllies.length > 0) {
                return {
                    action: '治疗',
                    target: injuredAllies[0].name,
                    reason: '治疗队友'
                };
            }
        }

        // 普通攻击
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        return {
            action: '攻击',
            target: target.name,
            reason: '普通攻击'
        };
    }

    // 高血量策略
    highHpStrategy(fighter, enemies, allies, advice) {
        // 搜索最脆弱的敌人
        const target = this.selectBestTarget(fighter, enemies);

        // 根据角色类型选择动作
        switch (fighter.class) {
            case 'mage':
                return {
                    action: '蓄力',
                    target: target.name,
                    reason: '法师蓄力造成高伤害'
                };
            case 'assassin':
                return {
                    action: '突袭',
                    target: target.name,
                    reason: '刺客突袭要害'
                };
            case 'warrior':
                return {
                    action: '冲锋',
                    target: target.name,
                    reason: '战士冲锋攻击'
                };
            default:
                return {
                    action: '攻击',
                    target: target.name,
                    reason: '标准攻击'
                };
        }
    }

    // 选择最佳目标
    selectBestTarget(fighter, enemies) {
        // 综合考虑血量、威胁程度
        let bestScore = -1;
        let bestTarget = enemies[0];

        enemies.forEach(enemy => {
            let score = 0;

            // 血量越低分数越高
            score += (1 - enemy.hp / enemy.maxHp) * 50;

            // 威胁程度越高分数越高
            score += enemy.attack / fighter.defense * 20;

            // 治疗目标优先
            if (enemy.class === 'healer') {
                score += 30;
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        });

        return bestTarget;
    }
}

// 导出
window.CombatSystem = CombatSystem;
window.CombatAI = CombatAI;