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

        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.headerHeight = 50;

        this.elements = {
            'continueBtn': { x: 50, y: 220, width: 140, height: 50, text: 'Продолжить' },
            'exitBtn': { x: 210, y: 220, width: 140, height: 50, text: 'Выйти' },
            'musicSlider': { x: 50, y: 100, width: 300, height: 30, text: 'Музыка', value: 0.8 },
            'sfxSlider': { x: 50, y: 160, width: 300, height: 30, text: 'Эффекты', value: 1.0 }
        };

        this.activeSlider = null;
        
        // --- ИЗМЕНЕНИЕ: Создаем привязанную функцию для обработчика событий ---
        // Это нужно, чтобы 'this' внутри функции указывал на экземпляр PauseMenu.
        this._boundHandleWindowBlur = this._handleWindowBlur.bind(this);
    }

    // --- ИЗМЕНЕНИЕ: Модифицируем метод toggle для управления глобальным слушателем ---
    toggle(isVisible) {
        this.isVisible = isVisible;
        if (this.isVisible) {
            // Когда меню появляется, начинаем слушать потерю фокуса
            window.addEventListener('blur', this._boundHandleWindowBlur);
        } else {
            // Когда меню исчезает, прекращаем слушать, чтобы не было утечек памяти
            window.removeEventListener('blur', this._boundHandleWindowBlur);
            this._handleWindowBlur(); // На всякий случай сбрасываем состояние
        }
    }

    // --- НОВЫЙ МЕТОД: Обработчик потери фокуса окном ---
    _handleWindowBlur() {
        Debug.log("Window lost focus, cancelling drag/slide.");
        this.isDragging = false;
        this.activeSlider = null;
    }

    handleInput(eventName, pos) {
        if (!this.isVisible) return;

        const worldX = pos.x;
        const worldY = pos.y;

        // --- ИЗМЕНЕНИЕ: Упрощаем имена событий в соответствии с новой системой ---
        if (eventName === 'down') {
            if (this._isInside(worldX, worldY, this.x, this.y, this.width, this.headerHeight)) {
                this.isDragging = true;
                this.dragOffsetX = worldX - this.x;
                this.dragOffsetY = worldY - this.y;
                return;
            }
            // ... (остальная логика нажатия на кнопки/слайдеры без изменений)
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

        } else if (eventName === 'move') {
            if (this.isDragging) {
                this.x = worldX - this.dragOffsetX;
                this.y = worldY - this.dragOffsetY;
            }
            if (this.activeSlider) {
                this._updateSliderValue(worldX);
            }

        } else if (eventName === 'up') {
            this.isDragging = false;
            this.activeSlider = null;
        }
    }

    _updateSliderValue(worldX) {
        // ... (код без изменений)
        const slider = this.activeSlider;
        if (!slider) return;
        const relativeX = worldX - (this.x + slider.x);
        slider.value = Math.max(0, Math.min(1, relativeX / slider.width));
        Debug.log(`Slider ${slider.text} value changed to ${slider.value.toFixed(2)}`);
    }

    _onButtonClick(key) {
        // ... (код без изменений)
        if (key === 'continueBtn') {
            eventBus.publish('game:resume');
        } else if (key === 'exitBtn') {
            eventBus.publish('ui:show_exit_confirmation');
        }
    }

    _isInside(px, py, rx, ry, rw, rh) {
        // ... (код без изменений)
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    draw(renderer) {
        if (!this.isVisible) return;

        // --- ИЗМЕНЕНИЕ: Этот блок полностью удален ---
        // 1. Полупрозрачный фон на весь экран
        // const ctx = renderer.ctx;
        // ctx.save();
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        // ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
        // ctx.restore();
        // --- КОНЕЦ УДАЛЕННОГО БЛОКА ---

        // 2. Панель меню (без изменений)
        if (this.panelImage) {
            renderer.drawImage(this.panelImage, this.x, this.y, this.width, this.height);
        } else {
            renderer.drawRect(this.x, this.y, this.width, this.height, 'grey');
        }

        // 3. Заголовок (без изменений)
        renderer.drawText("Пауза", this.x + this.width / 2, this.y + 30, '28px Arial', 'white', 'center', 'middle');

        // 4. Элементы (без изменений)
        for (const key in this.elements) {
            const el = this.elements[key];
            if (el.text && el.width && el.height) { // Кнопка
                if (this.buttonImage) renderer.drawImage(this.buttonImage, this.x + el.x, this.y + el.y, el.width, el.height);
                renderer.drawText(el.text, this.x + el.x + el.width / 2, this.y + el.y + el.height / 2, '20px Arial', 'black', 'center', 'middle');
            } else { // Слайдер
                renderer.drawText(el.text, this.x + el.x, this.y + el.y - 15, '18px Arial', 'white', 'left');
                if (this.sliderBgImage) renderer.drawImage(this.sliderBgImage, this.x + el.x, this.y + el.y, el.width, el.height);
                if (this.sliderHandleImage) {
                    const handleWidth = 20;
                    const handleX = this.x + el.x + (el.width - handleWidth) * el.value;
                    renderer.drawImage(this.sliderHandleImage, handleX, this.y + el.y, handleWidth, el.height);
                }
            }
        }
    }
}