import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
import soundManager from "../../core/SoundManager.js";
import ArcMovementComponent from "../components/ArcMovementComponent.js";

export default class WaveSystem {
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
                this.world.addComponent(trophyId, new ArcMovementComponent(
                    40,       
                    -200,     
                    800,      
                    position.y + 0 
                ));
                Debug.log(`VICTORY CONDITION MET! Last zombie (${defeatedZombieId}) defeated. Spawning trophy with arc movement.`);
            }
            return true;
        }
        
        return false;
    }

    reset() {
        this.currentWaveIndex = -1;
        this.waveTimer = 5;
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
        
        this.publishProgress();

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
        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget && z.name !== 'zombie_flag');
            if (affordableZombies.length === 0) break;
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);
            budget -= chosenZombie.cost;
        }
        this.spawnGroup(spawnList);
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
        }

        while (budget > 0) {
            const affordableZombies = this.zombiePool.filter(z => z.cost <= budget && z.name !== 'zombie_flag');
            if (affordableZombies.length === 0) break;
            const chosenZombie = affordableZombies[Math.floor(Math.random() * affordableZombies.length)];
            spawnList.push(chosenZombie.name);
            budget -= chosenZombie.cost;
        }
        this.spawnGroup(spawnList);
    }
    publishProgress() {
        const hugeWaveIndices = this.levelData.waves.map((wave, index) => wave.type === 'huge' ? index : -1).filter(index => index !== -1);
        eventBus.publish('wave:progress', {
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