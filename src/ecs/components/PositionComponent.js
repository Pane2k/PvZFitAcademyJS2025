export default class PositionComponent {
    // --- ИЗМЕНЕНИЕ: Добавляем 'scale' в конструктор ---
    constructor(x, y, width = 0, height = 0, scale = 1.0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.scale = scale; // Устанавливаем переданный или стандартный масштаб
    }
}