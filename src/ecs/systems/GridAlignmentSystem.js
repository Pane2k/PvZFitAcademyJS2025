import Debug from "../../core/Debug.js";

export default class GridAlignmentSystem {
    constructor(grid) {
        this.world = null; // Будет установлено World'ом
        this.grid = grid;
    }

    // Этот метод будет вызываться на каждом кадре
    update() {
        if (!this.grid) {
            Debug.warn('GridAlignmentSystem: No grid available.')
            return
        };

        // Находим все сущности, у которых есть и позиция в сетке, и позиция в мире
        const entities = this.world.getEntitiesWithComponents(
            'GridLocationComponent',
            'PositionComponent'
        );

        if (entities.length > 0) {
            // Debug.warn(`GridAlignmentSystem: Found ${entities.length} entities to align.`);
        }

        for (const entityId of entities) {
            if (this.world.getComponent(entityId, 'VelocityComponent')) {
                continue;
            }
            const gridLoc = this.world.getComponent(entityId, 'GridLocationComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');

            // 1. Получаем АКТУАЛЬНЫЕ центральные координаты ячейки из сетки
            const newWidth = this.grid.cellWidth * pos.scale
            const newHeight = this.grid.cellHeight * pos.scale

            // 2. Рассчитываем новую позицию левого верхнего угла спрайта
            const newWorldPos = this.grid.getWorldPos(gridLoc.row, gridLoc.col);
            const newX = newWorldPos.x - newWidth / 2;
            const newY = newWorldPos.y - newHeight / 2;
            
            // 3. Если пиксельные координаты устарели, обновляем их
            if (pos.x !== newX || pos.y !== newY || pos.width !== newWidth || pos.height !== newHeight) {
                // Debug.log(`Re-aligning entity ${entityId}`); // Можно раскомментировать для отладки
                pos.x = newX;
                pos.y = newY;
                pos.width = newWidth;
                pos.height = newHeight;
            }
        }
    }

    // Метод для обновления ссылки на сетку после ресайза
    updateGrid(newGrid) {
        this.grid = newGrid;
        Debug.log('GridAlignmentSystem updated with new grid.');
    }
}