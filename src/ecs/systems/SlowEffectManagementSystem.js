import TintEffectComponent from "../components/TintEffectComponent.js";
import Debug from "../../core/Debug.js";

export default class SlowEffectManagementSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        // Находим все сущности с компонентом замедления
        const entities = this.world.getEntitiesWithComponents('SlowedComponent');

        for (const entityId of entities) {
            const slow = this.world.getComponent(entityId, 'SlowedComponent');
            const vel = this.world.getComponent(entityId, 'VelocityComponent');

            // --- НАЧАЛО НОВОЙ ЛОГИКИ ---

            // 1. Сначала уменьшаем таймер
            slow.timer -= deltaTime;

            // 2. Проверяем, не закончился ли эффект
            if (slow.timer <= 0) {
                // Если зомби движется, восстанавливаем его скорость
                if (vel && slow.originalSpeed !== null) {
                    if (typeof slow.originalSpeed === 'number' && !isNaN(slow.originalSpeed)) {
                        vel.vx = slow.originalSpeed;
                    }
                }
                // Убираем ВСЕ связанные с замедлением компоненты
                this.world.removeComponent(entityId, 'SlowedComponent');
                this.world.removeComponent(entityId, 'TintEffectComponent');
                
                // Переходим к следующей сущности, т.к. работа с этой закончена
                continue; 
            }

            // 3. Если эффект активен, управляем им
            
            // Применяем замедление к скорости, если зомби движется
            if (vel) {
                // Сохраняем скорость, если это первый раз
                if (slow.originalSpeed === null && typeof vel.vx === 'number' && !isNaN(vel.vx)) {
                    slow.originalSpeed = vel.vx;
                }
                // Всегда применяем замедленную скорость
                if (slow.originalSpeed !== null) {
                    vel.vx = slow.originalSpeed * slow.slowFactor;
                }
            }
            
            // Гарантируем, что визуальный эффект на месте.
            // Если его нет (например, был удален или это первая итерация), добавляем его.
            if (!this.world.getComponent(entityId, 'TintEffectComponent')) {
                // Добавляем isManaged = true в конец конструктора
                this.world.addComponent(entityId, new TintEffectComponent('0, 150, 255', 0.4, 999, 0, 0, true));
            }
            
            // --- КОНЕЦ НОВОЙ ЛОГИКИ ---
        }
    }
}