import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import DyingComponent from "../components/DyingComponent.js";
// --- VVV УДАЛИТЬ НЕИСПОЛЬЗУЕМЫЙ ИМПОРТ VVV ---
// import ScaleAnimationComponent from "../components/ScaleAnimationComponent.js";

export default class DamageSystem {
    constructor(waveSystem) {
        this.world = null;
        this.waveSystem = waveSystem;
        eventBus.subscribe('collision:detected', this.handleProjectileCollision.bind(this));
        eventBus.subscribe('melee:hit', this.handleMeleeHit.bind(this));
    }

    applyDamage(targetId, damage) {
        // ... (метод applyDamage без изменений)
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
        
        // --- VVV ИЗМЕНЕНИЕ: Теперь мы просто вызываем метод из WaveSystem VVV ---
        const pos = this.world.getComponent(entityId, 'PositionComponent');
        if (pos) {
            this.waveSystem.checkForVictoryCondition(entityId, pos);
        }
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---

        this.world.removeComponent(entityId, 'VelocityComponent');
        this.world.removeComponent(entityId, 'AttackingComponent');
        this.world.removeComponent(entityId, 'HitboxComponent');
        this.world.removeComponent(entityId, 'ArmorComponent'); 
        
        this.world.addComponent(entityId, new DyingComponent(2.9));
    }
    
    // --- VVV УДАЛИТЬ ВЕСЬ МЕТОД checkForLastZombie VVV ---
    // checkForLastZombie(defeatedZombieId) { ... }

    // ... (остальные методы handleProjectileCollision, handleMeleeHit и update без изменений)
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