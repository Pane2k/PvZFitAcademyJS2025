// src/ui/ConfirmationDialog.js

import eventBus from "../core/EventBus.js";

export default class ConfirmationDialog {
    constructor(assetLoader, virtualWidth, virtualHeight) {
        this.isVisible = false;
        this.panelImage = assetLoader.getImage('ui_dialog_panel');
        this.buttonImage = assetLoader.getImage('ui_button_default');
        
        // --- VVV ИЗМЕНЕНИЯ ЗДЕСЬ VVV ---
        this.question = '';
        this.confirmEvent = '';
        this.cancelEvent = '';
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^ ---

        this.width = 400; // Немного шире для длинных вопросов
        this.height = 200;
        this.x = (virtualWidth - this.width) / 2;
        this.y = (virtualHeight - this.height) / 2;

        this.elements = {
            'yesBtn': { x: 50, y: 120, width: 140, height: 50, text: 'Да' },
            'noBtn': { x: 210, y: 120, width: 140, height: 50, text: 'Нет' },
        };
    }

    // --- VVV ИЗМЕНЕНИЕ: Сигнатура метода и логика VVV ---
    toggle(isVisible, question = '', confirmEvent = '', cancelEvent = '') {
        this.isVisible = isVisible;
        if (this.isVisible) {
            this.question = `Вы уверены, что хотите ${question}?`;
            this.confirmEvent = confirmEvent;
            this.cancelEvent = cancelEvent;
        }
    }
    // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---

    handleInput(eventName, pos) {
        if (!this.isVisible || eventName !== 'input:down') return;
        
        for (const key in this.elements) {
            const el = this.elements[key];
            if (this._isInside(pos.x, pos.y, this.x + el.x, this.y + el.y, el.width, el.height)) {
                // --- VVV ИЗМЕНЕНИЕ: Публикуем сохраненные события VVV ---
                if (key === 'yesBtn' && this.confirmEvent) {
                    eventBus.publish(this.confirmEvent);
                }
                if (key === 'noBtn' && this.cancelEvent) {
                    eventBus.publish(this.cancelEvent);
                }
                // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---
                break;
            }
        }
    }
    
    _isInside(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    draw(renderer) {
        if (!this.isVisible) return;
        
        if (this.panelImage) {
            renderer.drawImage(this.panelImage, this.x, this.y, this.width, this.height);
        }
        
        // --- VVV ИЗМЕНЕНИЕ: Используем сохраненный вопрос VVV ---
        renderer.drawText(this.question, this.x + this.width / 2, this.y + 60, '22px Arial', 'white', 'center', 'middle');
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---

        for (const key in this.elements) {
            const el = this.elements[key];
            if (this.buttonImage) renderer.drawImage(this.buttonImage, this.x + el.x, this.y + el.y, el.width, el.height);
            renderer.drawText(el.text, this.x + el.x + el.width / 2, this.y + el.y + el.height / 2, '20px Arial', 'black', 'center', 'middle');
        }
    }
}