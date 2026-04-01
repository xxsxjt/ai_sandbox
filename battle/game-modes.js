// 游戏模式管理系统
class GameModeManager {
    constructor() {
        this.currentMode = null;
        this.spectators = new Map();
        this.replaySystem = new ReplaySystem();
    }

    // 初始化游戏模式
    initializeMode(mode, fighters) {
        this.currentMode = mode;

        switch (mode) {
            case 'team':
                this.initializeTeamMode(fighters);
                break;
            case 'battle royale':
                this.initializeBattleRoyaleMode(fighters);
                break;
            case 'duel':
                this.initializeDuelMode(fighters);
                break;
            case 'chaos':
                this.initializeChaosMode(fighters);
                break;
        }
    }

    // 初始化团队模式
    initializeTeamMode(fighters) {
        // 使用团队战系统分队
        teamBattle.autoAssignTeams(fighters, 'balanced');

        // 创建团队UI
        this.createTeamUI();

        // 添加团队信息到游戏状态
        gameState.teamInfo = {
            team1: teamBattle.getTeamInfo('team1'),
            team2: teamBattle.getTeamInfo('team2')
        };

        addBattleMessage('system', '系统', `🎯 团队战模式开始！
${gameState.teamInfo.team1.name}: ${gameState.teamInfo.team1.members.map(f => f.name).join('、')}
${gameState.teamInfo.team2.name}: ${gameState.teamInfo.team2.members.map(f => f.name).join('、')}`);
    }

    // 初始化大逃杀模式
    initializeBattleRoyaleMode(fighters) {
        // 初始化大逃杀系统
        battleRoyale.initializeRoyale(fighters, 1000);

        // 创建大逃杀UI
        this.createBattleRoyaleUI();

        // 设置安全区域
        this.startZoneShrink();

        // 生成初始战利品通知
        addBattleMessage('system', '系统', '🏁 大逃杀模式开始！');
        addBattleMessage('system', '系统', '⚠️ 安全区域正在收缩，注意保持在圈内！');

        // 开始战利品刷新
        this.startLootSpawns();
    }

    // 初始化单挑模式
    initializeDuelMode(fighters) {
        if (fighters.length !== 2) {
            throw new Error('单挑模式需要 exactly 2 名玩家');
        }

        // 设置团队以便于管理
        fighters[0].team = 'duel1';
        fighters[1].team = 'duel2';

        // 创建单挑UI
        this.createDuelUI(fighters);

        addBattleMessage('system', '系统', '⚔️ 单挑模式开始！' +
            `${fighters[0].name} VS ${fighters[1].name}`);
    }

    // 初始化乱斗模式
    initializeChaosMode(fighters) {
        // 每个玩家都是独立团队
        fighters.forEach((fighter, index) => {
            fighter.team = `chaos_${index}`;
        });

        // 创建乱斗UI
        this.createChaosUI(fighters);

        addBattleMessage('system', '系统', '🌪️ 乱斗模式开始！所有玩家自由战斗！');
    }

    // 创建团队UI
    createTeamUI() {
        const teamInfoHtml = `
            <div class="team-info-panel">
                <div class="team-1">
                    <h3>🔵 Team 1</h3>
                    <div class="team-stats">
                        <span>存活: <span id="team1-alive">0</span></span>
                        <span>总血量: <span id="team1-hp">0</span>%</span>
                    </div>
                    <div class="team-members" id="team1-members"></div>
                </div>
                <div class="vs-divider">VS</div>
                <div class="team-2">
                    <h3>🔴 Team 2</h3>
                    <div class="team-stats">
                        <span>存活: <span id="team2-alive">0</span></span>
                        <span>总血量: <span id="team2-hp">0</span>%</span>
                    </div>
                    <div class="team-members" id="team2-members"></div>
                </div>
            </div>
        `;

        // 插入到战斗区域
        const battleField = document.getElementById('battle-field');
        if (battleField) {
            battleField.insertAdjacentHTML('afterbegin', teamInfoHtml);
        }

        // 定期更新团队信息
        setInterval(() => this.updateTeamUI(), 1000);
    }

    // 创建大逃杀UI
    createBattleRoyaleUI() {
        const royaleHtml = `
            <div class="battle-royale-panel">
                <div class="zone-info">
                    <h3>🛡️ 安全区域</h3>
                    <div class="zone-stats">
                        <span>半径: <span id="zone-radius">800</span>m</span>
                        <span>伤害: <span id="zone-damage">10</span>/秒</span>
                    </div>
                    <div class="zone-timer" id="zone-timer">下次收缩: 60s</div>
                </div>
                <div class="loot-info">
                    <h3>💰 战利品统计</h3>
                    <div class="loot-stats">
                        <span>已刷新: <span id="loot-count">50</span></span>
                        <span>已收集: <span id="loot-collected">0</span></span>
                    </div>
                </div>
            </div>
        `;

        const battleField = document.getElementById('battle-field');
        if (battleField) {
            battleField.insertAdjacentHTML('afterbegin', royaleHtml);
        }

        // 开始区域收缩计时
        this.zoneShrinkTimer = 60;
        this.startZoneTimer();
    }

    // 创建单挑UI
    createDuelUI(fighters) {
        const duelHtml = `
            <div class="duel-panel">
                <div class="duel-arena">
                    <div class="fighter-1" id="duel-fighter-1">
                        <div class="fighter-name">${fighters[0].name}</div>
                        <div class="fighter-hp"><span id="duel1-hp">100</span>%</div>
                    </div>
                    <div class="vs-badge">VS</div>
                    <div class="fighter-2" id="duel-fighter-2">
                        <div class="fighter-name">${fighters[1].name}</div>
                        <div class="fighter-hp"><span id="duel2-hp">100</span>%</div>
                    </div>
                </div>
                <div class="duel-stats">
                    <div class="round-info">回合: <span id="duel-round">0</span></div>
                    <div class="duel-timer">时间: <span id="duel-time">0:00</span></div>
                </div>
            </div>
        `;

        const battleField = document.getElementById('battle-field');
        if (battleField) {
            battleField.insertAdjacentHTML('afterbegin', duelHtml);
        }
    }

    // 创建乱斗UI
    createChaosUI(fighters) {
        const chaosHtml = `
            <div class="chaos-panel">
                <div class="chaos-header">
                    <h3>🌪️ 乱斗模式</h3>
                    <div class="chaos-stats">
                        <span>存活: <span id="chaos-alive">${fighters.length}</span></span>
                        <span>回合: <span id="chaos-round">0</span></span>
                    </div>
                </div>
                <div class="chaos-arena" id="chaos-arena"></div>
            </div>
        `;

        const battleField = document.getElementById('battle-field');
        if (battleField) {
            battleField.insertAdjacentHTML('afterbegin', chaosHtml);

            // 创建玩家位置显示
            const arena = document.getElementById('chaos-arena');
            fighters.forEach((fighter, i) => {
                const position = this.getRandomPosition();
                const fighterHtml = `
                    <div class="chaos-fighter" id="chaos-${fighter.id}"
                         style="left: ${position.x}px; top: ${position.y}px;">
                        <span class="fighter-name">${fighter.name}</span>
                        <span class="fighter-hp">100%</span>
                    </div>
                `;
                arena.insertAdjacentHTML('beforeend', fighterHtml);
            });
        }
    }

    // 获取随机位置
    getRandomPosition() {
        return {
            x: Math.random() * 800,
            y: Math.random() * 400
        };
    }

    // 更新团队UI
    updateTeamUI() {
        if (!gameState.teamInfo) return;

        const team1 = gameState.teamInfo.team1;
        const team2 = gameState.teamInfo.team2;

        // 更新团队1信息
        document.getElementById('team1-alive').textContent = team1.aliveCount;
        document.getElementById('team1-hp').textContent = team1.hpPercent;
        document.getElementById('team1-members').innerHTML = team1.alive
            .map(f => `<div class="member-status">${f.name} <span class="hp-bar">${(f.hp / f.maxHp * 100).toFixed(0)}%</span></div>`)
            .join('');

        // 更新团队2信息
        document.getElementById('team2-alive').textContent = team2.aliveCount;
        document.getElementById('team2-hp').textContent = team2.hpPercent;
        document.getElementById('team2-members').innerHTML = team2.alive
            .map(f => `<div class="member-status">${f.name} <span class="hp-bar">${(f.hp / f.maxHp * 100).toFixed(0)}%</span></div>`)
            .join('');
    }

    // 开始区域收缩
    startZoneShrink() {
        this.zoneInterval = setInterval(() => {
            battleRoyale.updateSafetyZone();

            // 更新UI
            document.getElementById('zone-radius').textContent =
                battleRoyale.safetyZone.radius.toFixed(0);
            document.getElementById('zone-damage').textContent =
                battleRoyale.safetyZone.damage;

            // 应用区域伤害
            gameState.fighters.forEach(fighter => {
                if (fighter.alive) {
                    const damageResult = battleRoyale.applyZoneDamage(fighter);
                    if (damageResult) {
                        addBattleMessage('damage', '系统',
                            `${damageResult.player}受到${damageResult.damage}点区域伤害！`);
                    }
                }
            });

            // 检查胜利条件
            const alive = gameState.fighters.filter(f => f.alive);
            if (alive.length === 1) {
                this.endGame('battle royale', alive[0]);
            }

        }, 30000); // 每30秒收缩一次
    }

    // 开始区域计时器
    startZoneTimer() {
        this.zoneTimerInterval = setInterval(() => {
            this.zoneShrinkTimer--;
            document.getElementById('zone-timer').textContent =
                `下次收缩: ${this.zoneShrinkTimer}s`;

            if (this.zoneShrinkTimer <= 0) {
                this.zoneShrinkTimer = 60;
                battleRoyale.updateSafetyZone();
            }
        }, 1000);
    }

    // 开始战利品刷新
    startLootSpawns() {
        this.lootInterval = setInterval(() => {
            // 随机生成新战利品
            if (Math.random() < 0.3) { // 30%概率刷新
                const lootTypes = ['health', 'damage_boost', 'shield', 'speed_boost'];
                const lootType = lootTypes[Math.floor(Math.random() * lootTypes.length)];

                const newLoot = {
                    type: lootType,
                    value: 20 + Math.floor(Math.random() * 30),
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    time: Date.now()
                };

                battleRoyale.lootSpawns.push(newLoot);

                addBattleMessage('system', '系统',
                    `💰 新的战利品出现在 (${newLoot.x.toFixed(0)}, ${newLoot.y.toFixed(0)})！`);
            }

            // 更新战利品统计
            document.getElementById('loot-count').textContent = battleRoyale.lootSpawns.length;
        }, 10000); // 每10秒刷新一次
    }

    // 添加观战者
    addSpectator(playerId, socket) {
        this.spectators.set(playerId, {
            socket: socket,
            joinTime: Date.now(),
            watching: 'global'
        });

        // 发送当前游戏状态
        this.sendGameStateToSpectator(playerId);
    }

    // 发送游戏状态给观战者
    sendGameStateToSpectator(playerId) {
        const spectator = this.spectators.get(playerId);
        if (!spectator) return;

        const gameState = {
            type: 'game_state',
            data: {
                currentRound: gameState.currentRound,
                fighters: gameState.fighters,
                mode: this.currentMode,
                timestamp: Date.now()
            }
        };

        spectator.socket.send(JSON.stringify(gameState));
    }

    // 检查胜利条件
    checkVictoryConditions() {
        if (this.currentMode === 'team') {
            return teamBattle.checkTeamVictory(gameState);
        } else if (this.currentMode === 'battle royale') {
            const alive = gameState.fighters.filter(f => f.alive);
            if (alive.length === 1) {
                return { winner: alive[0] };
            }
        } else if (this.currentMode === 'duel') {
            const alive = gameState.fighters.filter(f => f.alive);
            if (alive.length === 1) {
                return { winner: alive[0] };
            }
        } else if (this.currentMode === 'chaos') {
            const alive = gameState.fighters.filter(f => f.alive);
            if (alive.length === 1) {
                return { winner: alive[0] };
            } else if (gameState.currentRound >= gameState.maxRounds) {
                // 乱斗模式达到最大回合，血量最高者获胜
                const highestHp = alive.reduce((max, f) =>
                    f.hp > max.hp ? f : max
                );
                return { winner: highestHp };
            }
        }

        return null;
    }

    // 结束游戏
    endGame(mode, winner) {
        // 清除定时器
        if (this.zoneInterval) clearInterval(this.zoneInterval);
        if (this.zoneTimerInterval) clearInterval(this.zoneTimerInterval);
        if (this.lootInterval) clearInterval(this.lootInterval);

        // 生成战斗报告
        const report = battleFlow.generateBattleReport();

        // 显示胜利信息
        let victoryMessage = '';
        if (mode === 'team') {
            victoryMessage = `🎉 ${winner.name} 获得团队胜利！`;
        } else if (mode === 'battle royale') {
            victoryMessage = `🏆 ${winner.name} 赢得了大逃杀！`;
        } else if (mode === 'duel') {
            victoryMessage = `⚔️ ${winner.name} 赢得了单挑！`;
        } else if (mode === 'chaos') {
            victoryMessage = `🌪️ ${winner.name} 在乱斗中幸存！`;
        }

        addBattleMessage('victory', '系统', victoryMessage);
        addBattleMessage('report', '系统', '战斗统计：' +
            JSON.stringify(report.summary, null, 2));

        // 保存回放
        this.replaySystem.saveReplay(gameState, report);

        // 通知观战者
        this.notifySpectators({
            type: 'game_end',
            winner: winner,
            report: report
        });
    }

    // 通知观战者
    notifySpectators(message) {
        this.spectators.forEach((spectator, playerId) => {
            if (spectator.socket && spectator.socket.readyState === 1) {
                spectator.socket.send(JSON.stringify(message));
            }
        });
    }
}

// 战斗回放系统
class ReplaySystem {
    constructor() {
        this.replays = new Map();
        this.currentReplay = null;
    }

    // 开始录制回放
    startReplay(gameId) {
        this.currentReplay = {
            id: gameId,
            startTime: Date.now(),
            gameMode: gameState.battleMode,
            fighters: gameState.fighters.map(f => ({
                id: f.id,
                name: f.name,
                class: f.class,
                team: f.team
            })),
            rounds: [],
            metadata: {
                totalDuration: 0,
                totalDamage: 0,
                totalKills: 0
            }
        };

        this.replays.set(gameId, this.currentReplay);
    }

    // 记录回合
    recordRound(roundNumber, results) {
        if (!this.currentReplay) return;

        const roundData = {
            round: roundNumber,
            timestamp: Date.now(),
            actions: results.map(r => ({
                attacker: r.attacker,
                defender: r.defender,
                action: r.action,
                damage: r.damage,
                effects: {
                    crit: r.crit,
                    dodge: r.dodge,
                    block: r.block,
                    counter: r.counter
                }
            })),
            fighterStates: gameState.fighters.map(f => ({
                id: f.id,
                name: f.name,
                hp: f.hp,
                maxHp: f.maxHp,
                alive: f.alive
            }))
        };

        this.currentReplay.rounds.push(roundData);
    }

    // 保存回放
    saveReplay(gameState, report) {
        if (!this.currentReplay) return;

        const duration = Date.now() - this.currentReplay.startTime;
        this.currentReplay.metadata = {
            ...this.currentReplay.metadata,
            totalDuration: duration,
            totalDamage: report.summary.totalCombats * 20, // 估算
            totalKills: gameState.fighters.filter(f => !f.alive).length
        };

        // 添加完整战斗日志
        this.currentReplay.fullLog = battleFlow.combatLog;

        // 压缩并存储
        const compressedReplay = JSON.stringify(this.currentReplay);
        localStorage.setItem(`replay_${this.currentReplay.id}`, compressedReplay);

        // 添加到可用回放列表
        this.addReplayToList(this.currentReplay);
    }

    // 添加到回放列表
    addReplayToList(replay) {
        const replayList = document.getElementById('replay-list');
        if (!replayList) return;

        const duration = this.formatDuration(replay.metadata.totalDuration);
        const replayItem = document.createElement('div');
        replayItem.className = 'replay-item';
        replayItem.innerHTML = `
            <div class="replay-header">
                <span class="replay-id">#${replay.id.slice(-6)}</span>
                <span class="replay-mode">${replay.gameMode}</span>
                <span class="replay-duration">${duration}</span>
            </div>
            <div class="replay-actions">
                <button onclick="playReplay('${replay.id}')">播放</button>
                <button onclick="downloadReplay('${replay.id}')">下载</button>
                <button onclick="deleteReplay('${replay.id}')">删除</button>
            </div>
        `;

        replayList.appendChild(replayItem);
    }

    // 播放回放
    playReplay(replayId) {
        const replayData = this.replays.get(replayId) ||
            JSON.parse(localStorage.getItem(`replay_${replayId}`));

        if (!replayData) {
            alert('回放不存在！');
            return;
        }

        // 重置游戏状态
        gameState.fighters.forEach(f => {
            const original = replayData.fighters.find(of => of.id === f.id);
            if (original) {
                f.hp = original.maxHp;
                f.alive = true;
            }
        });

        // 播放回放
        let roundIndex = 0;
        const playNextRound = () => {
            if (roundIndex >= replayData.rounds.length) {
                alert('回放播放完成！');
                return;
            }

            const round = replayData.rounds[roundIndex];

            // 显示回合信息
            addBattleMessage('replay', '回放', `--- 第 ${round.round} 回合 ---`);

            // 执行回合行动
            round.actions.forEach(action => {
                addBattleMessage('action', action.attacker,
                    `${action.attacker}对${action.defender}使用${action.action}`);

                if (action.damage > 0) {
                    addBattleMessage('damage', action.defender,
                        `受到${action.damage}点伤害${action.effects.crit ? '（暴击）' : ''}`);
                }
            });

            roundIndex++;
            setTimeout(playNextRound, 2000); // 每2秒一回合
        };

        playNextRound();
    }

    // 下载回放
    downloadReplay(replayId) {
        const replayData = this.replays.get(replayId) ||
            JSON.parse(localStorage.getItem(`replay_${replayId}`));

        if (!replayData) return;

        const dataStr = JSON.stringify(replayData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `replay_${replayId}.json`;
        link.click();

        URL.revokeObjectURL(url);
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

    // 加载历史回放
    loadHistoricalReplays() {
        const replayList = document.getElementById('replay-list');
        if (!replayList) return;

        // 获取所有回放
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('replay_')) {
                const replayId = key.replace('replay_', '');
                const replayData = JSON.parse(localStorage.getItem(key));
                this.replays.set(replayId, replayData);
                this.addReplayToList(replayData);
            }
        }
    }
}

// 导出
window.GameModeManager = GameModeManager;
window.ReplaySystem = ReplaySystem;