export default class ScaleAnimationSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('ScaleAnimationComponent', 'PositionComponent');
        for (const entityId of entities) {
            const scaleAnim = this.world.getComponent(entityId, 'ScaleAnimationComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            if (scaleAnim.initialWidth === 0) {
                scaleAnim.initialWidth = pos.width;
                scaleAnim.initialHeight = pos.height;
            }

            const targetWidth = scaleAnim.initialWidth * scaleAnim.targetScale;
            const diff = targetWidth - pos.width;

            if (Math.abs(diff) < 1) {
                this.world.removeComponent(entityId, 'ScaleAnimationComponent');
            } else {
                const increase = diff * scaleAnim.speed * deltaTime;
                const aspectRatio = pos.width / pos.height;
                pos.width += increase;
                pos.height += increase / aspectRatio;
            }
        }
    }
}