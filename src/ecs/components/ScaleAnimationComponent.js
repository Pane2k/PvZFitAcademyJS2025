export default class ScaleAnimationComponent {
    constructor(targetScale, speed) {
        this.targetScale = targetScale;
        this.speed = speed;
        this.initialWidth = 0;
        this.initialHeight = 0;
    }
}