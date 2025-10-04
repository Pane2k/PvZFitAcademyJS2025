export default class RenderableComponent {
    constructor(layer = 0, alpha = 1.0) { // <-- ИЗМЕНЕНИЕ: Добавлен alpha
        this.layer = layer;
        this.alpha = alpha; // <-- НОВОЕ СВОЙСТВО
    }
}