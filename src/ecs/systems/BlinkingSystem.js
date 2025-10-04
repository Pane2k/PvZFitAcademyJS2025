// src/ecs/systems/BlinkingSystem.js
import Debug from "../../core/Debug.js";

export default class BlinkingSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents(
            'BlinksBeforeRemovalComponent',
            'LifetimeComponent',
            'RenderableComponent'
        );

        for (const entityId of entities) {
            const blink = this.world.getComponent(entityId, 'BlinksBeforeRemovalComponent');
            const lifetime = this.world.getComponent(entityId, 'LifetimeComponent');
            const renderable = this.world.getComponent(entityId, 'RenderableComponent');

            const timeRemaining = lifetime.duration - lifetime.timer;

            if (timeRemaining <= blink.blinkDuration) {
                // Мы находимся в периоде мигания
                const blinkFrequency = 8; // Как часто мигать
                // Формула синуса для плавного перехода от 1 до 0 и обратно
                renderable.alpha = 0.5 + Math.sin(lifetime.timer * blinkFrequency) * 0.5;
            } else {
                // Если мы еще не в периоде мигания, убедимся, что альфа = 1
                renderable.alpha = 1.0;
            }
        }
    }
}