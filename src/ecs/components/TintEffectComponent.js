export default class TintEffectComponent {
    constructor(baseColor, maxAlpha, duration, fadeInDuration = 0, fadeOutDuration = 0, isManaged = false) {
        this.baseColor = baseColor;
        this.maxAlpha = maxAlpha;
        this.duration = duration;
        this.fadeInDuration = fadeInDuration;
        this.fadeOutDuration = fadeOutDuration;
        this.timer = 0;
        this.isManaged = isManaged; 
    }

    getCurrentAlpha() {
        // Фаза появления (Fade In)
        if (this.timer < this.fadeInDuration) {
            const progress = this.timer / this.fadeInDuration;
            return this.maxAlpha * progress;
        }
        
        // Фаза затухания (Fade Out)
        if (this.timer > this.duration - this.fadeOutDuration) {
            const timeInFadeOut = this.timer - (this.duration - this.fadeOutDuration);
            const progress = 1 - (timeInFadeOut / this.fadeOutDuration);
            return this.maxAlpha * Math.max(0, progress); 
        }

        // Фаза удержания (Hold) - между fadeIn и fadeOut
        return this.maxAlpha;
    }

    getCurrentColor() {
        const alpha = this.getCurrentAlpha();
        return `rgba(${this.baseColor}, ${alpha})`;
    }
}