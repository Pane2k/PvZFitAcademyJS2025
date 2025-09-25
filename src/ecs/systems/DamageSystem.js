import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";

export default class DamageSystem {
    constructor() {
        this.world = null;
        eventBus.subscribe('collision:detected', this.handleProjectileCollision.bind(this));
        eventBus.subscribe('melee:hit', this.handleMeleeHit.bind(this));

    }

    handleProjectileCollision(data) {
        const { projectileId, targetId } = data;

        const projectile = this.world.getComponent(projectileId, 'ProjectileComponent');
        const targetHealth = this.world.getComponent(targetId, 'HealthComponent');

        if (!projectile || !targetHealth) return;

        targetHealth.currentHealth -= projectile.damage;
        Debug.log(`Entity ${targetId} took ${projectile.damage} damage from projectile. Health: ${targetHealth.currentHealth}`);

        this.world.addComponent(projectileId, new RemovalComponent());

        if (targetHealth.currentHealth <= 0) {
            Debug.log(`Entity ${targetId} has been defeated.`);
            this.world.addComponent(targetId, new RemovalComponent());
        }
    }
    handleMeleeHit(data) {
        const { targetId, damage } = data;
        const targetHealth = this.world.getComponent(targetId, 'HealthComponent');

        if (!targetHealth) return;

        targetHealth.currentHealth -= damage;
        Debug.log(`Entity ${targetId} took ${damage} melee damage. Health: ${targetHealth.currentHealth}`);

        if (targetHealth.currentHealth <= 0) {
            Debug.log(`Entity ${targetId} has been defeated.`);
            this.world.addComponent(targetId, new RemovalComponent());
        }
    }
    // Пустой update нужен для формального соответствия, хотя система полностью управляется событиями
    update() {} 
}