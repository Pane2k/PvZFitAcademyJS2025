import eventBus from "../../core/EventBus.js";

export default class CursorFollowingSystem {
    constructor() {
        this.world = null;
        this.mousePosition = { x: 0, y: 0 };

        eventBus.subscribe('input:move', (pos) => {
            this.mousePosition = pos;
        });
    }

    update() {
        const attachedEntities = this.world.getEntitiesWithComponents('CursorAttachmentComponent', 'PositionComponent');
        if (attachedEntities.length === 0) {
            return;
        }

        const entityId = attachedEntities[0];
        const pos = this.world.getComponent(entityId, 'PositionComponent');

        pos.x = this.mousePosition.x;
        pos.y = this.mousePosition.y;
    }
}