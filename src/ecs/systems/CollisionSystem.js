import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";

export default class CollisionSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const projectiles = this.world.getEntitiesWithComponents('ProjectileComponent', 'PositionComponent', 'HitboxComponent');
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent');

        if (projectiles.length === 0 || zombies.length === 0) {
            return;
        }

        for (const projId of projectiles) {
            const projPos = this.world.getComponent(projId, 'PositionComponent');
            const projBox = this.world.getComponent(projId, 'HitboxComponent');

            // NOTE: Рассчитываем AABB прямоугольник из центральных координат
            const projRect = {
                x: projPos.x + projBox.offsetX - projBox.width / 2,
                y: projPos.y + projBox.offsetY - projBox.height / 2,
                width: projBox.width,
                height: projBox.height
            };

            for (const zombieId of zombies) {
                const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');
                const zombieBox = this.world.getComponent(zombieId, 'HitboxComponent');
                
                const zombieRect = {
                    x: zombiePos.x + zombieBox.offsetX - zombieBox.width / 2,
                    y: zombiePos.y + zombieBox.offsetY - zombieBox.height / 2,
                    width: zombieBox.width,
                    height: zombieBox.height
                };

                if (projRect.x < zombieRect.x + zombieRect.width &&
                    projRect.x + projRect.width > zombieRect.x &&
                    projRect.y < zombieRect.y + zombieRect.height &&
                    projRect.y + projRect.height > zombieRect.y)
                {
                    eventBus.publish('collision:detected', { projectileId: projId, targetId: zombieId });
                    break;
                }
            }
        }
    }
}