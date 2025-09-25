import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";

export default class UITravelSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('UITravelComponent', 'PositionComponent');
        if (entities.length === 0) return;

        for (const entityId of entities) {
            const travel = this.world.getComponent(entityId, 'UITravelComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            // 1. Рассчитываем вектор движения к цели
            const dx = travel.targetX - pos.x;
            const dy = travel.targetY - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 2. Проверяем, достигли ли мы цели
            // Если скорость за кадр больше оставшегося расстояния, считаем, что достигли
            if (distance < travel.speed * deltaTime) {
                Debug.log(`Sun animation for ${entityId} finished.`);
                // Просто помечаем на удаление, очки уже зачислены
                this.world.addComponent(entityId, new RemovalComponent());
                this.world.removeComponent(entityId, 'UITravelComponent');
                continue;
            }

            // 3. Двигаем сущность к цели с заданной скоростью
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            pos.x += normalizedDx * travel.speed * deltaTime;
            pos.y += normalizedDy * travel.speed * deltaTime;

            // 4. Уменьшаем размер для эффекта "исчезновения"
            pos.width *= 0.985;
            pos.height *= 0.985;
        }
    }
}