// src/ecs/systems/CameraSystem.js
import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";

export default class CameraSystem {
    constructor() {
        this.world = null;
        this.currentOffsetX = 0;
        this.targetOffsetX = 0;
        this.isPanning = false;
        this.isPanComplete = false;
        this.panSpeed = 0.02; // Скорость можно будет настроить

        // Подписываемся на то же событие
        eventBus.subscribe('game:start_lose_sequence', () => {
            Debug.log("CameraSystem: Lose sequence started. Panning camera to the right.");
            // --- ИЗМЕНЕНИЕ: Двигаем камеру ВПРАВО, чтобы мир уехал влево ---
            this.targetOffsetX = 400; // Положительное значение
            this.isPanning = true;
        });
    }

    update() {
        if (this.isPanning) {
            const diff = this.targetOffsetX - this.currentOffsetX;
            if (Math.abs(diff) < 1) {
                this.currentOffsetX = this.targetOffsetX;
                this.isPanning = false;
                this.isPanComplete = true;
                Debug.log("CameraSystem: Pan complete.");
            } else {
                // Плавное движение
                this.currentOffsetX += diff * this.panSpeed;
            }
        }
    }

    reset() {
        this.currentOffsetX = 0;
        this.targetOffsetX = 0;
        this.isPanning = false;
        this.isPanComplete = false;
    }
}