import BaseState from "./BaseState.js";
import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
import MainMenuState from "./MainMenuState.js";
import soundManager from "../../core/SoundManager.js";

export default class LoadingState extends BaseState {
    constructor(game, backgroundImage) {
        super();
        this.game = game;
        this.backgroundImage = backgroundImage; 
        this.status = 'loading'; 
        this.message = 'Загрузка...';
        
        this.boundHandleClick = this.handleClick.bind(this);
    }

    enter() {
        Debug.log("Entering LoadingState...");
        eventBus.subscribe('input:down', this.boundHandleClick);

        this.game.loadRestAssets()
            .then(() => {
                Debug.log("Assets loaded successfully.");
                
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
    }

    render() {
        const renderer = this.game.renderer;
        const V_WIDTH = renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = renderer.VIRTUAL_HEIGHT;
        
        renderer.clear('#000');

        if (this.backgroundImage) {
            renderer.drawImage(this.backgroundImage, 0, 0, V_WIDTH, V_HEIGHT);
        }

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