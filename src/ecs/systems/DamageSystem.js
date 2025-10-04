import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import DyingComponent from "../components/DyingComponent.js";

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
            return; // Выходим, если урон поглотила броня
        }

        const health = this.world.getComponent(targetId, 'HealthComponent');
        if (health) {
            const isAlreadyDead = health.currentHealth <= 0;
            health.currentHealth -= damage;

            // Если здоровье только что закончилось
            if (health.currentHealth <= 0 && !isAlreadyDead) {
                
                // --- НАЧАЛО КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---
                const isPlant = this.world.getComponent(targetId, 'PlantComponent');

                if (isPlant) {
                    // ЭТО РАСТЕНИЕ: Мгновенное удаление
                    Debug.log(`Plant ${targetId} was eaten. Marking for immediate removal.`);
                    eventBus.publish('plant:death', { entityId: targetId });
                    this.world.addComponent(targetId, new RemovalComponent());
                } else {
                    // ЭТО НЕ РАСТЕНИЕ (значит, зомби): Запускаем анимацию смерти
                    this.initiateDeath(targetId);
                }
                // --- КОНЕЦ КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---
            }
        }
    }

    initiateDeath(entityId) {
        // Этот метод теперь используется только для сущностей с анимацией смерти (зомби)
        Debug.log(`Entity ${entityId} has been defeated. Starting death sequence.`);
        
        const pos = this.world.getComponent(entityId, 'PositionComponent');
        if (pos) {
            this.waveSystem.checkForVictoryCondition(entityId, pos);
        }

        this.world.removeComponent(entityId, 'VelocityComponent');
        this.world.removeComponent(entityId, 'AttackingComponent');
        this.world.removeComponent(entityId, 'HitboxComponent');
        this.world.removeComponent(entityId, 'ArmorComponent'); 
        
        this.world.addComponent(entityId, new DyingComponent(2.9));
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