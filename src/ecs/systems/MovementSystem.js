import Debug from "../../core/Debug.js"; 

export default class MovementSystem {
    constructor() {
        this.world = null;
    }
    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('PositionComponent', 'VelocityComponent');
        
        if (entities.length > 0) {
            const firstEntityId = entities[0];
            const pos = this.world.getComponent(firstEntityId, 'PositionComponent');
            const vel = this.world.getComponent(firstEntityId, 'VelocityComponent');

        }

        for (const entityId of entities) {
            const pos = this.world.getComponent(entityId, 'PositionComponent');
            const vel = this.world.getComponent(entityId, 'VelocityComponent');

            pos.x += vel.vx * deltaTime;
            pos.y += vel.vy * deltaTime;
        }
    }
}