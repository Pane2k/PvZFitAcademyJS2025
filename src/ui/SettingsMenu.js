import eventBus from "../core/EventBus.js";
import Debug from "../core/Debug.js";
import progressManager from "../game/ProgressManager.js";
import soundManager from "../core/SoundManager.js";

export default class SettingsMenu {
    constructor(assetLoader, virtualWidth, virtualHeight) {
        this.vWidth = virtualWidth;
        this.vHeight = virtualHeight;
        this.assetLoader = assetLoader;
        this.isVisible = false;

        // Загрузка ассетов
        this.panelImage = assetLoader.getImage('ui_pause_panel');
        this.buttonImage = assetLoader.getImage('ui_button_default');
        this.sliderBgImage = assetLoader.getImage('ui_slider_bg');
        this.sliderHandleImage = assetLoader.getImage('ui_slider_handle');
        this.soundIcons = {
            0: assetLoader.getImage('icon_sound_0'),
            33: assetLoader.getImage('icon_sound_33'),
            66: assetLoader.getImage('icon_sound_66'),
            100: assetLoader.getImage('icon_sound_100')
        };

        // Размеры и позиция
        this.width = 450;
        this.height = 350;
        this.x = (this.vWidth - this.width) / 2;
        this.y = (this.vHeight - this.height) / 2;

        this.elements = {
            'backBtn': { x: (this.width - 160) / 2, y: 270, width: 160, height: 50, text: 'Назад' },
            'musicSlider': { x: 100, y: 100, width: 300, height: 30, text: 'Музыка', value: progressManager.getSetting('musicVolume') },
            'sfxSlider': { x: 100, y: 190, width: 300, height: 30, text: 'Эффекты', value: progressManager.getSetting('sfxVolume') }
        };

        this.activeSlider = null;
    }

    toggle(isVisible) {
        this.isVisible = isVisible;
    }

    handleInput(eventName, pos) {
        if (!this.isVisible) return;
        const worldX = pos.x;
        const worldY = pos.y;

        if (eventName === 'input:down') {
            const backBtn = this.elements.backBtn;
            if (this._isInside(worldX, worldY, this.x + backBtn.x, this.y + backBtn.y, backBtn.width, backBtn.height)) {
                eventBus.publish('ui:hide_settings');
                return;
            }

            ['musicSlider', 'sfxSlider'].forEach(key => {
                const el = this.elements[key];
                if (this._isInside(worldX, worldY, this.x + el.x, this.y + el.y, el.width, el.height)) {
                    this.activeSlider = key;
                    this._updateSliderValue(worldX);
                }
            });
        } else if (eventName === 'input:move') {
            if (this.activeSlider) {
                this._updateSliderValue(worldX);
            }
        } else if (eventName === 'input:up') {
            if (this.activeSlider) {
                const slider = this.elements[this.activeSlider];
                const settingKey = this.activeSlider === 'musicSlider' ? 'musicVolume' : 'sfxVolume';
                progressManager.setSetting(settingKey, slider.value);
                this.activeSlider = null;
            }
        }
    }

    _updateSliderValue(worldX) {
        const slider = this.elements[this.activeSlider];
        if (!slider) return;

        const relativeX = worldX - (this.x + slider.x);
        slider.value = Math.max(0, Math.min(1, relativeX / slider.width));

        if (this.activeSlider === 'musicSlider') {
            soundManager.setMusicVolume(slider.value);
        } else {
            soundManager.setSfxVolume(slider.value);
        }
    }

    _isInside(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    _getSoundIcon(value) {
        if (value === 0) return this.soundIcons[0];
        if (value > 0 && value <= 0.33) return this.soundIcons[33];
        if (value > 0.33 && value < 1) return this.soundIcons[66];
        if (value === 1) return this.soundIcons[100];
        return this.soundIcons[66]; // Default fallback
    }

    draw(renderer) {
        if (!this.isVisible) return;

        renderer.drawImage(this.panelImage, this.x, this.y, this.width, this.height);
        renderer.drawText("Настройки", this.x + this.width / 2, this.y + 40, '28px Arial', 'white', 'center', 'middle');

        // Отрисовка слайдеров
        ['musicSlider', 'sfxSlider'].forEach(key => {
            const el = this.elements[key];
            renderer.drawText(el.text, this.x + this.width / 2, this.y + el.y - 20, '22px Arial', 'white', 'center');
            
            // Иконка
            const icon = this._getSoundIcon(el.value);
            if (icon) renderer.drawImage(icon, this.x + el.x - 60, this.y + el.y - 10, 40, 40);

            // Фон слайдера
            renderer.drawImage(this.sliderBgImage, this.x + el.x, this.y + el.y, el.width, el.height);
            
            // Ручка слайдера
            const handleWidth = 20;
            const handleX = this.x + el.x + (el.width - handleWidth) * el.value;
            renderer.drawImage(this.sliderHandleImage, handleX, this.y + el.y, handleWidth, el.height);
        });

        // Отрисовка кнопки "Назад"
        const backBtn = this.elements.backBtn;
        renderer.drawImage(this.buttonImage, this.x + backBtn.x, this.y + backBtn.y, backBtn.width, backBtn.height);
        renderer.drawText(backBtn.text, this.x + backBtn.x + backBtn.width / 2, this.y + backBtn.y + backBtn.height / 2, '20px Arial', 'black', 'center', 'middle');
    }
}