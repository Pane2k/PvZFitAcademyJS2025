import BaseState from "./BaseState.js";
import Button from "../../ui/Button.js";
import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
import GameplayState from "./GameplayState.js";
import progressManager from "../ProgressManager.js";
import soundManager from "../../core/SoundManager.js";
import SettingsMenu from "../../ui/SettingsMenu.js";
import ConfirmationDialog from "../../ui/ConfirmationDialog.js";

export default class MainMenuState extends BaseState {
    constructor(game) {
        super();
        this.game = game;
        
        this.settingsMenu = new SettingsMenu(game.assetLoader, game.renderer.VIRTUAL_WIDTH, game.renderer.VIRTUAL_HEIGHT);
        this.confirmationDialog = new ConfirmationDialog(game.assetLoader, game.renderer.VIRTUAL_WIDTH, game.renderer.VIRTUAL_HEIGHT);
        
        this.mainMenuElements = [];
        this.levelSelectElements = [];
        
        this.cameraX = 0;
        this.targetCameraX = 0;
        this.isTransitioning = false;

        this.boundHandleInputDown = (pos) => this.routeInput('input:down', pos);
        this.boundHandleInputUp = (pos) => this.routeInput('input:up', pos);
        this.boundHandleInputMove = (pos) => this.routeInput('input:move', pos);
        this.boundHideSettings = () => this.settingsMenu.toggle(false);
        this.boundHideConfirm = () => this.confirmationDialog.toggle(false);
        this.boundConfirmReset = () => {
            progressManager.resetProgress();
            this.setupUI();
            this.confirmationDialog.toggle(false);
            Debug.log("Progress Reset Confirmed!");
        };
    }

    enter() {
        Debug.log('Entering MainMenuState...');
        soundManager.unlockAudio();
        soundManager.setMusicVolume(progressManager.getSetting('musicVolume'));
        soundManager.setSfxVolume(progressManager.getSetting('sfxVolume'));
        soundManager.playMusic('music_pregame');
        
        this.setupUI();

        eventBus.subscribe('input:down', this.boundHandleInputDown);
        eventBus.subscribe('input:up', this.boundHandleInputUp);
        eventBus.subscribe('input:move', this.boundHandleInputMove);
        eventBus.subscribe('ui:hide_settings', this.boundHideSettings);
        eventBus.subscribe('mainmenu:confirm_reset', this.boundConfirmReset);
        eventBus.subscribe('mainmenu:hide_confirmation', this.boundHideConfirm);
    }

    exit() {
        Debug.log('Exiting MainMenuState...');
        eventBus.unsubscribe('input:down', this.boundHandleInputDown);
        eventBus.unsubscribe('input:up', this.boundHandleInputUp);
        eventBus.unsubscribe('input:move', this.boundHandleInputMove);
        eventBus.unsubscribe('ui:hide_settings', this.boundHideSettings);
        eventBus.unsubscribe('mainmenu:confirm_reset', this.boundConfirmReset);
        eventBus.unsubscribe('mainmenu:hide_confirmation', this.boundHideConfirm);
    }
    
    setupUI() {
        this.mainMenuElements = [];
        this.levelSelectElements = [];
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.game.renderer.VIRTUAL_HEIGHT;
        const assetLoader = this.game.assetLoader;

        const btnWidth = 280;
        const btnHeight = 70;
        const btnSpacing = 20;
        const centerX = V_WIDTH * 0.75 - (btnWidth / 2);
        const startY = V_HEIGHT / 2 - (3 * btnHeight + 2 * btnSpacing) / 2;
        const buttonFont = `32px Arial`;

        this.mainMenuElements.push(new Button({
            x: centerX, y: startY, width: btnWidth, height: btnHeight, text: "Начать игру", font: buttonFont,
            images: { idle: assetLoader.getImage('btn_start_idle'), hover: assetLoader.getImage('btn_start_hover'), pressed: assetLoader.getImage('btn_start_pressed') },
            onClick: () => {
                soundManager.playSoundEffect('ui_click');
                if (!this.isTransitioning) {
                    this.targetCameraX = 1;
                    this.isTransitioning = true;
                }
            }
        }));
        
        this.mainMenuElements.push(new Button({
            x: centerX, y: startY + btnHeight + btnSpacing, width: btnWidth, height: btnHeight, text: "Настройки", font: buttonFont,
            images: { idle: assetLoader.getImage('btn_settings_idle'), hover: assetLoader.getImage('btn_settings_hover'), pressed: assetLoader.getImage('btn_settings_pressed') },
            onClick: () => { 
                soundManager.playSoundEffect('ui_click');
                this.settingsMenu.toggle(true);
            }
        }));

        this.mainMenuElements.push(new Button({
            x: centerX, y: startY + 2 * (btnHeight + btnSpacing), width: btnWidth, height: btnHeight, text: "Сбросить", font: buttonFont,
            images: { idle: assetLoader.getImage('btn_reset_idle'), hover: assetLoader.getImage('btn_reset_hover'), pressed: assetLoader.getImage('btn_reset_pressed') },
            onClick: () => { 
                soundManager.playSoundEffect('ui_click');
                this.confirmationDialog.toggle(true, 'сбросить прогресс', 'mainmenu:confirm_reset', 'mainmenu:hide_confirmation');
            }
        }));

        const cardWidth = 150;
        const cardHeight = 180;
        const cardSpacing = 30;
        const totalBlockWidth = (5 * cardWidth) + (4 * cardSpacing);
        const blockStartX = (V_WIDTH - totalBlockWidth) / 2;
        const cardY = (V_HEIGHT - cardHeight) / 2;
        const cardFont = `24px Arial`;
        
        for (let i = 0; i < 5; i++) {
            const levelId = i + 1;
            const isUnlocked = progressManager.isLevelUnlocked(levelId);
            this.levelSelectElements.push({
                id: levelId, x: blockStartX + i * (cardWidth + cardSpacing), y: cardY, 
                width: cardWidth, height: cardHeight, font: cardFont, isUnlocked: isUnlocked,
                onClick: () => { 
                    if(isUnlocked) {
                        soundManager.playSoundEffect('ui_click');
                        this.game.stateManager.changeState(new GameplayState(this.game, levelId)); 
                    }
                }
            });
        }
        
        const backBtnWidth = 140;
        const backBtnHeight = 60;
        this.levelSelectElements.push(new Button({
            x: 20, y: 20, width: backBtnWidth, height: backBtnHeight, text: "Назад", font: `28px Arial`,
            images: { idle: assetLoader.getImage('btn_start_idle'), hover: assetLoader.getImage('btn_start_hover'), pressed: assetLoader.getImage('btn_start_pressed') },
            onClick: () => {
                soundManager.playSoundEffect('ui_click');
                if (!this.isTransitioning) {
                    this.targetCameraX = 0;
                    this.isTransitioning = true;
                }
            }
        }));
    }

    routeInput(eventName, pos) {

        console.log(`MainMenu received input: ${eventName}`, pos);
    if (this.settingsMenu.isVisible) {
        this.settingsMenu.handleInput(eventName, pos);
        return; 
    }
    if (this.confirmationDialog.isVisible) {
        this.confirmationDialog.handleInput(eventName, pos);
        return; 
    }

        if (this.isTransitioning) return;
        
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;

        if (this.cameraX < 0.5) { 
            this.mainMenuElements.forEach(element => element.handleInput(eventName, pos, -this.cameraX * V_WIDTH));
        } else {
            const cameraOffset = (1 - this.cameraX) * V_WIDTH;
            this.levelSelectElements.forEach(element => {
                if (element.handleInput) { 
                    element.handleInput(eventName, pos, cameraOffset);
                } else { 
                    const localX = pos.x - cameraOffset;
                    if (this._isInside(localX, pos.y, element.x, element.y, element.width, element.height)) {
                        if (eventName === 'input:up') element.onClick();
                    }
                }
            });
        }
    }
    
    _isInside(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    
    update(deltaTime) {
        if (this.isTransitioning) {
            
            const speed = 0.08;
            const diff = this.targetCameraX - this.cameraX;
            if (Math.abs(diff) > 0.001) this.cameraX += diff * speed;
            else { this.cameraX = this.targetCameraX; this.isTransitioning = false; }
        }
    }
    
    render() {
        const renderer = this.game.renderer;
        const ctx = renderer.ctx;
        renderer.clear('black');

        const V_WIDTH = renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = renderer.VIRTUAL_HEIGHT;
        const bgMainMenu = this.game.assetLoader.getImage('bg_main_menu');
        const bgLevelSelect = this.game.assetLoader.getImage('bg_level_select');

        if (bgMainMenu) {
            ctx.save();
            ctx.globalAlpha = 1 - this.cameraX;
            renderer.drawImage(bgMainMenu, 0, 0, V_WIDTH, V_HEIGHT);
            ctx.restore();
        }
        if (bgLevelSelect) {
            ctx.save();
            ctx.globalAlpha = this.cameraX;
            renderer.drawImage(bgLevelSelect, 0, 0, V_WIDTH, V_HEIGHT);
            ctx.restore();
        }
        
        const menuSlideX = -this.cameraX * V_WIDTH;
        const levelsSlideX = (1 - this.cameraX) * V_WIDTH;
        
        if ((1 - this.cameraX) > 0.01) {
            ctx.save();
            ctx.globalAlpha = 1 - this.cameraX;
            this.mainMenuElements.forEach(element => element.draw(renderer, menuSlideX, 0));
            ctx.restore();
        }
        
        if (this.cameraX > 0.01) {
            ctx.save();
            ctx.globalAlpha = this.cameraX;
            const assetLoader = this.game.assetLoader;
            this.levelSelectElements.forEach(element => {
                if (element.draw) {
                    element.draw(renderer, levelsSlideX, 0);
                } else {
                    const finalX = element.x + levelsSlideX;
                    const cardImg = element.isUnlocked ? assetLoader.getImage('level_card_unlocked') : assetLoader.getImage('level_card_locked');
                    renderer.drawImage(cardImg, finalX, element.y, element.width, element.height);
                    
                    if (element.isUnlocked) {
                        const iconSize = element.width * 0.8;
                        const levelIcon = assetLoader.getImage(`level_icon_${element.id}`);
                        if (levelIcon) renderer.drawImage(levelIcon, finalX + (element.width - iconSize)/2, element.y + element.height * 0.05, iconSize, iconSize * 0.8);
                    } else {
                        const lockIconSize = element.width * 0.4;
                        const lockIcon = assetLoader.getImage('lock_icon');
                        if(lockIcon) renderer.drawImage(lockIcon, finalX + (element.width - lockIconSize) / 2, element.y + (element.height - lockIconSize) / 2 - element.height * 0.15, lockIconSize, lockIconSize);
                    }
                    renderer.drawText(`Уровень ${element.id}`, finalX + element.width / 2, element.y + element.height * 0.82, element.font, 'white', 'center', 'middle');
                }
            });
            ctx.restore();
        }
        
        this.settingsMenu.draw(renderer);
        this.confirmationDialog.draw(renderer);
    }
}