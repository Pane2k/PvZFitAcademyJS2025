import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";

export default class CollisionSystem {
    constructor() {
        this.world = null;
    }

    update() {
        // Группы для проверки: снаряды против зомби
        const projectiles = this.world.getEntitiesWithComponents('ProjectileComponent', 'PositionComponent', 'HitboxComponent');
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent');

        if (projectiles.length === 0 || zombies.length === 0) {
            return; // Нечего проверять
        }

        for (const projId of projectiles) {
            const projPos = this.world.getComponent(projId, 'PositionComponent');
            const projBox = this.world.getComponent(projId, 'HitboxComponent');
            const projRect = {
                x: projPos.x + projBox.offsetX,
                y: projPos.y + projBox.offsetY,
                width: projBox.width,
                height: projBox.height
            };

            for (const zombieId of zombies) {
                const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');
                const zombieBox = this.world.getComponent(zombieId, 'HitboxComponent');
                const zombieRect = {
                    x: zombiePos.x + zombieBox.offsetX,
                    y: zombiePos.y + zombieBox.offsetY,
                    width: zombieBox.width,
                    height: zombieBox.height
                };

                // Проверка пересечения прямоугольников (AABB)
                if (projRect.x < zombieRect.x + zombieRect.width &&
                    projRect.x + projRect.width > zombieRect.x &&
                    projRect.y < zombieRect.y + zombieRect.height &&
                    projRect.y + projRect.height > zombieRect.y)
                {
                    eventBus.publish('collision:detected', { projectileId: projId, targetId: zombieId });
                    // Сразу выходим из внутреннего цикла, т.к. снаряд может попасть только в одну цель
                    break;
                }
            }
        }
    }
}