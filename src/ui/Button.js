// src/ui/Button.js

import Debug from "../core/Debug.js";

export default class Button {
    constructor(config) {
        // ... (конструктор без изменений)
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
    
    // ... (resetState без изменений)
    resetState() {
        this.state = 'idle';
        this.isHovered = false;
    }

    handleInput(eventName, pos, cameraOffsetX = 0) {
    const localX = pos.x - cameraOffsetX;
    const localY = pos.y;

    const wasHovered = this.isHovered;
    this.isHovered = this._isInside(localX, localY);

    if (this.isHovered && !wasHovered) {
        console.log(`[Button Event] MOUSE ENTER -> "${this.text}"`);
    } else if (!this.isHovered && wasHovered) {
        console.log(`[Button Event] MOUSE LEAVE -> "${this.text}"`);
    }

    // VVV ИСПРАВЛЕНИЯ ЗДЕСЬ VVV
    if (eventName === 'input:down') {
        if (this.isHovered) this.state = 'pressed';
    } else if (eventName === 'input:up') {
        if (this.state === 'pressed' && this.isHovered) {
            if (this.onClick) {
                console.log(`[Button Event] CLICK -> "${this.text}"`);
                this.onClick();
            }
        }
        this.state = this.isHovered ? 'hover' : 'idle';
    } else if (eventName === 'input:move') {
        if (this.state !== 'pressed') {
            this.state = this.isHovered ? 'hover' : 'idle';
        }
    }
    // ^^^ КОНЕЦ ИСПРАВЛЕНИЙ ^^^
}

    _isInside(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    draw(renderer, offsetX = 0, offsetY = 0) {
        // ... (метод draw без изменений)
        const finalX = this.x + offsetX;
        const finalY = this.y + offsetY;

        const imageToDraw = this.images[this.state] || this.images.idle;
        if (imageToDraw) {
            renderer.drawImage(imageToDraw, finalX, finalY, this.width, this.height);
        }

        if (this.text) {
            renderer.drawText(this.text, finalX + this.width / 2, finalY + this.height / 2, this.font, 'white', 'center', 'middle');
        }
    }
}