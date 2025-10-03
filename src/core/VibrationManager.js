// src/core/VibrationManager.js
import Debug from "./Debug.js";

class VibrationManager {
    constructor() {
        this.isSupported = 'vibrate' in navigator;
        if (this.isSupported) {
            Debug.log("Vibration API is supported.");
        } else {
            Debug.warn("Vibration API is not supported in this browser.");
        }
    }

    /**
     * Вызывает вибрацию.
     * @param {number | number[]} pattern - Длительность в мс или массив [вибрация, пауза, ...].
     */
    vibrate(pattern) {
        if (this.isSupported) {
            // Примечание: iOS Safari не поддерживает Vibration API.
            // На Android и других совместимых браузерах это будет работать.
            navigator.vibrate(pattern);
        }
    }

    stop() {
        if (this.isSupported) {
            navigator.vibrate(0);
        }
    }
}

// Экспортируем синглтон
const vibrationManager = new VibrationManager();
export default vibrationManager;