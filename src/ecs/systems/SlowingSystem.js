// src/ecs/systems/SlowingSystem.js
import eventBus from "../../core/EventBus.js";
import SlowedComponent from "../components/SlowedComponent.js";

export default class SlowingSystem {
    constructor() {
        this.world = null;
        this.boundHandleCollision = this.handleCollision.bind(this);
        eventBus.subscribe('collision:detected', this.boundHandleCollision);
    }

    handleCollision({ projectileId, targetId }) {
        const slowingComp = this.world.getComponent(projectileId, 'SlowsTargetComponent');
        const zombie = this.world.getComponent(targetId, 'ZombieComponent');

        if (slowingComp && zombie) {
            const existingSlow = this.world.getComponent(targetId, 'SlowedComponent');
            if (existingSlow) {
                // Если зомби уже замедлен, просто обновляем таймер
                existingSlow.timer = slowingComp.duration;
            } else {
                // Если нет - добавляем новый компонент
                this.world.addComponent(targetId, new SlowedComponent(slowingComp.duration, slowingComp.slowFactor));
            }
        }
    }

    // Этот метод нужен, чтобы система могла отписаться от события при выходе из состояния
    destroy() {
        eventBus.unsubscribe('collision:detected', this.boundHandleCollision);
    }
    
    update() {} // Логика в handleCollision
}