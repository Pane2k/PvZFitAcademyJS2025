import Debug from "../core/Debug.js";

export default class Grid{
    constructor(virtualX, virtualY, virtualWidth, virtualHeight, rows, cols) {
        this.rows = rows;
        this.cols = cols;

        this.offsetX = virtualX;
        this.offsetY = virtualY;
        this.width = virtualWidth;
        this.height = virtualHeight;

        this.cellWidth = this.width / this.cols;
        this.cellHeight = this.height / this.rows;
        
        this.cells = Array(rows).fill(null).map(() => Array(cols).fill(null));

        Debug.log(`Grid created in virtual space. Cell size: ${this.cellWidth.toFixed(2)}x${this.cellHeight.toFixed(2)}`);
    }
    getCoords(virtualX, virtualY) {
        if (virtualX < this.offsetX || virtualX > this.offsetX + this.width || 
            virtualY < this.offsetY || virtualY > this.offsetY + this.height) {
            return null;
        }

        const col = Math.floor((virtualX - this.offsetX) / this.cellWidth);
        const row = Math.floor((virtualY - this.offsetY) / this.cellHeight);

        return { row, col };
    }
    getWorldPos(row, col) {
        const x = this.offsetX + col * this.cellWidth + this.cellWidth / 2
        const y = this.offsetY + row * this.cellHeight + this.cellHeight / 2
        return { x, y }
    }

    placeEntity(row, col, entityId) {
        if (this.isValidCell(row, col)) this.cells[row][col] = entityId;
    }

    removeEntity(row, col) {
        if (this.isValidCell(row, col)) this.cells[row][col] = null;
    }

    isCellOccupied(row, col) {
        return this.isValidCell(row, col) && this.cells[row][col] !== null;
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    draw(renderer) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                renderer.drawRect(
                    this.offsetX + c * this.cellWidth,
                    this.offsetY + r * this.cellHeight,
                    this.cellWidth,
                    this.cellHeight,
                    'rgba(255, 255, 255, 0.2)'
                );
            }
        }
    }
}