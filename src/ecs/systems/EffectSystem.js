import Debug from "../../core/Debug.js";

export default class EffectSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const tintedEntities = this.world.getEntitiesWithComponents('TintEffectComponent');
        for (const entityId of tintedEntities) {
            const tint = this.world.getComponent(entityId, 'TintEffectComponent');

            // --- НАЧАЛО ИЗМЕНЕНИЙ ---
            // Если этим эффектом управляет другая система, пропускаем его
            if (tint.isManaged) {
                continue;
            }
            // --- КОНЕЦ ИЗМЕНЕНИЙ ---

            tint.timer += deltaTime;

            if (tint.timer >= tint.duration) {
                this.world.removeComponent(entityId, 'TintEffectComponent');
                Debug.log(`Tint effect expired for entity ${entityId}.`);
            }
        }
    }
}