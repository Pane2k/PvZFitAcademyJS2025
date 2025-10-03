// src/ecs/systems/DeathLootSystem.js
import Debug from "../../core/Debug.js";

export default class DeathLootSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const entities = this.world.getEntitiesWithComponents('DyingComponent', 'DropsTrophyOnDeathComponent');
        for (const entityId of entities) {
            const pos = this.world.getComponent(entityId, 'PositionComponent');
            if (pos) {
                this.world.factory.create('trophy', { x: pos.x, y: pos.y });
                Debug.log(`Entity ${entityId} dropped a victory trophy.`);
            }
            // Убираем компонент, чтобы не заспавнить трофей снова
            this.world.removeComponent(entityId, 'DropsTrophyOnDeathComponent');
        }
    }
}