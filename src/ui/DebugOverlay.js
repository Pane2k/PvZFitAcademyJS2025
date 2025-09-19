export default class DebugOverlay {
    constructor() {
        this.isVisible = false; // По умолчанию скрыт
        this.fps = 0;
        this.frameTime = 0;
    
// Для расчета FPS
    this.lastTime = performance.now();
    this.frameCount = 0;
}

toggleVisibility() {
    this.isVisible = !this.isVisible;
}

/**
 * Вызывается на каждом кадре для обновления данных.
 * @param {number} deltaTime - Время с прошлого кадра в секундах.
 */
update(deltaTime) {
    if (!this.isVisible) return;

    this.frameTime = deltaTime * 1000; // Переводим в миллисекунды

    // Расчет FPS (обновляем раз в секунду)
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = now;
    }
}

/**
 * Отрисовывает оверлей, если он видим.
 * @param {Renderer} renderer 
 */
draw(renderer) {
    if (!this.isVisible) return;

    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right"; // Выравнивание по правому краю
    
    const textFPS = `FPS: ${this.fps}`;
    const textFrameTime = `Frame Time: ${this.frameTime.toFixed(2)} ms`;

    // Рисуем в правом верхнем углу холста
    ctx.fillText(textFPS, canvas.width - 10, 20);
    ctx.fillText(textFrameTime, canvas.width - 10, 40);
}

  

}