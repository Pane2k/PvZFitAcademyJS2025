import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";

export default class BoundarySystem {
    constructor(renderer) {
        this.world = null;
        this.renderer = renderer;
        this.margin = 100; // Доп. зона за экраном, чтобы объекты исчезали плавно
    }

    update() {
        const entities = this.world.getEntitiesWithComponents(
            'OutOfBoundsRemovalComponent',
            'PositionComponent'
        );

        if (entities.length === 0) return;

        const virtualWidth = this.renderer.VIRTUAL_WIDTH;
        const virtualHeight = this.renderer.VIRTUAL_HEIGHT;

        for (const entityId of entities) {
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            // Проверяем, вышла ли сущность за границы (с учетом margin)
            if (pos.x + pos.width < -this.margin ||      // Слишком далеко слева
                pos.x > virtualWidth + this.margin ||    // Слишком далеко справа
                pos.y + pos.height < -this.margin ||     // Слишком далеко сверху
                pos.y > virtualHeight + this.margin)     // Слишком далеко снизу
            {
                // Помечаем на удаление. CleanupSystem сделает остальное.
                this.world.addComponent(entityId, new RemovalComponent());
                Debug.log(`Entity ${entityId} marked for removal (out of bounds).`);
            }
        }
    }
}