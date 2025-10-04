import TintEffectComponent from "../components/TintEffectComponent.js";
import Debug from "../../core/Debug.js";

export default class SlowEffectManagementSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('SlowedComponent');

        for (const entityId of entities) {
            const slow = this.world.getComponent(entityId, 'SlowedComponent');
            const vel = this.world.getComponent(entityId, 'VelocityComponent');

            slow.timer -= deltaTime;

            if (slow.timer <= 0) {
                if (vel && slow.originalSpeed !== null) {
                    if (typeof slow.originalSpeed === 'number' && !isNaN(slow.originalSpeed)) {
                        vel.vx = slow.originalSpeed;
                    }
                }
                this.world.removeComponent(entityId, 'SlowedComponent');
                this.world.removeComponent(entityId, 'TintEffectComponent');
                
                continue; 
            }

            if (vel) {
                if (slow.originalSpeed === null && typeof vel.vx === 'number' && !isNaN(vel.vx)) {
                    slow.originalSpeed = vel.vx;
                }
                if (slow.originalSpeed !== null) {
                    vel.vx = slow.originalSpeed * slow.slowFactor;
                }
            }
            
            if (!this.world.getComponent(entityId, 'TintEffectComponent')) {
                this.world.addComponent(entityId, new TintEffectComponent('0, 150, 255', 0.4, 999, 0, 0, true));
            }
            
        }
    }
}