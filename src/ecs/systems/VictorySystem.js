// src/ecs/systems/VictorySystem.js
import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";

export default class VictorySystem {
    constructor() {
        this.world = null;
        this.sequenceState = 'waiting_for_trophy_animation';
    }

    update() {
        if (this.sequenceState !== 'waiting_for_trophy_animation') return;

        const trophy = this.world.getEntitiesWithComponents('VictoryTrophyComponent')[0];
        if (!trophy) return;

        const isAnimating = this.world.getComponent(trophy, 'UITravelComponent') || 
                            this.world.getComponent(trophy, 'ScaleAnimationComponent');

        if (!isAnimating) {
            Debug.log("VictorySystem: Trophy animation finished. Starting screen fade.");
            const fadeConfig = { 
                duration: 1.5, 
                startAlpha: 0, 
                targetAlpha: 1, 
                onCompleteEvent: 'game:win' 
            };
            const effectId = this.world.factory.create('screen_fade_effect', {});
            this.world.removeComponent(effectId, 'FadeEffectComponent');
            this.world.addComponent(effectId, new (require('../components/FadeEffectComponent.js').default)(fadeConfig));
            
            this.sequenceState = 'done';
        }
    }
}