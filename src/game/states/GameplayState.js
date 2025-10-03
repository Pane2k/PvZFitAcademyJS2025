import Debug from "../../core/Debug.js";
import DebugOverlay from "../../ui/DebugOverlay.js";
import BaseState from "./BaseState.js";
import GridAlignmentSystem from "../../ecs/systems/GridAlignmentSystem.js";
import PlayerInputSystem from "../../ecs/systems/PlayerInputSystem.js";
import RenderSystem from "../../ecs/systems/RenderSystem.js";
import CleanupSystem from "../../ecs/systems/CleanupSystem.js";
import SunSpawningSystem from "../../ecs/systems/SunSpawningSystem.js";
import MovementSystem from "../../ecs/systems/MovementSystem.js";
import LifetimeSystem from "../../ecs/systems/LifetimeSystem.js";
import WaveSystem from "../../ecs/systems/WaveSystem.js";
import ShootingSystem from "../../ecs/systems/ShootingSystem.js";
import CollisionSystem from "../../ecs/systems/CollisionSystem.js";
import DamageSystem from "../../ecs/systems/DamageSystem.js";
import BoundarySystem from "../../ecs/systems/BoundarySystem.js";
import MeleeAttackSystem from "../../ecs/systems/MeleeAttackSystem.js";
import LawnmowerSystem from "../../ecs/systems/LawnmowerSystem.js";
import SunProductionSystem from "../../ecs/systems/SunProductionSystem.js";
import UITravelSystem from "../../ecs/systems/UITravelSystem.js";
import ArcMovementSystem from "../../ecs/systems/ArcMovementSystem.js";
import EffectSystem from "../../ecs/systems/EffectSystem.js";
import MouseFollowingSystem from "../../ecs/systems/MouseFollowingSystem.js";
import CursorFollowingSystem from "../../ecs/systems/CursorFollowingSystem.js";
import AnimationSystem from "../../ecs/systems/AnimationSystem.js";
import ArmorSystem from "../../ecs/systems/ArmorSystem.js";
import HealthMonitorSystem from "../../ecs/systems/HealthMonitorSystem.js";
import DragonBonesSystem from "../../ecs/systems/DragonBonesSystem.js";

import CameraSystem from "../../ecs/systems/CameraSystem.js";
import LoseSequenceSystem from "../../ecs/systems/LoseSequenceSystem.js";
import DeathLootSystem from "../../ecs/systems/DeathLootSystem.js";
import ScaleAnimationSystem from "../../ecs/systems/ScaleAnimationSystem.js";
import FadeEffectSystem from "../../ecs/systems/FadeEffectSystem.js";
import VictorySystem from "../../ecs/systems/VictorySystem.js";
import BounceAnimationSystem from "../../ecs/systems/BounceAnimationSystem.js";
import Grid from "../Grid.js";
import Factory from "../Factory.js";
import eventBus from "../../core/EventBus.js";
import HUD from "../../ui/HUD.js";
import Background from "../Background.js";
import GameOverSystem from "../../ecs/systems/GameOverSystem.js";
import WinState from "./WinState.js";
import LoseState from "./LoseState.js";
import MainMenuState from "./MainMenuState.js";


import PauseMenu from "../../ui/PauseMenu.js";
import ConfirmationDialog from "../../ui/ConfirmationDialog.js";

import progressManager from "../ProgressManager.js"

export default class GameplayState extends BaseState {
     constructor(game, levelId) {
        super();
        this.game = game;
        this.levelId = levelId || 1
        this.hud = new HUD();
        this.debugOverlay = new DebugOverlay();
        this.grid = null;
        this.isPaused = false;
        this.pauseMenu = null;
        this.confirmationDialog = null;
        this.waveSystem = null;
        this.cameraSystem = null;
        this.loseSequenceSystem = null;
        this.victorySystem = null;

        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        
        this.boundHandleInput = this.handleInput.bind(this);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        
        // --- VVV ИЗМЕНЕНИЕ: Упрощаем колбэки VVV ---
        this.boundOnWin = () => {
            this.game.transitionManager.startTransition(() => {
                progressManager.completeLevel(this.levelId);
                this.game.stateManager.changeState(new MainMenuState(this.game));
            });
        };
        this.boundOnLose = () => {
            this.game.transitionManager.startTransition(() => {
                this.game.stateManager.changeState(new MainMenuState(this.game));
            });
        };
        this.boundConfirmExit = () => {
            this.game.transitionManager.startTransition(() => {
                this.game.stateManager.changeState(new MainMenuState(this.game));
            });
        };
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---

        this.boundOnResume = () => this.togglePause(false);
        this.boundShowConfirm = this.showConfirmation.bind(this);
        this.boundHideConfirm = this.hideConfirmation.bind(this);
        this.boundStartLoseSeq = null;
        this.boundHandleTrophyCollected = null;
    }


    // --- ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЙ МЕТОД-МАРШРУТИЗАТОР ВВОДА ---
    handleInput(pos, eventName) {
        if (this.confirmationDialog && this.confirmationDialog.isVisible) {
            this.confirmationDialog.handleInput(eventName, pos);
            return; 
        }
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleInput(eventName, pos);
            return;
        }
        if (!this.isPaused) {
            if (eventName === 'input:down' && this.playerInputSystem) {
                this.playerInputSystem.handleGameClick(pos);
            }
        }
    }
    routeUiInput(pos, eventName) { // EventBus передает данные первым аргументом
        if (this.confirmationDialog && this.confirmationDialog.isVisible) {
            this.confirmationDialog.handleInput(eventName, pos);
            return;
        }
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleInput(eventName, pos);
            return;
        }
    }

    setupGrid() {
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.game.renderer.VIRTUAL_HEIGHT;
        const gridAreaX = V_WIDTH * 0.10;
        const gridAreaWidth = V_WIDTH * 0.80;
        const gridAreaY = V_HEIGHT * 0.15;
        const gridAreaHeight = V_HEIGHT * 0.70;
        this.grid = new Grid(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight, 5, 9);
        
        // --- VVV НОВАЯ СТРОКА VVV ---
        // Передаем созданную сетку в систему проигрыша
        this.loseSequenceSystem.grid = this.grid;
        // --- ^^^ КОНЕЦ НОВОЙ СТРОКИ ^^^ ---
        
        if (this.playerInputSystem) this.playerInputSystem.grid = this.grid;
        if (this.gridAlignmentSystem) this.gridAlignmentSystem.updateGrid(this.grid);
        if (this.sunSpawningSystem) {
            this.sunSpawningSystem.updateGrid(this.grid);
            this.sunSpawningSystem.updateFactory(this.game.factory);
        }
        if (this.game.factory) this.game.factory.updateGrid(this.grid);
        if (this.mouseFollowingSystem) this.mouseFollowingSystem.updateGrid(this.grid);
    }

    resize() {
        Debug.log("GameplayState detected resize. Re-creating grid.");
        this.setupGrid();
    }

    enter() {
        Debug.log('Entering GameplayState...');
        const entityPrototypes = this.game.assetLoader.getJSON('entities');
        
        // --- 1. Создаем экземпляры систем с состоянием ---
        this.cameraSystem = new CameraSystem();
        this.loseSequenceSystem = new LoseSequenceSystem(this.cameraSystem);
        this.victorySystem = new VictorySystem();

        const levelsData = this.game.assetLoader.getJSON('levels');
        const levelData = levelsData[`level_${this.levelId}`] || levelsData.level_1;

        this.game.factory = new Factory(this.game.world, this.game.assetLoader, entityPrototypes, null);
        this.game.world.factory = this.game.factory;

        // --- 2. Инициализируем UI и служебные классы ---
        this.hud.initialize(entityPrototypes, ['peashooter', 'sunflower'], this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.renderSystem = new RenderSystem(this.game.renderer, this.game.assetLoader);
        this.pauseMenu = new PauseMenu(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.confirmationDialog = new ConfirmationDialog(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.playerInputSystem = new PlayerInputSystem(this.game, null, this.hud);
        this.playerInputSystem.factory = this.game.factory;
        this.gridAlignmentSystem = new GridAlignmentSystem(null);
        this.sunSpawningSystem = new SunSpawningSystem(null, null);
        
        this.setupGrid(); // Настраиваем сетку, которая нужна многим системам
        
        this.background = new Background(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT, this.grid);
        
        this.waveSystem = new WaveSystem(levelData, entityPrototypes, this.game.factory);
        const damageSystem = new DamageSystem(this.waveSystem);

        // --- 3. Добавляем все системы в игровой мир ---
        this.game.world.addSystem(this.renderSystem);
        this.game.world.addSystem(this.playerInputSystem);
        this.game.world.addSystem(this.gridAlignmentSystem);
        this.game.world.addSystem(this.sunSpawningSystem);
        this.game.world.addSystem(new MovementSystem());
        this.game.world.addSystem(new CleanupSystem());
        this.game.world.addSystem(new LifetimeSystem());
        this.game.world.addSystem(this.waveSystem);
        this.game.world.addSystem(new ShootingSystem(this.game.factory));
        this.game.world.addSystem(new CollisionSystem());
        this.game.world.addSystem(damageSystem);
        this.game.world.addSystem(new BoundarySystem(this.game.renderer));
        this.game.world.addSystem(new MeleeAttackSystem());
        this.game.world.addSystem(new GameOverSystem(this.grid.offsetX - 30));
        this.game.world.addSystem(new LawnmowerSystem());
        this.game.world.addSystem(new SunProductionSystem());
        this.game.world.addSystem(new UITravelSystem());
        this.game.world.addSystem(new ArcMovementSystem());
        this.game.world.addSystem(new EffectSystem());
        this.game.world.addSystem(new MouseFollowingSystem(this.grid));
        this.game.world.addSystem(new CursorFollowingSystem());
        this.game.world.addSystem(new AnimationSystem());
        this.game.world.addSystem(new DragonBonesSystem());
        this.game.world.addSystem(new ArmorSystem());
        this.game.world.addSystem(new HealthMonitorSystem());
        this.game.world.addSystem(this.cameraSystem);
        this.game.world.addSystem(this.loseSequenceSystem);
        this.game.world.addSystem(new ScaleAnimationSystem());
        this.game.world.addSystem(new FadeEffectSystem());
        this.game.world.addSystem(this.victorySystem);
        this.game.world.addSystem(new BounceAnimationSystem());

        this.createLawnmowers();
        this.game.world.grid = this.grid;

        // --- 4. Создаем и привязываем все обработчики событий ---
        this.boundOnWin = () => {
            const onMidpoint = () => {
                progressManager.completeLevel(this.levelId);
                this.game.stateManager.changeState(new MainMenuState(this.game));
            };
            this.game.transitionManager.startTransition(onMidpoint, null);
        };
        this.boundOnLose = () => {
            const onMidpoint = () => {
                this.game.stateManager.changeState(new MainMenuState(this.game));
            };
            this.game.transitionManager.startTransition(onMidpoint, null);
        };
        this.boundConfirmExit = () => {
            const onMidpoint = () => {
                this.game.stateManager.changeState(new MainMenuState(this.game));
            };
            this.game.transitionManager.startTransition(onMidpoint, null);
        };

        this.boundStartLoseSeq = this.loseSequenceSystem.start.bind(this.loseSequenceSystem);
        this.boundHandleTrophyCollected = this.victorySystem.handleTrophyCollected.bind(this.victorySystem);

        // --- 5. Подписываемся на все необходимые события ---
        eventBus.subscribe('game:win', this.boundOnWin);
        eventBus.subscribe('game:lose', this.boundOnLose);
        eventBus.subscribe('game:resume', this.boundOnResume);
        eventBus.subscribe('ui:show_exit_confirmation', this.boundShowConfirm);
        eventBus.subscribe('ui:hide_exit_confirmation', this.boundHideConfirm);
        eventBus.subscribe('game:confirm_exit', this.boundConfirmExit);
        eventBus.subscribe('game:start_lose_sequence', this.boundStartLoseSeq);
        eventBus.subscribe('input:down', this.boundHandleInput);
        eventBus.subscribe('input:up', this.boundHandleInput);
        eventBus.subscribe('input:move', this.boundHandleInput);
        eventBus.subscribe('input:keydown', this.boundHandleKeyDown);
        eventBus.subscribe('trophy:collected', this.boundHandleTrophyCollected);
    }

    exit() {
        Debug.log('Exiting GameplayState...');
        
        // --- VVV ИЗМЕНЕНИЕ: УПРОЩАЕМ EXIT VVV ---
        // Сбрасываем только состояние систем, которые НЕ очищаются с миром
        if (this.waveSystem) this.waveSystem.reset();
        if (this.loseSequenceSystem) this.loseSequenceSystem.reset();
        if (this.cameraSystem) this.cameraSystem.reset();
        if (this.victorySystem) this.victorySystem.reset();

        window.removeEventListener('resize', this.resize);
        this.game.gameLoop.setTimeScale(1.0);
        
        // Отписываемся от всех событий
        eventBus.unsubscribe('game:win', this.boundOnWin);
        eventBus.unsubscribe('game:lose', this.boundOnLose);
        eventBus.unsubscribe('game:resume', this.boundOnResume);
        eventBus.unsubscribe('ui:show_exit_confirmation', this.boundShowConfirm);
        eventBus.unsubscribe('ui:hide_exit_confirmation', this.boundHideConfirm);
        eventBus.unsubscribe('game:confirm_exit', this.boundConfirmExit);
        eventBus.unsubscribe('game:start_lose_sequence', this.boundStartLoseSeq);
        eventBus.unsubscribe('input:down', this.boundHandleInput);
        eventBus.unsubscribe('input:up', this.boundHandleInput);
        eventBus.unsubscribe('input:move', this.boundHandleInput);
        eventBus.unsubscribe('input:keydown', this.boundHandleKeyDown);
        eventBus.unsubscribe('trophy:collected', this.boundHandleTrophyCollected);
        
        // Очищаем мир ПОЛНОСТЬЮ. Сущность перехода очистится здесь же.
        this.game.world.systems = [];
        this.game.world.entities.clear();
        this.game.world.nextEntityID = 0;
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---
    }
    

    update(deltaTime) {
        if (!this.isPaused) {
            this.game.world.deltaTime = deltaTime; 
            this.game.world.update(deltaTime);
        }
        // HUD и оверлей обновляются всегда
        this.hud.update(deltaTime);
        this.debugOverlay.update(deltaTime, this.game.world);
    }

    createLawnmowers() {
        if (!this.grid || !this.game.factory) return;
        for (let row = 0; row < this.grid.rows; row++) {
            const worldPos = this.grid.getWorldPos(row, 0);
            const lawnmowerSize = 70;
            const x = this.grid.offsetX - lawnmowerSize / 2 + 15;
            const y = worldPos.y;
            this.game.factory.create('lawnmower', { x, y });
        }
        Debug.log(`${this.grid.rows} lawnmowers created.`);
    }
    
    render() {
        this.game.renderer.clear('#2c3e50');
        const camOffset = this.cameraSystem.currentOffsetX;
        
        // --- ИЗМЕНЕНИЕ: Фон тоже должен двигаться вместе с камерой ---
        const ctx = this.game.renderer.ctx;
        ctx.save();
        // Применяем сдвиг ДО отрисовки фона
        ctx.translate(camOffset * this.game.renderer.scale, 0);
        if (this.background) this.background.drawBack(this.game.renderer);
        ctx.restore();

        // Находим систему рендеринга один раз
        const renderSystem = this.game.world.systems.find(s => s instanceof RenderSystem);

        if (renderSystem) {
            // --- ИЗМЕНЕНИЕ: Один вызов update для всех слоев ---
            renderSystem.update(camOffset);
        }
        
        // UI рендерится поверх всего и без смещения
        const selectedPlant = this.playerInputSystem ? this.playerInputSystem.selectedPlant : null;
        this.hud.draw(this.game.renderer, selectedPlant);
        if (this.pauseMenu) this.pauseMenu.draw(this.game.renderer);
        if (this.confirmationDialog) this.confirmationDialog.draw(this.game.renderer);
        
        this.debugOverlay.draw(this.game.renderer);
    }

    handleKeyDown(data) {
        if (data.key.toLowerCase() === 'i') {
            this.debugOverlay.toggleVisibility();
        }
        if (data.key.toLowerCase() === ' ' && (!this.confirmationDialog || !this.confirmationDialog.isVisible)) {
            this.togglePause(!this.isPaused);
        }
    }
    togglePause(pauseState) {
        this.isPaused = pauseState;
        this.pauseMenu.toggle(this.isPaused);
        // Устанавливаем timeScale в 0, чтобы полностью остановить игровую логику
        this.game.gameLoop.setTimeScale(this.isPaused ? 0.0 : 1.0);
        Debug.log(`Game paused: ${this.isPaused}`);
    }

    showConfirmation() {
        if (this.pauseMenu) this.pauseMenu.toggle(false);
        if (this.confirmationDialog) this.confirmationDialog.toggle(true);
    }

    hideConfirmation() {
        if (this.confirmationDialog) this.confirmationDialog.toggle(false);
        if (this.pauseMenu) this.pauseMenu.toggle(true);
    }
}