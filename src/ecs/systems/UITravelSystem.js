import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";
import VictoryTrophyComponent from "../components/VictoryTrophyComponent.js"; 

export default class UITravelSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('UITravelComponent', 'PositionComponent');
        if (entities.length === 0) return;

        for (const entityId of entities) {
            const travel = this.world.getComponent(entityId, 'UITravelComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            const dx = travel.targetX - pos.x;
            const dy = travel.targetY - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < travel.speed * deltaTime) {
                Debug.log(`UI travel animation for ${entityId} finished.`);
                
                const isTrophy = this.world.getComponent(entityId, 'VictoryTrophyComponent');
                if (!isTrophy) {
                    this.world.addComponent(entityId, new RemovalComponent());
                }
                
                this.world.removeComponent(entityId, 'UITravelComponent');
                continue;
            }

            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            pos.x += normalizedDx * travel.speed * deltaTime;
            pos.y += normalizedDy * travel.speed * deltaTime;

            const isTrophy = this.world.getComponent(entityId, 'VictoryTrophyComponent');
            if (isTrophy) {
                pos.scale *= 1.005; 
            } else {
                pos.width *= 0.985;
                pos.height *= 0.985;
            }
        }
    }
}