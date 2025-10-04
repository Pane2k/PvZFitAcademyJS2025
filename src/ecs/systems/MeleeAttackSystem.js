import AttackingComponent from "../components/AttackingComponent.js";
import VelocityComponent from "../components/VelocityComponent.js";
import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";

export default class MeleeAttackSystem {
    constructor() {
        this.world = null;
    }

        
update(deltaTime) {
    this.findTargets();
    this.processAttacks(deltaTime);
}

findTargets() {
    const attackers = this.world.getEntitiesWithComponents('MeleeAttackComponent', 'PositionComponent', 'VelocityComponent');
    const targets = this.world.getEntitiesWithComponents('PlantComponent', 'PositionComponent', 'HealthComponent', 'HitboxComponent');

    for (const attackerId of attackers) {
        const attackerPos = this.world.getComponent(attackerId, 'PositionComponent');
        const attackerBox = this.world.getComponent(attackerId, 'HitboxComponent');
        
        if (!attackerPos || !attackerBox) continue; 

        const attackRange = 10;
        const attackBox = {
            x: attackerPos.x + attackerBox.offsetX - attackerBox.width / 2 - attackRange,
            y: attackerPos.y + attackerBox.offsetY - attackerBox.height / 2,
            width: attackRange,
            height: attackerBox.height
        };

        for (const targetId of targets) {
            const targetPos = this.world.getComponent(targetId, 'PositionComponent');
            const targetBox = this.world.getComponent(targetId, 'HitboxComponent');
            
            if (!targetPos || !targetBox) continue;

            const targetRect = {
                x: targetPos.x + targetBox.offsetX - targetBox.width / 2,
                y: targetPos.y + targetBox.offsetY - targetBox.height / 2,
                width: targetBox.width,
                height: targetBox.height
            };

            if (attackBox.x < targetRect.x + targetRect.width &&
                attackBox.x + attackBox.width > targetRect.x &&
                attackBox.y < targetRect.y + targetRect.height &&
                attackBox.y + attackBox.height > targetRect.y)
            {
                Debug.log(`Entity ${attackerId} is in range of ${targetId}. Starting attack.`);
                this.world.removeComponent(attackerId, 'VelocityComponent');
                this.world.addComponent(attackerId, new AttackingComponent(targetId));
                break; 
            }
        }
    }
}

processAttacks(deltaTime) {
    const attackingEntities = this.world.getEntitiesWithComponents('AttackingComponent', 'MeleeAttackComponent');

    for (const attackerId of attackingEntities) {
        const attackState = this.world.getComponent(attackerId, 'AttackingComponent');
        const attackParams = this.world.getComponent(attackerId, 'MeleeAttackComponent');

        const targetExists = this.world.entities.has(attackState.targetId);

        if (!targetExists) {
            Debug.log(`Entity ${attackerId} target is gone, resumes walking.`);
            this.world.removeComponent(attackerId, 'AttackingComponent');
            
            const prefab = this.world.getComponent(attackerId, 'PrefabComponent');
            if (prefab) {
                const proto = this.world.factory.prototypes[prefab.name];
                const velProto = proto?.components?.VelocityComponent;
                if (velProto) {
                    const speed = velProto.baseSpeed + (Math.random() * 2 - 1) * (velProto.speedVariance || 0);
                    this.world.addComponent(attackerId, new VelocityComponent(speed, 0));
                }
            }
            continue;
        }

        attackParams.cooldown -= deltaTime;
        if (attackParams.cooldown <= 0) {
            attackParams.cooldown = attackParams.attackRate;
            eventBus.publish('melee:hit', {
                attackerId: attackerId,
                targetId: attackState.targetId,
                damage: attackParams.damage
            });
        }
    }
}

}