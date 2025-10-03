import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import DyingComponent from "../components/DyingComponent.js";
import ScaleAnimationComponent from "../components/ScaleAnimationComponent.js";

export default class DamageSystem {
    constructor(waveSystem) {
        this.world = null;
        this.waveSystem = waveSystem;
        eventBus.subscribe('collision:detected', this.handleProjectileCollision.bind(this));
        eventBus.subscribe('melee:hit', this.handleMeleeHit.bind(this));
    }

    applyDamage(targetId, damage) {
        const armor = this.world.getComponent(targetId, 'ArmorComponent');
        if (armor && armor.currentHealth > 0) {
            armor.currentHealth -= damage;
        } else {
            const health = this.world.getComponent(targetId, 'HealthComponent');
            if (health) {
                const isAlreadyDead = health.currentHealth <= 0;
                health.currentHealth -= damage;
                if (health.currentHealth <= 0 && !isAlreadyDead) {
                    if (this.world.getComponent(targetId, 'PlantComponent')) {
                        eventBus.publish('plant:death', { entityId: targetId });
                    }
                    this.initiateDeath(targetId);
                }
            }
        }
    }

    initiateDeath(entityId) {
        Debug.log(`Entity ${entityId} has been defeated. Starting death sequence.`);
        
        this.checkForLastZombie(entityId);

        this.world.removeComponent(entityId, 'VelocityComponent');
        this.world.removeComponent(entityId, 'AttackingComponent');
        this.world.removeComponent(entityId, 'HitboxComponent');
        this.world.removeComponent(entityId, 'ArmorComponent'); 
        
        this.world.addComponent(entityId, new DyingComponent(2.9));
    }

    checkForLastZombie(defeatedZombieId) {
        if (!this.waveSystem || !this.world.getComponent(defeatedZombieId, 'ZombieComponent')) {
            return;
        }

        const isFinalWave = this.waveSystem.currentWaveIndex === this.waveSystem.levelData.waves.length - 1;
        
        // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
        // 1. Находим ВСЕХ зомби, которые еще НЕ умирают.
        const otherZombiesOnField = this.world.getEntitiesWithComponents('ZombieComponent')
                                        .filter(id => 
                                            id !== defeatedZombieId && 
                                            !this.world.getComponent(id, 'DyingComponent')
                                        );

        // 2. Условие: это финальная волна, ДРУГИХ зомби на поле не осталось (длина массива 0),
        // и мы еще не роняли трофей.
        if (isFinalWave && otherZombiesOnField.length === 0 && !this.waveSystem.isTrophyDropped) {
        // --- ^^^ КОНЕЦ КЛЮЧЕВОГО ИСПРАВЛЕНИЯ ^^^ ---
            this.waveSystem.isTrophyDropped = true;
            const pos = this.world.getComponent(defeatedZombieId, 'PositionComponent');

            if (pos) {
                const trophyId = this.world.factory.create('trophy', { x: pos.x, y: pos.y });
                if (trophyId !== null) {
                    const trophyPos = this.world.getComponent(trophyId, 'PositionComponent');
                    trophyPos.scale = 0.1;
                    this.world.addComponent(trophyId, new ScaleAnimationComponent(1.0, 3.0));
                    Debug.log(`DEATH BLOW! Last zombie (${defeatedZombieId}) defeated. Dropping victory trophy (${trophyId}).`);
                }
            }
        }
    }

    handleProjectileCollision(data) {
        const { projectileId, targetId } = data;
        const projectile = this.world.getComponent(projectileId, 'ProjectileComponent');
        if (!projectile) return;
        this.applyDamage(targetId, projectile.damage);
        this.world.addComponent(projectileId, new RemovalComponent());
    }

    handleMeleeHit(data) {
        const { targetId, damage } = data;
        this.applyDamage(targetId, damage);
    }
    
    update() {} 
}