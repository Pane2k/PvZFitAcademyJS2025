import BaseState from "./BaseState.js";
import Button from "../../ui/Button.js";
import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
import GameplayState from "./GameplayState.js";
import progressManager from "../ProgressManager.js";

export default class MainMenuState extends BaseState {
    constructor(game) {
        super();
        this.game = game;
        
        this.mainMenuElements = [];
        this.levelSelectElements = [];
        
        this.cameraX = 0;
        this.targetCameraX = 0;
        this.isTransitioning = false;

        this.boundHandleInputDown = (pos) => this.routeInput('down', pos);
        this.boundHandleInputUp = (pos) => this.routeInput('up', pos);
        this.boundHandleInputMove = (pos) => this.routeInput('move', pos);
    }

    enter() {
        Debug.log('Entering MainMenuState...');
        this.setupUI();
        eventBus.subscribe('input:down', this.boundHandleInputDown);
        eventBus.subscribe('input:up', this.boundHandleInputUp);
        eventBus.subscribe('input:move', this.boundHandleInputMove);
    }

    exit() {
        Debug.log('Exiting MainMenuState...');
        eventBus.unsubscribe('input:down', this.boundHandleInputDown);
        eventBus.unsubscribe('input:up', this.boundHandleInputUp);
        eventBus.unsubscribe('input:move', this.boundHandleInputMove);
    }
    
    setupUI() {
        this.mainMenuElements = [];
        this.levelSelectElements = [];
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.game.renderer.VIRTUAL_HEIGHT;
        const assetLoader = this.game.assetLoader;

        const btnWidth = V_WIDTH * 0.27;
        const btnHeight = V_HEIGHT * 0.11;
        const btnSpacing = V_HEIGHT * 0.03;
        const centerX = (V_WIDTH - btnWidth) - 150;
        const startY = V_HEIGHT * 0.4;
        const buttonFont = `${Math.round(V_HEIGHT * 0.045)}px Arial`;

        this.mainMenuElements.push(new Button({
            x: centerX, y: startY, width: btnWidth, height: btnHeight, text: "Начать игру", font: buttonFont,
            images: { idle: assetLoader.getImage('btn_start_idle'), hover: assetLoader.getImage('btn_start_hover'), pressed: assetLoader.getImage('btn_start_pressed') },
            onClick: () => {
                if (!this.isTransitioning) {
                    this.targetCameraX = 1;
                    this.isTransitioning = true;
                    this.mainMenuElements.forEach(el => el.resetState && el.resetState());
                }
            }
        }));
        
        this.mainMenuElements.push(new Button({
            x: centerX, y: startY + btnHeight + btnSpacing, width: btnWidth, height: btnHeight, text: "Настройки", font: buttonFont,
            images: { idle: assetLoader.getImage('btn_settings_idle'), hover: assetLoader.getImage('btn_settings_hover'), pressed: assetLoader.getImage('btn_settings_pressed') },
            onClick: () => { Debug.log("TODO: Open Settings Modal"); }
        }));
        this.mainMenuElements.push(new Button({
            x: centerX, y: startY + 2 * (btnHeight + btnSpacing), width: btnWidth, height: btnHeight, text: "Сбросить", font: buttonFont,
            images: { idle: assetLoader.getImage('btn_reset_idle'), hover: assetLoader.getImage('btn_reset_hover'), pressed: assetLoader.getImage('btn_reset_pressed') },
            onClick: () => { progressManager.resetProgress(); this.setupUI(); Debug.log("Progress Reset!"); }
        }));

        const cardWidth = V_WIDTH * 0.14;
        const cardHeight = cardWidth * 1.22;
        const cardSpacing = V_WIDTH * 0.03;
        const totalBlockWidth = (5 * cardWidth) + (4 * cardSpacing);
        const blockStartX = (V_WIDTH - totalBlockWidth) / 2;
        const cardY = (V_HEIGHT - cardHeight) / 2;
        const cardFont = `${Math.round(V_HEIGHT * 0.033)}px Arial`;
        
        for (let i = 0; i < 5; i++) {
            const levelId = i + 1;
            this.levelSelectElements.push({
                id: levelId, x: blockStartX + i * (cardWidth + cardSpacing), y: cardY, 
                width: cardWidth, height: cardHeight, font: cardFont, isUnlocked: progressManager.isLevelUnlocked(levelId),
                onClick: () => { if(progressManager.isLevelUnlocked(levelId)) this.game.stateManager.changeState(new GameplayState(this.game)); }
            });
        }
        
        const backBtnWidth = V_WIDTH * 0.11;
        const backBtnHeight = V_HEIGHT * 0.08;
        this.levelSelectElements.push(new Button({
            x: V_WIDTH * 0.02, y: V_HEIGHT * 0.03, width: backBtnWidth, height: backBtnHeight, text: "Назад", font: `${Math.round(V_HEIGHT * 0.035)}px Arial`,
            images: { idle: assetLoader.getImage('btn_start_idle'), hover: assetLoader.getImage('btn_start_hover'), pressed: assetLoader.getImage('btn_start_pressed') },
            onClick: () => {
                if (!this.isTransitioning) {
                    this.targetCameraX = 0;
                    this.isTransitioning = true;
                    this.levelSelectElements.forEach(el => el.resetState && el.resetState());
                }
            }
        }));
    }

    routeInput(eventName, pos) {
        if (this.isTransitioning) return;
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;

        if (this.targetCameraX === 0) {
            const cameraOffset = -this.cameraX * V_WIDTH;
            this.mainMenuElements.forEach(element => {
                element.handleInput(eventName, pos, cameraOffset);
            });
        } else if (this.targetCameraX === 1) {
            const cameraOffset = (1 - this.cameraX) * V_WIDTH;
            this.levelSelectElements.forEach(element => {
                if (element.handleInput) {
                    element.handleInput(eventName, pos, cameraOffset);
                } else {
                    const localX = pos.x - cameraOffset;
                    if (this._isInside(localX, pos.y, element.x, element.y, element.width, element.height)) {
                        if (eventName === 'up') element.onClick();
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
            if (Math.abs(diff) > 0.001) {
                this.cameraX += diff * speed;
            } else {
                this.cameraX = this.targetCameraX;
                this.isTransitioning = false;
            }
        }
    }
    
    render() {
        const renderer = this.game.renderer;
        const ctx = renderer.ctx;
        renderer.clear('black');

        const V_WIDTH = renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = renderer.VIRTUAL_HEIGHT;

        // --- ОБНОВЛЕННАЯ ЛОГИКА ОТРИСОВКИ ФОНА ---

        // 1. Получаем оба фона
        const bgMainMenu = this.game.assetLoader.getImage('bg_main_menu');
        const bgLevelSelect = this.game.assetLoader.getImage('bg_level_select');

        // 2. Рассчитываем их прозрачность
        const mainMenuBgAlpha = 1 - this.cameraX;
        const levelSelectBgAlpha = this.cameraX;

        // 3. Рисуем фон главного меню, если он видим
        if (bgMainMenu && mainMenuBgAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = mainMenuBgAlpha;
            renderer.drawImage(bgMainMenu, 0, 0, V_WIDTH, V_HEIGHT);
            ctx.restore();
        }

        // 4. Рисуем фон выбора уровней поверх, если он видим
        if (bgLevelSelect && levelSelectBgAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = levelSelectBgAlpha;
            renderer.drawImage(bgLevelSelect, 0, 0, V_WIDTH, V_HEIGHT);
            ctx.restore();
        }
        
        // --- КОНЕЦ ОБНОВЛЕННОЙ ЛОГИКИ ФОНА ---

        const menuSlideX = -this.cameraX * V_WIDTH;
        const levelsSlideX = (1 - this.cameraX) * V_WIDTH;
        
        const mainMenuUiAlpha = 1 - this.cameraX;
        const levelSelectUiAlpha = this.cameraX;

        if (mainMenuUiAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = mainMenuUiAlpha;
            this.mainMenuElements.forEach(element => {
                if (element.draw) element.draw(renderer, menuSlideX, 0);
            });
            ctx.restore();
        }
        
        if (levelSelectUiAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = levelSelectUiAlpha;
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
                        if (levelIcon) renderer.drawImage(levelIcon, finalX + (element.width - iconSize)/2, element.y + element.height * 0.1, iconSize, iconSize * 0.8);
                    } else {
                        const lockIconSize = element.width * 0.4;
                        const lockIcon = assetLoader.getImage('lock_icon');
                        if(lockIcon) renderer.drawImage(lockIcon, finalX + (element.width - lockIconSize) / 2, element.y + (element.height - lockIconSize) / 2 - element.height * 0.1, lockIconSize, lockIconSize);
                    }
                    renderer.drawText(`Уровень ${element.id}`, finalX + element.width / 2, element.y + element.height * 0.85, element.font, 'white', 'center', 'middle');
                }
            });
            ctx.restore();
        }
    }
}