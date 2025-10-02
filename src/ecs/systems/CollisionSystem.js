import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";

export default class CollisionSystem {
    constructor() {
        this.world = null;
    }

    update() {
        // Ищем только те снаряды, которые еще не были помечены на удаление
        const projectiles = this.world.getEntitiesWithComponents('ProjectileComponent', 'PositionComponent', 'HitboxComponent')
            .filter(id => !this.world.getComponent(id, 'RemovalComponent'));
            
        // Ищем только "живых" зомби с хитбоксами
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent')
            .filter(id => !this.world.getComponent(id, 'DyingComponent'));

        if (projectiles.length === 0 || zombies.length === 0) {
            return;
        }

        for (const projId of projectiles) {
            const projPos = this.world.getComponent(projId, 'PositionComponent');
            const projBox = this.world.getComponent(projId, 'HitboxComponent');

            // Защитная проверка на случай, если компонент удалили в том же кадре
            if (!projPos || !projBox) continue;

            const projRect = {
                x: projPos.x + projBox.offsetX - projBox.width / 2,
                y: projPos.y + projBox.offsetY - projBox.height / 2,
                width: projBox.width,
                height: projBox.height
            };

            for (const zombieId of zombies) {
                const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');
                const zombieBox = this.world.getComponent(zombieId, 'HitboxComponent');

                // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
                // Если у зомби в этом кадре уже удалили хитбокс, пропускаем его
                if (!zombiePos || !zombieBox) continue;
                // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---
                
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
                    
                    // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
                    // Сразу помечаем снаряд на удаление, чтобы он не мог поразить
                    // несколько целей за один кадр.
                    this.world.addComponent(projId, new RemovalComponent());
                    // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---

                    break; // Выходим из цикла по зомби, т.к. снаряд уже "потрачен"
                }
            }
        }
    }
}