import Debug from "../core/Debug.js";

export default class Button {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width;
        this.height = config.height;
        this.text = config.text || '';
        this.onClick = config.onClick;
        this.font = config.font || '24px Arial';

        this.images = {
            idle: config.images.idle,
            hover: config.images.hover,
            pressed: config.images.pressed
        };

        this.state = 'idle';
        this.isHovered = false;
    }
    
    // --- НОВЫЙ МЕТОД ---
    /**
     * Принудительно сбрасывает состояние кнопки к исходному.
     */
    resetState() {
        this.state = 'idle';
        this.isHovered = false;
    }

    handleInput(eventName, pos, cameraOffsetX = 0) {
        const localX = pos.x - cameraOffsetX;
        const localY = pos.y;

        this.isHovered = this._isInside(localX, localY);

        if (eventName === 'down') {
            if (this.isHovered) this.state = 'pressed';
        } else if (eventName === 'up') {
            if (this.state === 'pressed' && this.isHovered) {
                if (this.onClick) this.onClick();
            }
            this.state = this.isHovered ? 'hover' : 'idle';
        } else if (eventName === 'move') {
            if (this.state !== 'pressed') {
                this.state = this.isHovered ? 'hover' : 'idle';
            }
        }
    }

    _isInside(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    draw(renderer, offsetX = 0, offsetY = 0) {
        const finalX = this.x + offsetX;
        const finalY = this.y + offsetY;

        const imageToDraw = this.images[this.state];
        if (imageToDraw) {
            renderer.drawImage(imageToDraw, finalX, finalY, this.width, this.height);
        }

        if (this.text) {
            renderer.drawText(this.text, finalX + this.width / 2, finalY + this.height / 2, this.font, 'white', 'center', 'middle');
        }
    }
}