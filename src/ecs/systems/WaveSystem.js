import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";

export default class WaveSystem {
    constructor(levelData, entityPrototypes, factory) {
        this.world = null;
        this.levelData = levelData;
        this.entityPrototypes = entityPrototypes;
        this.factory = factory;
         this.isStopped = false;

        this.currentWaveIndex = -1;
        this.waveTimer = 5; // Небольшая задержка перед первой волной
        this.zombiePool = [];

        this.isCompleted = false;
        this.totalSpawnPoints = this.levelData.waves.reduce((sum, wave) => sum + wave.spawnPoints, 0);
        this.spawnPointsSpent = 0;

        this.isWaitingForHugeWave = false;
        this.announcementTimer = 0;
        this.ANNOUNCEMENT_DURATION = 4.0; 

        this.totalZombiesToSpawn = this.calculateTotalZombies();
        this.zombiesDefeated = 0;
        this.isFinalZombieMarked = false;

        // --- НОВЫЙ ПОДПИСЧИК ---
        eventBus.subscribe('zombie:defeated', () => this.onZombieDefeated());
        eventBus.subscribe('game:start_lose_sequence', () => {
            Debug.log("WaveSystem: Lose sequence detected. Halting all operations.");
            this.isStopped = true;
        });

        this.setupZombiePool();
        this.publishProgress();
    }
    calculateTotalZombies() {
        let count = 0;
        // Приблизительный расчет, можно сделать точнее, если "проиграть" спавн
        for(const wave of this.levelData.waves) {
            count += wave.spawnPoints; // Грубый подсчет, т.к. зомби стоят > 1
        }
        return Math.max(1, count); // Убедимся, что не ноль
    }
    onZombieDefeated() {
        this.zombiesDefeated++;
        const zombiesOnField = this.world.getEntitiesWithComponents('ZombieComponent').length;

        // Условие: последняя волна активна И на поле остался 1 зомби И мы еще не помечали его
        if (this.currentWaveIndex === this.levelData.waves.length - 1 && zombiesOnField === 1 && !this.isFinalZombieMarked) {
             const lastZombieId = this.world.getEntitiesWithComponents('ZombieComponent')[0];
             if (lastZombieId) {
                 this.world.addComponent(lastZombieId, new DropsTrophyOnDeathComponent());
                 this.isFinalZombieMarked = true;
                 Debug.log(`Last zombie (${lastZombieId}) has been marked to drop the trophy.`);
             }
        }
    }
    setupZombiePool() {
        this.zombiePool = this.levelData.availableZombies.map(name => {
            const proto = this.entityPrototypes[name];
            if (!proto || !proto.spawnCost) return null;
            return { name, cost: proto.spawnCost };
        }).filter(z => z !== null);
        Debug.log('WaveSystem: Zombie pool initialized:', this.zombiePool);
    }

    update(deltaTime) {
        if (this.isStopped || !this.factory || !this.factory.grid) return;
        if (!this.factory || !this.factory.grid) return;

        if (this.isWaitingForHugeWave) {
            this.announcementTimer -= deltaTime;
            if (this.announcementTimer <= 0) {
                this.isWaitingForHugeWave = false;
                this.spawnHugeWave();
            }
            return;
        }

        this.waveTimer -= deltaTime;
        if (this.waveTimer <= 0 && this.currentWaveIndex < this.levelData.waves.length - 1) {
            this.prepareNextWave();
        }
        
        // --- VVV ОБНОВЛЕННАЯ ЛОГИКА ПОБЕДЫ VVV ---
        // Условие победы: пройдена последняя волна И на поле не осталось зомби.
        if (this.currentWaveIndex >= this.levelData.waves.length - 1 &&
            this.world.getEntitiesWithComponents('ZombieComponent').length === 0) 
        {
            // Дополнительная проверка: убедимся, что мы уже потратили *почти* все очки спавна.
            // Это предотвратит победу, если последняя волна была "огромной", но еще не заспавнилась.
            if (!this.isCompleted && !this.isStopped && this.spawnPointsSpent >= this.totalSpawnPoints) {
                this.isCompleted = true;
                Debug.log("--- ALL WAVES DEFEATED! YOU WIN! ---");
                eventBus.publish('game:win');
                // Не удаляем систему, чтобы она не пыталась запуститься снова
            }
        }
        // --- ^^^ КОНЕЦ ОБНОВЛЕННОЙ ЛОГИКИ ^^^ ---
    }

    prepareNextWave() {
        this.currentWaveIndex++;
        const waveData = this.levelData.waves[this.currentWaveIndex];
        
        if (waveData.type === 'huge') {
            eventBus.publish('hud:show_huge_wave_announcement');
            this.isWaitingForHugeWave = true;
            this.announcementTimer = this.ANNOUNCEMENT_DURATION;
        } else {
            this.spawnWave(waveData);
        }
    }

    spawnWave(waveData) {
        this.waveTimer = waveData.delayAfter;
        Debug.log(`--- Spawning Wave ${this.currentWaveIndex + 1} ---`, waveData);
        
        let budget = waveData.spawnPoints;
        const spawnList = [];

        // --- VVV ИСПРАВЛЕННАЯ ЛОГИКА БЮДЖЕТА VVV ---
        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget);
            if (affordableZombies.length === 0) break;
            
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);
            
            // Уменьшаем бюджет и УВЕЛИЧИВАЕМ СЧЕТЧИК ПОТРАЧЕННЫХ ОЧКОВ
            budget -= chosenZombie.cost;
            this.spawnPointsSpent += chosenZombie.cost; 
        }
        // --- ^^^ КОНЕЦ ИСПРАВЛЕННОЙ ЛОГИКИ ^^^ ---
        
        this.spawnGroup(spawnList);
        this.publishProgress();
    }

    spawnHugeWave() {
        const waveData = this.levelData.waves[this.currentWaveIndex];
        let budget = waveData.spawnPoints;
        const spawnList = [];

        Debug.log(`--- Spawning HUGE Wave ${this.currentWaveIndex + 1} with Flag Zombie ---`, waveData);
        
        const flagZombieProto = this.entityPrototypes['zombie_flag'];
        if (flagZombieProto && budget >= flagZombieProto.spawnCost) {
            spawnList.push('zombie_flag');
            budget -= flagZombieProto.spawnCost;
            this.spawnPointsSpent += flagZombieProto.spawnCost;
        }

        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget && z.name !== 'zombie_flag');
            if (affordableZombies.length === 0) break;
            
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);

            budget -= chosenZombie.cost;
            this.spawnPointsSpent += chosenZombie.cost;
        }
        
        this.spawnGroup(spawnList);
        this.publishProgress();
    }

    publishProgress() {
        const hugeWaveIndices = this.levelData.waves.map((wave, index) => wave.type === 'huge' ? index : -1).filter(index => index !== -1);
        eventBus.publish('wave:progress', {
            current: this.spawnPointsSpent,
            total: this.totalSpawnPoints,
            totalWaves: this.levelData.waves.length,
            hugeWaveIndices: hugeWaveIndices
        });
    }

    spawnGroup(zombieNames) {
        const grid = this.factory.grid;
        if (!grid) return;
        const shuffledRows = Array.from({ length: grid.rows }, (_, i) => i).sort(() => Math.random() - 0.5);
        let rowIndex = 0;
        for (const name of zombieNames) {
            const row = shuffledRows[rowIndex % shuffledRows.length];
            const spawnX = grid.offsetX + grid.width + 50 + (Math.random() * 50);
            const spawnY = grid.getWorldPos(row, 0).y;
            const entityId = this.factory.create(name, { x: spawnX, y: spawnY });
            
            // В GameplayState.js уже есть эта логика, но для надежности можно оставить
            // const pos = this.world.getComponent(entityId, 'PositionComponent');
            // if (pos) { pos.y -= pos.height / 2; }

            rowIndex++;
        }
    }
}