import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";

export default class LifetimeSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('LifetimeComponent');
        if (!entities.length) return; // Выходим, если нет сущностей с таймером

        for (const entityId of entities) {
            const lifetime = this.world.getComponent(entityId, 'LifetimeComponent');
            lifetime.timer += deltaTime;

            if (lifetime.timer >= lifetime.duration) {
                Debug.log(`Lifetime expired for entity ${entityId}. Marking for removal.`);
                this.world.addComponent(entityId, new RemovalComponent());
                
                // Важно! Удаляем LifetimeComponent, чтобы не проверять его снова
                this.world.removeComponent(entityId, 'LifetimeComponent');
            }
        }
    }
}