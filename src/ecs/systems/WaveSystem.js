import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
import soundManager from "../../core/SoundManager.js";
// --- VVV НОВЫЙ ИМПОРТ VVV ---
import ArcMovementComponent from "../components/ArcMovementComponent.js";

export default class WaveSystem {
    // ... (конструктор и другие методы до update без изменений)
    constructor(levelData, entityPrototypes, factory) {
        this.world = null;
        this.levelData = levelData;
        this.entityPrototypes = entityPrototypes;
        this.factory = factory;
        this.isStopped = false;

        this.currentWaveIndex = -1;
        this.waveTimer = 5;
        this.zombiePool = [];

        this.isCompleted = false;
        this.totalSpawnPoints = this.levelData.waves.reduce((sum, wave) => sum + wave.spawnPoints, 0);
        // this.spawnPointsSpent = 0;

        this.isWaitingForHugeWave = false;
        this.announcementTimer = 0;
        this.ANNOUNCEMENT_DURATION = 4.0; 

        this.isTrophyDropped = false;
        this.isFirstZombieSpawned = false;
        eventBus.subscribe('game:start_lose_sequence', () => {
            Debug.log("WaveSystem: Lose sequence detected. Halting all operations.");
            this.isStopped = true;
        });

        this.setupZombiePool();
        this.publishProgress();
    }

    // --- VVV НОВЫЙ МЕТОД ДЛЯ ПРОВЕРКИ ПОБЕДЫ И СПАВНА ТРОФЕЯ VVV ---
    checkForVictoryCondition(defeatedZombieId, position) {
        if (this.isTrophyDropped) return false;

        const isFinalWave = this.currentWaveIndex === this.levelData.waves.length - 1;
        if (!isFinalWave) return false;

        const otherZombies = this.world.getEntitiesWithComponents('ZombieComponent')
            .filter(id => id !== defeatedZombieId && !this.world.getComponent(id, 'DyingComponent'));
        
        if (otherZombies.length === 0) {
            this.isTrophyDropped = true;

            const trophyId = this.factory.create('trophy', { x: position.x, y: position.y });
            if (trophyId !== null) {
                // Добавляем компонент для полета по дуге НАЗАД
                this.world.addComponent(trophyId, new ArcMovementComponent(
                    40,       // vx: небольшая скорость вправо (покажется, что назад от зомби)
                    -200,     // vy: начальная скорость вверх
                    800,      // gravity: сила притяжения
                    position.y + 0 // targetY: куда приземлиться (чуть ниже точки старта)
                ));
                Debug.log(`VICTORY CONDITION MET! Last zombie (${defeatedZombieId}) defeated. Spawning trophy with arc movement.`);
            }
            return true;
        }
        
        return false;
    }

    // ... (остальные методы reset, update, setupZombiePool и т.д. без изменений)
    reset() {
        this.currentWaveIndex = -1;
        this.waveTimer = 5;
        // this.spawnPointsSpent = 0;
        this.isWaitingForHugeWave = false;
        this.isTrophyDropped = false;
        this.isStopped = false;
        this.isFirstZombieSpawned = false;
        Debug.log("WaveSystem has been reset to its initial state.");
    }

    update(deltaTime) {
        if (this.isStopped || !this.factory || !this.factory.grid) return;

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
    }
    
    setupZombiePool() {
        this.zombiePool = this.levelData.availableZombies.map(name => {
            const proto = this.entityPrototypes[name];
            if (!proto || !proto.spawnCost) return null;
            return { name, cost: proto.spawnCost };
        }).filter(z => z !== null);
        Debug.log('WaveSystem: Zombie pool initialized:', this.zombiePool);
    }
    prepareNextWave() {
        this.currentWaveIndex++;
        const waveData = this.levelData.waves[this.currentWaveIndex];
        
        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        
        // 1. Сначала рассчитываем, сколько очков будет потрачено в этой волне.
        // Это нужно, чтобы обновить прогресс-бар НЕМЕДЛЕННО.
   
        
        // 2. Публикуем обновленный прогресс СРАЗУ.
        // Флажок на HUD поднимется в этот самый момент.
        this.publishProgress();

        // 3. Теперь выполняем остальную логику.
        if (waveData.type === 'huge') {
            eventBus.publish('hud:show_huge_wave_announcement');
            this.isWaitingForHugeWave = true;
            this.announcementTimer = this.ANNOUNCEMENT_DURATION;
        } else {
            this.spawnWave(waveData);
        }
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    }
    spawnWave(waveData) {
        this.waveTimer = waveData.delayAfter;
        Debug.log(`--- Spawning Wave ${this.currentWaveIndex + 1} ---`, waveData);
        let budget = waveData.spawnPoints;
        const spawnList = [];
        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget && z.name !== 'zombie_flag');
            if (affordableZombies.length === 0) break;
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);
            budget -= chosenZombie.cost;
            // this.spawnPointsSpent += chosenZombie.cost; // <-- УДАЛИТЕ ИЛИ ЗАКОММЕНТИРУЙТЕ ЭТУ СТРОКУ
        }
        this.spawnGroup(spawnList);
        // this.publishProgress(); // <-- И ЭТУ ТОЖЕ, мы уже опубликовали прогресс
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
            // this.spawnPointsSpent += flagZombieProto.spawnCost; // <-- УДАЛИТЕ ЭТУ СТРОКУ
        }

        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget && z.name !== 'zombie_flag');
            if (affordableZombies.length === 0) break;
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);
            budget -= chosenZombie.cost;
            // this.spawnPointsSpent += chosenZombie.cost; // <-- И ЭТУ СТРОКУ
        }
        this.spawnGroup(spawnList);
        // this.publishProgress(); // <-- И ЭТУ ТОЖЕ
    }
    publishProgress() {
        // --- ИЗМЕНЕНИЕ: Передаем номер волны, а не очки
        const hugeWaveIndices = this.levelData.waves.map((wave, index) => wave.type === 'huge' ? index : -1).filter(index => index !== -1);
        eventBus.publish('wave:progress', {
            // currentWaveIndex начинается с -1, поэтому +1. 
            // Когда первая волна (индекс 0) начнется, мы отправим "1".
            currentWave: this.currentWaveIndex + 1,
            totalWaves: this.levelData.waves.length,
            hugeWaveIndices: hugeWaveIndices
        });
    }
    spawnGroup(zombieNames) {
        if (!this.isFirstZombieSpawned && zombieNames.length > 0) {
            soundManager.playSoundEffect('awooga');
            this.isFirstZombieSpawned = true;
            Debug.log("First zombie spawned, playing 'awooga' sound.");
        }
        const grid = this.factory.grid;
        if (!grid) return;
        const shuffledRows = Array.from({ length: grid.rows }, (_, i) => i).sort(() => Math.random() - 0.5);
        let rowIndex = 0;
        for (const name of zombieNames) {
            const row = shuffledRows[rowIndex % shuffledRows.length];
            const spawnX = grid.offsetX + grid.width + 50 + (Math.random() * 50);
            const spawnY = grid.getWorldPos(row, 0).y;
            this.factory.create(name, { x: spawnX, y: spawnY });
            rowIndex++;
        }
    }
}