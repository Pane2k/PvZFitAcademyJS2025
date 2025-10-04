import eventBus from "../core/EventBus.js";
import Debug from "../core/Debug.js";

export default class PauseMenu {
    constructor(assetLoader, virtualWidth, virtualHeight) {
        this.vWidth = virtualWidth;
        this.vHeight = virtualHeight;

        this.isVisible = false;
        this.panelImage = assetLoader.getImage('ui_pause_panel');
        this.buttonImage = assetLoader.getImage('ui_button_default');

        this.width = 400;
        this.height = 360;
        this.x = (this.vWidth - this.width) / 2;
        this.y = (this.vHeight - this.height) / 2;

        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.headerHeight = 50;

        const btnWidth = 250;
        const btnHeight = 55;
        const btnSpacing = 15;
        const startY = 70; 

        this.elements = {
            'continueBtn': { x: (this.width - btnWidth) / 2, y: startY, width: btnWidth, height: btnHeight, text: 'Продолжить' },
            'restartBtn':  { x: (this.width - btnWidth) / 2, y: startY + btnHeight + btnSpacing, width: btnWidth, height: btnHeight, text: 'Рестарт' },
            'settingsBtn': { x: (this.width - btnWidth) / 2, y: startY + 2 * (btnHeight + btnSpacing), width: btnWidth, height: btnHeight, text: 'Настройки' },
            'exitBtn':     { x: (this.width - btnWidth) / 2, y: startY + 3 * (btnHeight + btnSpacing), width: btnWidth, height: btnHeight, text: 'Выйти в меню' }
        };

        this.activeSlider = null; 
        this._boundHandleWindowBlur = this._handleWindowBlur.bind(this);
    }

    toggle(isVisible) {
        this.isVisible = isVisible;
        if (this.isVisible) {
            window.addEventListener('blur', this._boundHandleWindowBlur);
        } else {
            window.removeEventListener('blur', this._boundHandleWindowBlur);
            this._handleWindowBlur();
        }
    }

    _handleWindowBlur() {
        this.isDragging = false;
        this.activeSlider = null;
        Debug.log('Window lost focus, dragging stopped.');
    }

    handleInput(eventName, pos) {
        if (!this.isVisible) return; 

        const worldX = pos.x;
        const worldY = pos.y;

        if (eventName === 'input:down') {
            if (this._isInside(worldX, worldY, this.x, this.y, this.width, this.headerHeight)) {
                this.isDragging = true;
                this.dragOffsetX = worldX - this.x;
                this.dragOffsetY = worldY - this.y;
                Debug.log('Pause menu dragging started.');
                return;
            }
            
            for (const key in this.elements) {
                const el = this.elements[key];
                if (this._isInside(worldX, worldY, this.x + el.x, this.y + el.y, el.width, el.height)) {
                    this._onButtonClick(key);
                    return;
                }
            }
        } else if (eventName === 'input:move') {
            if (this.isDragging) {
                this.x = worldX - this.dragOffsetX;
                this.y = worldY - this.dragOffsetY;
            }
        } else if (eventName === 'input:up') {
            this.isDragging = false;
            this.activeSlider = null;
        }
    }

    _onButtonClick(key) {
        Debug.log(`Pause menu button clicked: ${key}`);
        if (key === 'continueBtn') {
            eventBus.publish('game:resume');
        } else if (key === 'restartBtn') {
            eventBus.publish('ui:show_exit_confirmation', {
                question: 'перезапустить уровень', 
                confirmEvent: 'game:confirm_restart', 
                cancelEvent: 'gameplay:hide_confirmation' 
            });
        } else if (key === 'exitBtn') {
            eventBus.publish('ui:show_exit_confirmation', {
                question: 'выйти в главное меню',
                confirmEvent: 'game:confirm_exit',
                cancelEvent: 'gameplay:hide_confirmation'
            });
        } else if (key === 'settingsBtn') {
            eventBus.publish('ui:show_settings');
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

        renderer.drawText("Пауза", this.x + this.width / 2, this.y + 35, '28px Arial', 'white', 'center', 'middle');

        for (const key in this.elements) {
            const el = this.elements[key];
            if (this.buttonImage) renderer.drawImage(this.buttonImage, this.x + el.x, this.y + el.y, el.width, el.height);
            renderer.drawText(el.text, this.x + el.x + el.width / 2, this.y + el.y + el.height / 2, '22px Arial', 'black', 'center', 'middle');
        }
        
        if (Debug.showInteractables) {
             renderer.drawRect(this.x, this.y, this.width, this.headerHeight, 'rgba(255, 0, 255, 0.5)', 2);
        }
    }
}