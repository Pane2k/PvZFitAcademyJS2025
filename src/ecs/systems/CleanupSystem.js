import Debug from "../../core/Debug.js";

export default class CleanupSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const entitiesToRemove = this.world.getEntitiesWithComponents('RemovalComponent');
        
        if (entitiesToRemove.length > 0) {
            Debug.log(`CleanupSystem: Removing ${entitiesToRemove.length} entities.`);
        }

        for (const entityID of entitiesToRemove) {
            this.world.removeEntity(entityID);
        }
    }
}