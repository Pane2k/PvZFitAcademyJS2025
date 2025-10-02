// src/ecs/systems/CleanupSystem.js
import Debug from "../../core/Debug.js";

export default class CleanupSystem {
    constructor() {
        this.world = null;
    }

    update() {
        // 1. Находим ТОЛЬКО те сущности, которые ЯВНО помечены на удаление.
        const entitiesToRemove = this.world.getEntitiesWithComponents('RemovalComponent');
        
        if (entitiesToRemove.length > 0) {
            Debug.log(`CleanupSystem: Removing ${entitiesToRemove.length} entities.`);
        }

        // 2. Удаляем их.
        for (const entityID of entitiesToRemove) {
            this.world.removeEntity(entityID);
        }
        
        // В этой системе НЕ ДОЛЖНО БЫТЬ никаких других циклов или проверок.
    }
}