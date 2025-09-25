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

    // Находит "свободных" зомби и проверяет, могут ли они атаковать
    findTargets() {
        const attackers = this.world.getEntitiesWithComponents('MeleeAttackComponent', 'PositionComponent', 'VelocityComponent');
        const targets = this.world.getEntitiesWithComponents('PlantComponent', 'PositionComponent', 'HealthComponent');

        for (const attackerId of attackers) {
            const attackerPos = this.world.getComponent(attackerId, 'PositionComponent');
            const attackerBox = this.world.getComponent(attackerId, 'HitboxComponent');
            
            // --- VVV НОВАЯ ЛОГИКА АТАКИ ПО ХИТБОКСАМ VVV ---
            // "Attack Range Box" - это область прямо перед хитбоксом зомби.
            const attackRange = 10; // Дальность атаки зомби в пикселях
            const attackBox = {
                x: attackerPos.x + attackerBox.offsetX - attackRange,
                y: attackerPos.y + attackerBox.offsetY,
                width: attackRange,
                height: attackerBox.height
            };

            for (const targetId of targets) {
                const targetPos = this.world.getComponent(targetId, 'PositionComponent');
                const targetBox = this.world.getComponent(targetId, 'HitboxComponent');
                const targetRect = {
                    x: targetPos.x + targetBox.offsetX,
                    y: targetPos.y + targetBox.offsetY,
                    width: targetBox.width,
                    height: targetBox.height
                };

                // Проверяем пересечение "коробки атаки" с хитбоксом цели
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

    // Обрабатывает уже атакующих зомби
    processAttacks(deltaTime) {
        const attackingEntities = this.world.getEntitiesWithComponents('AttackingComponent', 'MeleeAttackComponent');

        for (const attackerId of attackingEntities) {
            const attackState = this.world.getComponent(attackerId, 'AttackingComponent');
            const attackParams = this.world.getComponent(attackerId, 'MeleeAttackComponent');

            const targetExists = this.world.entities.has(attackState.targetId);

            // Если цель исчезла (уже съедена), возвращаемся к ходьбе
            if (!targetExists) {
                Debug.log(`Entity ${attackerId} target is gone, resumes walking.`);
                this.world.removeComponent(attackerId, 'AttackingComponent');
                
                // --- VVV НАДЕЖНОЕ ВОССТАНОВЛЕНИЕ СКОРОСТИ VVV ---
                const prefab = this.world.getComponent(attackerId, 'PrefabComponent');
                if (prefab) {
                    const proto = this.world.factory.prototypes[prefab.name];
                    if (proto && proto.components.VelocityComponent) {
                        const velProto = proto.components.VelocityComponent;
                        const speed = velProto.baseSpeed + (Math.random() * 2 - 1) * velProto.speedVariance;
                        this.world.addComponent(attackerId, new VelocityComponent(speed, 0));
                    }
                }
                continue;
            }

            // Обработка перезарядки и нанесения урона
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
    // Вспомогательный метод (можно оптимизировать в будущем, но для сейчас подойдет)
    findEntityNameById(entityId) {
        // Это не самый производительный способ, но для нашей игры его достаточно
        // В реальном проекте у сущности мог бы быть компонент с именем ее префаба
        const health = this.world.getComponent(entityId, 'HealthComponent');
        if (health && health.maxHealth === 100) return 'zombie_basic'; // Пример
        return 'zombie_basic'; // Фоллбэк
    }
}