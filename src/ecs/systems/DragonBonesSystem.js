export default class DragonBonesSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('DragonBonesComponent');
        for (const entityId of entities) {
            const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');
            if (dbComp) {
                dbComp.update(deltaTime);
            }
        }
    }
}