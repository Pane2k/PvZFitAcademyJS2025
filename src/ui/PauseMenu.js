import eventBus from "../core/EventBus.js";
import Debug from "../core/Debug.js";

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
        this.height = 300;
        this.x = (this.vWidth - this.width) / 2;
        this.y = (this.vHeight - this.height) / 2;

        // --- НОВЫЕ СВОЙСТВА ДЛЯ ПЕРЕТАСКИВАНИЯ ---
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.headerHeight = 50; // Высота области для "захвата"
        // ---

        this.elements = {
            'continueBtn': { x: 50, y: 220, width: 140, height: 50, text: 'Продолжить' },
            'exitBtn': { x: 210, y: 220, width: 140, height: 50, text: 'Выйти' },
            'musicSlider': { x: 50, y: 100, width: 300, height: 30, text: 'Музыка', value: 0.8 },
            'sfxSlider': { x: 50, y: 160, width: 300, height: 30, text: 'Эффекты', value: 1.0 }
        };

        this.activeSlider = null;
        
        // --- НОВЫЙ МЕТОД: Сохраняем привязанную функцию для корректного удаления слушателя ---
        this._boundHandleWindowBlur = this._handleWindowBlur.bind(this);
    }

    toggle(isVisible) {
        this.isVisible = isVisible;
        // --- НОВАЯ ЛОГИКА: Добавляем/убираем слушатель расфокуса ---
        if (this.isVisible) {
            window.addEventListener('blur', this._boundHandleWindowBlur);
        } else {
            window.removeEventListener('blur', this._boundHandleWindowBlur);
            // Принудительно сбрасываем состояние, если меню скрыли во время перетаскивания
            this._handleWindowBlur();
        }
    }

    // --- НОВЫЙ МЕТОД: Обработчик потери фокуса ---
    _handleWindowBlur() {
        this.isDragging = false;
        this.activeSlider = null;
        Debug.log('Window lost focus, dragging stopped.');
    }

    // --- ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЙ МЕТОД ОБРАБОТКИ ВВОДА ---
    handleInput(eventName, pos) {
        if (!this.isVisible && !this.isDragging && !this.activeSlider) return;

        const worldX = pos.x;
        const worldY = pos.y;

        if (eventName === 'input:down') {
            // 1. Проверяем клик по заголовку для начала перетаскивания
            if (this._isInside(worldX, worldY, this.x, this.y, this.width, this.headerHeight)) {
                this.isDragging = true;
                this.dragOffsetX = worldX - this.x;
                this.dragOffsetY = worldY - this.y;
                Debug.log('Pause menu dragging started.');
                return; // Выходим, чтобы не активировать другие элементы
            }
            
            // 2. Проверяем клик по кнопкам
            for (const key in this.elements) {
                const el = this.elements[key];
                if (el.text && this._isInside(worldX, worldY, this.x + el.x, this.y + el.y, el.width, el.height)) {
                    this._onButtonClick(key);
                    return;
                }
            }

            // 3. Проверяем клик по слайдерам
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
            // Сбрасываем все активные состояния при отпускании кнопки мыши
            this.isDragging = false;
            this.activeSlider = null;
        }
    }

    _updateSliderValue(worldX) {
        const slider = this.activeSlider;
        if (!slider) return;
        const relativeX = worldX - (this.x + slider.x);
        slider.value = Math.max(0, Math.min(1, relativeX / slider.width));
        // Debug.log(`Slider ${slider.text} value changed to ${slider.value.toFixed(2)}`);
    }

    _onButtonClick(key) {
        Debug.log(`Pause menu button clicked: ${key}`);
        if (key === 'continueBtn') {
            eventBus.publish('game:resume');
        } else if (key === 'exitBtn') {
            eventBus.publish('ui:show_exit_confirmation');
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