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
            
            const gridLoc = this.world.getComponent(entityId, 'GridLocationComponent');
            const pos = this.world.getComponent(entityId, 'PositionComponent');
            const vel = this.world.getComponent(entityId, 'VelocityComponent');

            // 1. Получаем АКТУАЛЬНЫЕ центральные координаты ячейки из сетки
            const newWidth = this.grid.cellWidth * pos.scale
            const newHeight = this.grid.cellHeight * pos.scale
            pos.width = newWidth;
            pos.height = newHeight;
            const targetWorldPos = this.grid.getWorldPos(gridLoc.row, gridLoc.col);
            

            if (vel) {
                // ОБЪЕКТ ДВИЖЕТСЯ (например, падающее солнце)
                // Мы управляем только его горизонтальным положением, чтобы он оставался в своей колонке.
                // Вертикальное движение контролируется MovementSystem.
                pos.x = targetWorldPos.x - newWidth / 2;
            } else {
                // ОБЪЕКТ СТАТИЧЕН (например, растение или приземлившееся солнце)
                // Мы полностью контролируем его позицию, привязывая к центру ячейки.
                const newX = targetWorldPos.x - newWidth / 2;
                const newY = targetWorldPos.y - newHeight / 2;

                if (pos.x !== newX || pos.y !== newY) {
                    pos.x = newX;
                    pos.y = newY;
                }
            }
            // --- ^^^ КОНЕЦ ОБНОВЛЕННОЙ ЛОГИКИ ^^^ ---
        
        }
    }

    // Метод для обновления ссылки на сетку после ресайза
    updateGrid(newGrid) {
        this.grid = newGrid;
        Debug.log('GridAlignmentSystem updated with new grid.');
    }
}