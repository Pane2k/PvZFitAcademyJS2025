import eventBus from "../core/EventBus.js";
import Debug from "../core/Debug.js";
import progressManager from "../game/ProgressManager.js";
import soundManager from "../core/SoundManager.js";

export default class PauseMenu {
    constructor(assetLoader, virtualWidth, virtualHeight) {
        this.vWidth = virtualWidth;
        this.vHeight = virtualHeight;

        this.isVisible = false;
        this.panelImage = assetLoader.getImage('ui_pause_panel');
        this.buttonImage = assetLoader.getImage('ui_button_default');
        this.sliderBgImage = assetLoader.getImage('ui_slider_bg');
        this.sliderHandleImage = assetLoader.getImage('ui_slider_handle');

        this.width = 400;
        this.height = 350;
        this.x = (this.vWidth - this.width) / 2;
        this.y = (this.vHeight - this.height) / 2;

        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.headerHeight = 50;

        this.elements = {
            'continueBtn': { x: 50, y: 280, width: 140, height: 50, text: 'Продолжить' },
            'exitBtn': { x: 210, y: 280, width: 140, height: 50, text: 'Выйти' },
            'settingsBtn': { x: (this.width - 180) / 2, y: 210, width: 180, height: 50, text: 'Настройки' },
            'musicSlider': { x: 50, y: 80, width: 300, height: 30, text: 'Музыка', value: progressManager.getSetting('musicVolume') },
            'sfxSlider': { x: 50, y: 150, width: 300, height: 30, text: 'Эффекты', value: progressManager.getSetting('sfxVolume') }
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
        if (!this.isVisible && !this.isDragging && !this.activeSlider) return;

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
                if (el.text && this._isInside(worldX, worldY, this.x + el.x, this.y + el.y, el.width, el.height)) {
                    this._onButtonClick(key);
                    return;
                }
            }

            ['musicSlider', 'sfxSlider'].forEach(key => {
                 const el = this.elements[key];
                 if (this._isInside(worldX, worldY, this.x + el.x, this.y + el.y, el.width, el.height)) {
                    this.activeSlider = el;
                    this._updateSliderValue(worldX);
                 }
            });

        } else if (eventName === 'input:move') {
            if (this.isDragging) {
                this.x = worldX - this.dragOffsetX;
                this.y = worldY - this.dragOffsetY;
            }
            if (this.activeSlider) {
                this._updateSliderValue(worldX);
            }

        } else if (eventName === 'input:up') {
            this.isDragging = false;
            this.activeSlider = null;
        }
    }

    _updateSliderValue(worldX) {
        const slider = this.activeSlider;
        if (!slider) return;
        const relativeX = worldX - (this.x + slider.x);
        slider.value = Math.max(0, Math.min(1, relativeX / slider.width));
    }

    _onButtonClick(key) {
        Debug.log(`Pause menu button clicked: ${key}`);
        if (key === 'continueBtn') {
            eventBus.publish('game:resume');
        } else if (key === 'exitBtn') {
            // --- VVV ИЗМЕНЕНИЕ: Передаем все данные, включая событие отмены VVV ---
            eventBus.publish('ui:show_exit_confirmation', {
                question: 'выйти в главное меню',
                confirmEvent: 'game:confirm_exit',
                cancelEvent: 'gameplay:hide_confirmation' // Указываем, какое событие для отмены
            });
            // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---
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

        renderer.drawText("Пауза", this.x + this.width / 2, this.y + 30, '28px Arial', 'white', 'center', 'middle');

        for (const key in this.elements) {
            const el = this.elements[key];
            if (el.text && el.width && el.height) { // Это кнопка
                if (this.buttonImage) renderer.drawImage(this.buttonImage, this.x + el.x, this.y + el.y, el.width, el.height);
                renderer.drawText(el.text, this.x + el.x + el.width / 2, this.y + el.y + el.height / 2, '20px Arial', 'black', 'center', 'middle');
            } else { // Это слайдер
                renderer.drawText(el.text, this.x + el.x, this.y + el.y - 15, '18px Arial', 'white', 'left');
                if (this.sliderBgImage) renderer.drawImage(this.sliderBgImage, this.x + el.x, this.y + el.y, el.width, el.height);
                if (this.sliderHandleImage) {
                    const handleWidth = 20;
                    const handleX = this.x + el.x + (el.width - handleWidth) * el.value;
                    renderer.drawImage(this.sliderHandleImage, handleX, this.y + el.y, handleWidth, el.height);
                }
            }
        }
        
        if (Debug.showInteractables) {
             renderer.drawRect(this.x, this.y, this.width, this.headerHeight, 'rgba(255, 0, 255, 0.5)', 2);
        }
    }
}