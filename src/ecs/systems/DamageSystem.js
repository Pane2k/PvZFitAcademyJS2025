// src/ecs/systems/DamageSystem.js
import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import DyingComponent from "../components/DyingComponent.js"; // <-- Добавляем импорт

export default class DamageSystem {
    constructor() {
        this.world = null;
        eventBus.subscribe('collision:detected', this.handleProjectileCollision.bind(this));
        eventBus.subscribe('melee:hit', this.handleMeleeHit.bind(this));
    }

    applyDamage(targetId, damage) {
        // --- VVV НОВАЯ УНИВЕРСАЛЬНАЯ ЛОГИКА УРОНА VVV ---
        const armor = this.world.getComponent(targetId, 'ArmorComponent');
        if (armor && armor.currentHealth > 0) {
            armor.currentHealth -= damage;
            Debug.log(`Entity ${targetId} armor took ${damage} damage. Armor Health: ${armor.currentHealth}`);
        } else {
            const health = this.world.getComponent(targetId, 'HealthComponent');
            if (health) {
                health.currentHealth -= damage;
                Debug.log(`Entity ${targetId} took ${damage} damage. Health: ${health.currentHealth}`);

                if (health.currentHealth <= 0 && !this.world.getComponent(targetId, 'DyingComponent')) {
                    this.initiateDeath(targetId);
                }
            }
        }
    }

    initiateDeath(entityId) {
        Debug.log(`Entity ${entityId} has been defeated. Starting death sequence.`);
        
        // Убираем все, что может помешать анимации смерти
        this.world.removeComponent(entityId, 'VelocityComponent');
        this.world.removeComponent(entityId, 'AttackingComponent');
        this.world.removeComponent(entityId, 'HitboxComponent');
        this.world.removeComponent(entityId, 'ArmorComponent'); // На случай, если броня сломалась одновременно со смертью
        
        // Добавляем компонент-таймер смерти
        this.world.addComponent(entityId, new DyingComponent(2.9)); // Длительность анимации dying ~70 кадров / 24 fps ≈ 2.9 сек
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