import Debug from "../core/Debug.js";

class TransitionManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.isActive = false;
        this.alpha = 0;
        this.direction = 0; // 1 for fade-in, -1 for fade-out
        this.speed = 2.0; // alpha per second (0.5 seconds duration)
        this.onComplete = null;
    }

    /**
     * Запускает полный цикл перехода: затемнение, выполнение колбэка, осветление.
     * @param {function} onMidpointCallback - Функция, которая выполнится, когда экран станет полностью черным.
     */
    startTransition(onMidpointCallback) {
        if (this.isActive) {
            Debug.warn("Transition already in progress.");
            return;
        }
        Debug.log("TransitionManager: Starting transition.");

        this.fadeToBlack(() => {
            // Когда экран черный, выполняем смену состояния
            if (onMidpointCallback) {
                onMidpointCallback();
            }
            // Сразу после этого начинаем осветление
            this.fadeToTransparent();
        });
    }

    /**
     * Плавно затемняет экран до черного.
     * @param {function} onComplete - Колбэк по завершении.
     */
    fadeToBlack(onComplete = null) {
        this.alpha = 0;
        this.direction = 1;
        this.isActive = true;
        this.onComplete = onComplete;
    }

    /**
     * Плавно делает экран снова прозрачным.
     * @param {function} onComplete - Колбэк по завершении.
     */
    fadeToTransparent(onComplete = null) {
        this.alpha = 1;
        this.direction = -1;
        this.isActive = true;
        this.onComplete = onComplete;
    }

    update(deltaTime) {
        if (!this.isActive) return;

        this.alpha += this.direction * this.speed * deltaTime;

        if (this.alpha >= 1 && this.direction === 1) {
            this.alpha = 1;
            this.isActive = false;
            this.direction = 0;
            if (this.onComplete) {
                this.onComplete();
            }
        } else if (this.alpha <= 0 && this.direction === -1) {
            this.alpha = 0;
            this.isActive = false;
            this.direction = 0;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    render() {
        if (this.alpha <= 0) return;

        const ctx = this.renderer.ctx;
        const canvas = this.renderer.canvas;

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`; // Белый цвет
        // Рисуем прямоугольник в физических координатах на весь экран
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

export default TransitionManager;