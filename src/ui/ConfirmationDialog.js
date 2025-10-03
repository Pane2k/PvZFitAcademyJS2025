import eventBus from "../core/EventBus.js";

export default class ConfirmationDialog {
    constructor(assetLoader, virtualWidth, virtualHeight) {
        this.isVisible = false;
        this.panelImage = assetLoader.getImage('ui_dialog_panel');
        this.buttonImage = assetLoader.getImage('ui_button_default');

        this.width = 350;
        this.height = 200;
        this.x = (virtualWidth - this.width) / 2;
        this.y = (virtualHeight - this.height) / 2;

        this.elements = {
            'yesBtn': { x: 40, y: 120, width: 120, height: 50, text: 'Да' },
            'noBtn': { x: 190, y: 120, width: 120, height: 50, text: 'Нет' },
        };
    }

    toggle(isVisible) {
        this.isVisible = isVisible;
    }

    handleInput(eventName, pos) {
        if (!this.isVisible || (eventName !== 'mousedown' && eventName !== 'touchstart')) return;
        
        for (const key in this.elements) {
            const el = this.elements[key];
            if (this._isInside(pos.x, pos.y, this.x + el.x, this.y + el.y, el.width, el.height)) {
                if (key === 'yesBtn') eventBus.publish('game:confirm_exit');
                if (key === 'noBtn') eventBus.publish('ui:hide_exit_confirmation');
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
        
        renderer.drawText("Вы уверены, что", this.x + this.width / 2, this.y + 40, '22px Arial', 'white', 'center');
        renderer.drawText("хотите выйти?", this.x + this.width / 2, this.y + 70, '22px Arial', 'white', 'center');

        for (const key in this.elements) {
            const el = this.elements[key];
            if (this.buttonImage) renderer.drawImage(this.buttonImage, this.x + el.x, this.y + el.y, el.width, el.height);
            renderer.drawText(el.text, this.x + el.x + el.width / 2, this.y + el.y + el.height / 2, '20px Arial', 'black', 'center', 'middle');
        }
    }
}