import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";

export default class CameraSystem {
    constructor() {
        this.world = null;
        this.currentOffsetX = 0;
        this.targetOffsetX = 0;
        this.isPanning = false;
        this.isPanComplete = false;
        this.panSpeed = 0.02;

        eventBus.subscribe('game:start_lose_sequence', () => {
            Debug.log("CameraSystem: Lose sequence started. Panning camera to the right.");
            this.targetOffsetX = 400; 
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