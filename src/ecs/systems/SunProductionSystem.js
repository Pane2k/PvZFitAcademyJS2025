import Debug from "../../core/Debug.js";
import LifetimeComponent from "../components/LifetimeComponent.js";

export default class SunProductionSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const producers = this.world.getEntitiesWithComponents('SunProducerComponent', 'PositionComponent');
        if (producers.length === 0) return;

        for (const entityId of producers) {
            const producer = this.world.getComponent(entityId, 'SunProducerComponent');
            producer.timer += deltaTime;

            if (producer.timer >= producer.productionRate) {
                producer.timer = 0; // Сбрасываем таймер
                this.spawnSunNearProducer(entityId, producer.sunValue);
            }
        }
    }

    spawnSunNearProducer(producerId, sunValue) {
        const pos = this.world.getComponent(producerId, 'PositionComponent');
        if (!pos) return;

        // Создаем солнце рядом с растением со случайным смещением
        const offsetX = (Math.random() - 0.5) * pos.width * 0.5;
        const offsetY = (Math.random() - 0.5) * pos.height * 0.5;
        
        const sunX = pos.x + offsetX;
        const sunY = pos.y + offsetY;

        const sunId = this.world.factory.create('sun', { x: sunX, y: sunY });
        if (sunId !== null) {
            // Удаляем компонент скорости, т.к. это солнце не падает с неба
            this.world.removeComponent(sunId, 'VelocityComponent');
            // Добавляем время жизни, чтобы оно не лежало вечно
            this.world.addComponent(sunId, new LifetimeComponent(10));
            Debug.log(`Sunflower ${producerId} produced sun ${sunId}.`);
        }
    }
}