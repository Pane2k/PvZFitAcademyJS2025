export default class SlowedComponent {
    constructor(duration, slowFactor) {
        this.timer = duration;
        this.slowFactor = slowFactor;
        this.originalSpeed = null;
    }
}