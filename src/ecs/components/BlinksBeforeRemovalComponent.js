// src/ecs/components/BlinksBeforeRemovalComponent.js
export default class BlinksBeforeRemovalComponent {
    constructor(blinkDuration = 2.0) {
        this.blinkDuration = blinkDuration; // За сколько секунд до исчезновения начинать мигать
    }
}