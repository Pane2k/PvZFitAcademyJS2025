import Debug from "../../core/Debug.js";

export default class GridAlignmentSystem {
    constructor(grid) {
        this.world = null;
        this.grid = grid;
    }

    update() {
        if (!this.grid) {
            Debug.warn('GridAlignmentSystem: No grid available.')
            return
        };

        const entities = this.world.getEntitiesWithComponents(
            'GridLocationComponent',
            'PositionComponent'
        );

        for (const entityId of entities) {
            const isStatic = !this.world.getComponent(entityId, 'VelocityComponent');
            if (isStatic) {
                const gridLoc = this.world.getComponent(entityId, 'GridLocationComponent');
                const pos = this.world.getComponent(entityId, 'PositionComponent');

                // NOTE: Получаем центральную точку ячейки и напрямую присваиваем ее
                const targetWorldPos = this.grid.getWorldPos(gridLoc.row, gridLoc.col);
                
                pos.x = targetWorldPos.x;
                pos.y = targetWorldPos.y;
            }
        }
    }

    updateGrid(newGrid) {
        this.grid = newGrid;
        Debug.log('GridAlignmentSystem updated with new grid.');
    }
}