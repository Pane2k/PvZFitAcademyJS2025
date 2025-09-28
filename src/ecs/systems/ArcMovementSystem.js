import Debug from "../../core/Debug.js";

export default class ArcMovementSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('ArcMovementComponent', 'PositionComponent');
        if (entities.length === 0) return;

        for (const entityId of entities) {
            const arc = this.world.getComponent(entityId, 'ArcMovementComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            // 1. Применяем гравитацию к вертикальной скорости
            arc.vy += arc.gravity * deltaTime;

            // 2. Обновляем позицию на основе текущих скоростей
            pos.x += arc.vx * deltaTime;
            pos.y += arc.vy * deltaTime;
            
            // 3. Условие остановки: когда солнце начинает падать вниз и достигло определенной скорости
            // Мы останавливаем его, чтобы оно "зависло" в воздухе, ожидая сбора.
            if (arc.vy > 0 && pos.y >= arc.targetY) {
                // Для точности, "прибиваем" солнце к финальной позиции
                pos.y = arc.targetY;
                
                this.world.removeComponent(entityId, 'ArcMovementComponent');
                Debug.log(`Arc movement finished for entity ${entityId} at target Y.`);
            }
        }
    }
}