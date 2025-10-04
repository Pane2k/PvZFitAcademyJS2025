import Debug from "../../core/Debug.js";

export default class ArcMovementSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('ArcMovementComponent', 'PositionComponent');
        if (entities.length === 0) return;

        for (const entityId of entities) {
            const arc = this.world.getComponent(entityId, 'ArcMovementComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            arc.vy += arc.gravity * deltaTime;

            pos.x += arc.vx * deltaTime;
            pos.y += arc.vy * deltaTime;
            
            if (arc.vy > 0 && pos.y >= arc.targetY) {

                pos.y = arc.targetY;
                
                this.world.removeComponent(entityId, 'ArcMovementComponent');
                Debug.log(`Arc movement finished for entity ${entityId} at target Y.`);
            }
        }
    }
}