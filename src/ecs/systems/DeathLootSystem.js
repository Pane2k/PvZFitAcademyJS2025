// src/ecs/systems/DeathLootSystem.js
import Debug from "../../core/Debug.js";
import ScaleAnimationComponent from "../components/ScaleAnimationComponent.js";

export default class DeathLootSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const entities = this.world.getEntitiesWithComponents('DyingComponent', 'DropsTrophyOnDeathComponent');
        for (const entityId of entities) {
            const pos = this.world.getComponent(entityId, 'PositionComponent');
            if (pos) {
                const trophyId = this.world.factory.create('trophy', { x: pos.x, y: pos.y });

                if (trophyId !== null) {
                    const trophyPos = this.world.getComponent(trophyId, 'PositionComponent');
                    if (trophyPos) {
                        // Начальный масштаб, чтобы красиво появиться
                        trophyPos.scale = 0.1; 
                        
                        // Анимация увеличения на месте.
                        // Система ScaleAnimationSystem удалит этот компонент по завершении.
                        this.world.addComponent(trophyId, new ScaleAnimationComponent(1.0, 3.0)); 
                        Debug.log(`Entity ${entityId} dropped a clickable victory trophy (${trophyId}).`);
                    }
                    // Важно: HitboxComponent и VictoryTrophyComponent уже добавлены фабрикой
                    // из префаба entities.json, поэтому нам не нужно их добавлять вручную.
                }
            }
            // Убираем компонент-маркер, чтобы не заспавнить трофей снова
            this.world.removeComponent(entityId, 'DropsTrophyOnDeathComponent');
        }
    }
}