import Debug from "../../core/Debug.js";

export default class EffectSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        // Управляем Tint-эффектами
        const tintedEntities = this.world.getEntitiesWithComponents('TintEffectComponent');
        for (const entityId of tintedEntities) {
            const tint = this.world.getComponent(entityId, 'TintEffectComponent');
            tint.timer += deltaTime;

            if (tint.timer >= tint.duration) {
                this.world.removeComponent(entityId, 'TintEffectComponent');
                Debug.log(`Tint effect expired for entity ${entityId}.`);
            }
        }

        // В будущем здесь можно будет управлять и другими эффектами (Poison, Freeze и т.д.)
    }
}