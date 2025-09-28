export default class TintEffectComponent {
    constructor(baseColor, maxAlpha, duration, fadeInDuration = 0, fadeOutDuration = 0) {
        this.baseColor = baseColor; // e.g., '255, 255, 0'
        this.maxAlpha = maxAlpha;     // e.g., 0.4
        this.duration = duration;
        this.fadeInDuration = fadeInDuration;
        this.fadeOutDuration = fadeOutDuration;
        this.timer = 0;
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
            return this.maxAlpha * Math.max(0, progress); // Убедимся, что не уходит в минус
        }

        // Фаза удержания (Hold) - между fadeIn и fadeOut
        return this.maxAlpha;
    }

    getCurrentColor() {
        const alpha = this.getCurrentAlpha();
        return `rgba(${this.baseColor}, ${alpha})`;
    }
}