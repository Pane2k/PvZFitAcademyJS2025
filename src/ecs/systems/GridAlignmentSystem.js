// src/ecs/systems/GridAlignmentSystem.js
import Debug from "../../core/Debug.js";

export default class GridAlignmentSystem {
    constructor(grid) {
        this.world = null;
        this.grid = grid;
    }

    update() {
        if (!this.grid) {
            Debug.warn('GridAlignmentSystem: No grid available.');
            return;
        }

        const entities = this.world.getEntitiesWithComponents(
            'GridLocationComponent',
            'PositionComponent'
        );

        for (const entityId of entities) {
            // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
            // Объект считается статичным, только если у него НЕТ НИ ОДНОГО
            // компонента, отвечающего за движение.
            const isMoving = this.world.getComponent(entityId, 'VelocityComponent') ||
                             this.world.getComponent(entityId, 'ArcMovementComponent') ||
                             this.world.getComponent(entityId, 'UITravelComponent');
            
            const isStatic = !isMoving;
            // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---

            if (isStatic) {
                const gridLoc = this.world.getComponent(entityId, 'GridLocationComponent');
                const pos = this.world.getComponent(entityId, 'PositionComponent');

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