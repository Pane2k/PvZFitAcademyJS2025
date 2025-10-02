// src/ecs/components/DyingComponent.js
export default class DyingComponent {
    constructor(duration) {
        this.duration = duration; // Длительность анимации смерти
        this.timer = 0;
    }
}