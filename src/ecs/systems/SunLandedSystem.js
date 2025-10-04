// src/ecs/systems/SunLandedSystem.js
import Debug from "../../core/Debug.js";
import LifetimeComponent from "../components/LifetimeComponent.js";
import BlinksBeforeRemovalComponent from "../components/BlinksBeforeRemovalComponent.js";

export default class SunLandedSystem {
    constructor() {
        this.world = null;
    }

    update() {
        // Ищем сущности, которые являются "Солнцем" (есть CollectibleComponent),
        // но у которых еще нет таймера жизни (LifetimeComponent).
        const sunsToActivate = this.world.getEntitiesWithComponents('CollectibleComponent')
            .filter(id => !this.world.getComponent(id, 'LifetimeComponent'));

        for (const entityId of sunsToActivate) {
            // Проверяем, что солнце действительно остановилось (нет компонентов движения)
            const isMoving = this.world.getComponent(entityId, 'VelocityComponent') ||
                             this.world.getComponent(entityId, 'ArcMovementComponent');

            if (!isMoving) {
                // Солнце приземлилось! Запускаем таймер.
                this.world.addComponent(entityId, new LifetimeComponent(10));
                this.world.addComponent(entityId, new BlinksBeforeRemovalComponent());
                Debug.log(`Sun (entity ${entityId}) has landed. Lifetime timer started.`);
            }
        }
    }
}