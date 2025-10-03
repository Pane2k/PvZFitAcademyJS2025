import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";
import VictoryTrophyComponent from "../components/VictoryTrophyComponent.js"; // <-- ИМПОРТИРУЕМ КОМПОНЕНТ-МАРКЕР

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
            if (distance < travel.speed * deltaTime) {
                Debug.log(`UI travel animation for ${entityId} finished.`);
                
                // --- VVV ИЗМЕНЕНИЕ: Трофей не удаляем по прибытии VVV ---
                const isTrophy = this.world.getComponent(entityId, 'VictoryTrophyComponent');
                if (!isTrophy) {
                    this.world.addComponent(entityId, new RemovalComponent());
                }
                // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---
                
                this.world.removeComponent(entityId, 'UITravelComponent');
                continue;
            }

            // 3. Двигаем сущность к цели с заданной скоростью
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            pos.x += normalizedDx * travel.speed * deltaTime;
            pos.y += normalizedDy * travel.speed * deltaTime;

            // --- VVV ИЗМЕНЕНИЕ: Условное изменение размера VVV ---
            const isTrophy = this.world.getComponent(entityId, 'VictoryTrophyComponent');
            if (isTrophy) {
                // Если это трофей, он увеличивается
                pos.scale *= 1.005; 
            } else {
                // Если это солнце, оно уменьшается
                pos.width *= 0.985;
                pos.height *= 0.985;
            }
            // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---
        }
    }
}