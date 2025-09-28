import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js"

export default class WaveSystem {
    constructor(levelData, entityPrototypes, factory) {
        this.world = null;
        this.levelData = levelData;
        this.entityPrototypes = entityPrototypes;
        this.factory = factory;

        this.currentWaveIndex = -1;
        this.waveTimer = 10; // Задержка перед первой волной
        this.zombiePool = [];
        this.activeZombies = new Set();

        this.isCompleted = false;
        this.totalSpawnPoints = this.levelData.waves.reduce((sum, wave) => sum + wave.spawnPoints, 0);
        this.spawnPointsSpent = 0;

        this.isWaitingForHugeWave = false;
        this.announcementTimer = 0;
        this.ANNOUNCEMENT_DURATION = 4.0; 

        this.setupZombiePool();
        this.publishProgress();
    }

    setupZombiePool() {
        this.zombiePool = this.levelData.availableZombies.map(name => {
            return { name, cost: this.entityPrototypes[name].spawnCost };
        }).filter(z => z.cost > 0);
        Debug.log('WaveSystem: Zombie pool initialized:', this.zombiePool);
    }

    update(deltaTime) {
        if (!this.factory || !this.factory.grid) return;

        if (this.isWaitingForHugeWave) {
            this.announcementTimer -= deltaTime;
            if (this.announcementTimer <= 0) {
                this.isWaitingForHugeWave = false;
                this.spawnHugeWave(); // Запускаем саму волну
            }
            return;
        }

        // Пока просто запускаем волны по таймеру
        this.waveTimer -= deltaTime;
        if (this.waveTimer <= 0 && this.currentWaveIndex < this.levelData.waves.length - 1) {
            this.prepareNextWave();
        }

        if (!this.isWaitingForHugeWave && 
            this.currentWaveIndex >= this.levelData.waves.length - 1 &&
            this.world.getEntitiesWithComponents('ZombieComponent').length === 0) 
        {
            // Дополнительная проверка: убедимся, что мы уже потратили все очки спавна.
            // Это предотвратит победу, если последняя волна была "огромной", но еще не заспавнилась.
            if (this.spawnPointsSpent >= this.totalSpawnPoints) {
                this.isCompleted = true;
                Debug.log("--- ALL WAVES DEFEATED! YOU WIN! ---");
                eventBus.publish('game:win');
                this.world.removeSystem(this);
            }
        }
    }

    prepareNextWave() {
        this.currentWaveIndex++;
        const waveData = this.levelData.waves[this.currentWaveIndex];
        
        // Если это большая волна, запускаем объявление
        if (waveData.type === 'huge') {
            eventBus.publish('hud:show_huge_wave_announcement');
            this.isWaitingForHugeWave = true;
            this.announcementTimer = this.ANNOUNCEMENT_DURATION;
            // Сама волна заспавнится позже, когда таймер истечет
        } else {
            // Обычные волны спавнятся сразу
            this.spawnWave(waveData);
        }
    }

    spawnWave(waveData) {
        this.waveTimer = waveData.delayAfter;
        Debug.log(`--- Spawning Wave ${this.currentWaveIndex + 1} ---`, waveData);
        
        let budget = waveData.spawnPoints;
        this.spawnPointsSpent += budget;
        const spawnList = [];

        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget);
            if (affordableZombies.length === 0) break;
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);
            budget -= chosenZombie.cost;
        }
        
        this.spawnGroup(spawnList);
        this.publishProgress();
    }
    spawnHugeWave() {
        const waveData = this.levelData.waves[this.currentWaveIndex];
        this.spawnWave(waveData);
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
        const shuffledRows = Array.from({ length: grid.rows }, (_, i) => i)
            .sort(() => Math.random() - 0.5);

        let rowIndex = 0;
        for (const name of zombieNames) {
            const row = shuffledRows[rowIndex % shuffledRows.length];
            
            // Позиция спавна за правым краем экрана
            const spawnX = grid.offsetX + grid.width - 50 + (Math.random() * 10);
            const spawnY = grid.getWorldPos(row, 0).y; // Y-координата центра ряда

            const entityId = this.factory.create(name, { x: spawnX, y: spawnY });

            // Центрируем зомби по вертикали
            const pos = this.world.getComponent(entityId, 'PositionComponent');
            if (pos) {
                pos.y -= pos.height / 2;
            }
            
            rowIndex++;
        }
    }
}