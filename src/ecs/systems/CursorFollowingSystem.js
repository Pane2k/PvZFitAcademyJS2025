import eventBus from "../../core/EventBus.js";

export default class CursorFollowingSystem {
    constructor() {
        this.world = null;
        this.mousePosition = { x: 0, y: 0 };

        // Подписываемся на событие движения мыши, чтобы всегда иметь актуальные координаты
        eventBus.subscribe('input:move', (pos) => {
            this.mousePosition = pos;
        });
    }

    update() {
        // Ищем сущность, которую нужно привязать к курсору
        const attachedEntities = this.world.getEntitiesWithComponents('CursorAttachmentComponent', 'PositionComponent');
        if (attachedEntities.length === 0) {
            return; // Если такой сущности нет, ничего не делаем
        }

        const entityId = attachedEntities[0]; // Предполагаем, что такая сущность всегда одна
        const pos = this.world.getComponent(entityId, 'PositionComponent');

        // Обновляем позицию сущности, центрируя ее относительно курсора
        pos.x = this.mousePosition.x - pos.width / 2;
        pos.y = this.mousePosition.y - pos.height / 2;
    }
}