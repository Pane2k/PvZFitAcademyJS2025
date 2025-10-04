export default class FadeEffectComponent {
    constructor(config) {
        this.duration = config.duration;
        this.startAlpha = config.startAlpha;
        this.targetAlpha = config.targetAlpha;
        this.onCompleteEvent = config.onCompleteEvent;
        this.timer = 0;
        this.currentAlpha = this.startAlpha;
    }
}