export default class PositionComponent {
    constructor(x, y, width = 0, height = 0) { // <-- Убираем scale из конструктора
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.scale = 1.0; // <-- Добавляем свойство scale
    }
}