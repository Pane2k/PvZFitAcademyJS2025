import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import GridLocationComponent from "../components/GridLocationComponent.js";
import HiddenComponent from "../components/HiddenComponent.js"

export default class MouseFollowingSystem {
    constructor(grid) {
        this.world = null;
        this.grid = grid;
        this.mousePosition = { x: -1, y: -1 };
        
        eventBus.subscribe('input:move', (pos) => {
            this.mousePosition = pos;
        });
    }

    update(deltaTime) {
        const ghosts = this.world.getEntitiesWithComponents('GhostPlantComponent', 'PositionComponent');
        if (ghosts.length === 0) return;

        const ghostId = ghosts[0];
        const pos = this.world.getComponent(ghostId, 'PositionComponent');
        const ghost = this.world.getComponent(ghostId, 'GhostPlantComponent');
        
        const gridCoords = this.grid.getCoords(this.mousePosition.x, this.mousePosition.y);
        
        let isCellAvailable = false;
        if (gridCoords) {
            isCellAvailable = !this.grid.isCellOccupied(gridCoords.row, gridCoords.col);

            const cellCenter = this.grid.getWorldPos(gridCoords.row, gridCoords.col);
            pos.x = cellCenter.x;
            pos.y = cellCenter.y;
        }

        if (isCellAvailable) {
            this.world.removeComponent(ghostId, 'HiddenComponent');
        } else {
            this.world.addComponent(ghostId, new HiddenComponent());
        }

        ghost.pulseTimer += deltaTime * 5;
        const baseAlpha = 0.6;
        const pulseRange = 0.2;
        ghost.alpha = baseAlpha + Math.sin(ghost.pulseTimer) * pulseRange;
    }
    
    updateGrid(newGrid) {
        this.grid = newGrid;
    }
}