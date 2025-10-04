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

    vibrate(pattern) {
        if (this.isSupported) {
            navigator.vibrate(pattern);
        }
    }

    stop() {
        if (this.isSupported) {
            navigator.vibrate(0);
        }
    }
}

const vibrationManager = new VibrationManager();
export default vibrationManager;