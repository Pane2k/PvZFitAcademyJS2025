// src/ecs/systems/BounceAnimationSystem.js

// Не нужен импорт RemovalComponent

export default class BounceAnimationSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('BounceAnimationComponent', 'PositionComponent');
        for (const entityId of entities) {
            const bounce = this.world.getComponent(entityId, 'BounceAnimationComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            bounce.timer += deltaTime;
            const progress = Math.min(1, bounce.timer / bounce.duration);
            
            // Математика для эффекта "ease-out back"
            const c1 = 1.70158;
            const c3 = c1 + 1;
            const easeOutBack = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

            pos.scale = bounce.targetScale * easeOutBack;

            if (progress >= 1) {
                // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ---
                // Просто устанавливаем финальный масштаб и удаляем компонент-аниматор.
                // Текст и его PositionComponent остаются!
                pos.scale = bounce.targetScale; 
                this.world.removeComponent(entityId, 'BounceAnimationComponent');
            }
        }
    }
}