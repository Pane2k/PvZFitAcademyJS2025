export default class BounceAnimationComponent {
    constructor(config) {
        this.duration = config.duration || 1.0;
        this.targetScale = config.targetScale || 1.0;
        this.timer = 0;
    }
}