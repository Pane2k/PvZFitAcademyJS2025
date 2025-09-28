import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import GridLocationComponent from "../components/GridLocationComponent.js";

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

        const ghostId = ghosts[0]; // У нас всегда будет только один призрак
        const pos = this.world.getComponent(ghostId, 'PositionComponent');
        const ghost = this.world.getComponent(ghostId, 'GhostPlantComponent');
        
        // 1. Позиционируем призрака по сетке
        const gridCoords = this.grid.getCoords(this.mousePosition.x, this.mousePosition.y);
        if (gridCoords) {
            const cellCenter = this.grid.getWorldPos(gridCoords.row, gridCoords.col);
            pos.x = cellCenter.x - pos.width / 2;
            pos.y = cellCenter.y - pos.height / 2;
        } else {
            // Если курсор вне сетки, просто двигаем за ним
            pos.x = this.mousePosition.x - pos.width / 2;
            pos.y = this.mousePosition.y - pos.height / 2;
        }

        // 2. Анимация пульсации
        ghost.pulseTimer += deltaTime * 5; // Умножаем на 5 для ускорения пульсации
        const scaleFactor = 1.0 + Math.sin(ghost.pulseTimer) * 0.05; // Пульсация от 0.95 до 1.05
        
        const baseWidth = pos.width / ghost.baseScale;
        const baseHeight = pos.height / ghost.baseScale;

        pos.width = baseWidth * scaleFactor;
        pos.height = baseHeight * scaleFactor;
        ghost.baseScale = scaleFactor; // Сохраняем текущий масштаб для следующего кадра
    }
}