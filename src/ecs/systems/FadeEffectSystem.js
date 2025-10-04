import eventBus from "../../core/EventBus.js";
import RemovalComponent from "../components/RemovalComponent.js";

export default class FadeEffectSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('FadeEffectComponent');
        for (const entityId of entities) {
            const fade = this.world.getComponent(entityId, 'FadeEffectComponent');
            fade.timer += deltaTime;
            
            const progress = Math.min(1, fade.timer / fade.duration);
            fade.currentAlpha = fade.startAlpha + (fade.targetAlpha - fade.startAlpha) * progress;

            if (progress >= 1) {
                if (fade.onCompleteEvent) {
                    eventBus.publish(fade.onCompleteEvent, { entityId });
                }
                // Если у эффекта нет события, он просто исчезает
                if (!fade.onCompleteEvent) {
                    this.world.addComponent(entityId, new RemovalComponent());
                }
                this.world.removeComponent(entityId, 'FadeEffectComponent');
            }
        }
    }
}