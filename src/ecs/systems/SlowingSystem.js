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
                existingSlow.timer = slowingComp.duration;
            } else {
                this.world.addComponent(targetId, new SlowedComponent(slowingComp.duration, slowingComp.slowFactor));
            }
        }
    }

    destroy() {
        eventBus.unsubscribe('collision:detected', this.boundHandleCollision);
    }
    
    update() {} 
}