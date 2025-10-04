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
        let remainingDamage = damage; 

        const armor = this.world.getComponent(targetId, 'ArmorComponent');
        if (armor && armor.currentHealth > 0) {
            const damageToArmor = Math.min(remainingDamage, armor.currentHealth);
            armor.currentHealth -= damageToArmor;
            remainingDamage -= damageToArmor;
        }

        if (remainingDamage > 0) {
            const health = this.world.getComponent(targetId, 'HealthComponent');
            if (health) {
                const isAlreadyDead = health.currentHealth <= 0;
                health.currentHealth -= remainingDamage;

                if (health.currentHealth <= 0 && !isAlreadyDead) {
                    const isPlant = this.world.getComponent(targetId, 'PlantComponent');

                    if (isPlant) {
                        Debug.log(`Plant ${targetId} was eaten. Marking for immediate removal.`);
                        eventBus.publish('plant:death', { entityId: targetId });
                        this.world.addComponent(targetId, new RemovalComponent());
                    } else {
                        this.initiateDeath(targetId);
                    }
                }
            }
        }
    }

    initiateDeath(entityId) {
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