// src/game/states/LoadingState.js

import BaseState from "./BaseState.js";
import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
import MainMenuState from "./MainMenuState.js";
import soundManager from "../../core/SoundManager.js";

export default class LoadingState extends BaseState {
    // --- VVV ИЗМЕНЕНИЕ: Принимаем фон в конструкторе VVV ---
    constructor(game, backgroundImage) {
        super();
        this.game = game;
        this.backgroundImage = backgroundImage; // Сразу сохраняем фон
        this.status = 'loading'; // 'loading', 'ready', 'error'
        this.message = 'Загрузка...';
        
        this.boundHandleClick = this.handleClick.bind(this);
    }

    enter() {
        Debug.log("Entering LoadingState...");
        eventBus.subscribe('input:down', this.boundHandleClick);

        // Запускаем асинхронную загрузку ОСТАЛЬНЫХ ассетов
        this.game.loadRestAssets()
            .then(() => {
                // Успешная загрузка
                Debug.log("Assets loaded successfully.");
                
                // Передаем загруженные звуки в SoundManager
                for (const [key, buffer] of this.game.assetLoader.audioBuffers.entries()) {
                    soundManager.addSound(key, buffer);
                }

                this.status = 'ready';
                this.message = 'Кликните, чтобы начать';
                this.playReadySound = true;
                soundManager.unlockAudio();
                soundManager.playSoundEffect('zombie_groan_5');
                
            })
            .catch((error) => {
                // Ошибка загрузки
                Debug.error("Failed to load assets:", error);
                this.status = 'error';
                this.message = 'Ошибка загрузки ресурсов.\nПожалуйста, обновите страницу.';
            });
    }

    exit() {
        Debug.log("Exiting LoadingState...");
        eventBus.unsubscribe('input:down', this.boundHandleClick);
    }

    handleClick() {
        if (this.status === 'ready') {
            soundManager.unlockAudio();
            this.game.stateManager.changeState(new MainMenuState(this.game));
        }
    }

    update(deltaTime) {
        // Логика обновления не нужна
    }

    render() {
        const renderer = this.game.renderer;
        const V_WIDTH = renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = renderer.VIRTUAL_HEIGHT;
        
        renderer.clear('#000');

        // Отрисовываем фон, который был передан в конструктор. Он уже 100% загружен.
        if (this.backgroundImage) {
            renderer.drawImage(this.backgroundImage, 0, 0, V_WIDTH, V_HEIGHT);
        }

        // ... (остальной код отрисовки текста без изменений) ...
        const fontColor = this.status === 'error' ? '#FF4D4D' : '#070d31ff';
        const fontSize = 40;
        const font = `${fontSize}px Arial`;

        const lines = this.message.split('\n');
        const lineHeight = fontSize * 1.2;
        const startY = V_HEIGHT / 2 - (lines.length - 1) * lineHeight / 2;

        for (let i = 0; i < lines.length; i++) {
            renderer.drawText(lines[i], V_WIDTH / 2, startY + i * lineHeight, font, fontColor, 'center', 'middle');
        }
    }
}