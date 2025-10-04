// src/ecs/systems/DamageStateSpriteSystem.js
import Debug from "../../core/Debug.js";

export default class DamageStateSpriteSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const entities = this.world.getEntitiesWithComponents(
            'DamageStateSpriteComponent', 
            'HealthComponent', 
            'SpriteComponent'
        );

        for (const entityId of entities) {
            const damageStateComp = this.world.getComponent(entityId, 'DamageStateSpriteComponent');
            const health = this.world.getComponent(entityId, 'HealthComponent');
            const sprite = this.world.getComponent(entityId, 'SpriteComponent');

            const healthPercent = health.currentHealth / health.maxHealth;
            
            let newTargetIndex = -1;
            let newTargetAssetKey = null;
            const sortedStates = [...damageStateComp.damageStates].sort((a, b) => b.threshold - a.threshold);

            for (const state of sortedStates) {
                if (healthPercent <= state.threshold) {
                    newTargetAssetKey = state.assetKey;
                    newTargetIndex = damageStateComp.damageStates.findIndex(s => s.assetKey === newTargetAssetKey);
                }
            }
            if (newTargetIndex !== -1 && newTargetIndex > damageStateComp.currentStateIndex) {
                const newImage = this.world.factory.assetLoader.getImage(newTargetAssetKey);
                if (newImage) {
                    sprite.image = newImage;
                    damageStateComp.currentStateIndex = newTargetIndex;
                    Debug.log(`Entity ${entityId} changed damage state to '${newTargetAssetKey}' (HP: ${(healthPercent * 100).toFixed(1)}%)`);
                } else {
                    Debug.warn(`Asset not found for damage state: ${newTargetAssetKey}`);
                }
            }
        }
    }
}