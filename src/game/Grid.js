import Debug from "../core/Debug.js";

export default class Grid{
    constructor(areaX, areaY, areaWidth, areaHeight, rows, cols) {
        this.rows = rows;
        this.cols = cols;

        // VVV НОВАЯ ЛОГИКА РАСЧЕТА VVV

        // 1. Определяем максимально возможный размер ячейки, чтобы вписаться в область
        const cellWidthByArea = areaWidth / cols;
        const cellHeightByArea = areaHeight / rows;
        
        // 2. Выбираем наименьший из них, чтобы ячейка точно была квадратной и помещалась
        this.cellSize = Math.min(cellWidthByArea, cellHeightByArea);
        
        // 3. Рассчитываем итоговые реальные размеры сетки
        this.width = this.cellSize * cols;
        this.height = this.cellSize * rows;

        // 4. Центрируем сетку внутри выделенной для нее области
        this.offsetX = areaX + (areaWidth - this.width) / 2;
        this.offsetY = areaY + (areaHeight - this.height) / 2;

        // Переименовываем для ясности
        this.cellWidth = this.cellSize;
        this.cellHeight = this.cellSize;
        
        // Создаем 2D-массив для хранения состояния ячеек
        this.cells = Array(rows).fill(null).map(() => Array(cols).fill(null));

        Debug.log(`Grid created: ${cols}x${rows}. Cell size: ${this.cellSize.toFixed(2)}x${this.cellSize.toFixed(2)}`);
        Debug.log(`Grid position: (${this.offsetX.toFixed(2)}, ${this.offsetY.toFixed(2)}), size: ${this.width.toFixed(2)}x${this.height.toFixed(2)}`)
    }
    getCoords(x, y) {
        if (x < this.offsetX || x > this.offsetX + this.width || 
            y < this.offsetY || y > this.offsetY + this.height) {
            return null
        }

        const col = Math.floor((x - this.offsetX) / this.cellWidth)
        const row = Math.floor((y - this.offsetY) / this.cellHeight)

        return { row, col }
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