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
            
            const isStatic = !this.world.getComponent(entityId, 'VelocityComponent');
            
            if (isStatic) {
                const gridLoc = this.world.getComponent(entityId, 'GridLocationComponent');
                const pos = this.world.getComponent(entityId, 'PositionComponent');

                const targetWorldPos = this.grid.getWorldPos(gridLoc.row, gridLoc.col);
                
                const newX = targetWorldPos.x - pos.width / 2;
                const newY = targetWorldPos.y - pos.height / 2;

                if (pos.x !== newX || pos.y !== newY) {
                    pos.x = newX;
                    pos.y = newY;
                }
            }
        
        }
    }

    // Метод для обновления ссылки на сетку после ресайза
    updateGrid(newGrid) {
        this.grid = newGrid;
        Debug.log('GridAlignmentSystem updated with new grid.');
    }
}