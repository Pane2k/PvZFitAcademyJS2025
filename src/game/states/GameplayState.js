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
import ScaleAnimationSystem from "../../ecs/systems/ScaleAnimationSystem.js";
import FadeEffectSystem from "../../ecs/systems/FadeEffectSystem.js";
import VictorySystem from "../../ecs/systems/VictorySystem.js";
import BounceAnimationSystem from "../../ecs/systems/BounceAnimationSystem.js";
import ZombieSoundSystem from "../../ecs/systems/ZombieSoundSystem.js";

import Grid from "../Grid.js";
import Factory from "../Factory.js";
import eventBus from "../../core/EventBus.js";
import HUD from "../../ui/HUD.js";
import Background from "../Background.js";
import GameOverSystem from "../../ecs/systems/GameOverSystem.js";
import MainMenuState from "./MainMenuState.js";
import soundManager from "../../core/SoundManager.js";
import vibrationManager from "../../core/VibrationManager.js";
import PauseMenu from "../../ui/PauseMenu.js";
import ConfirmationDialog from "../../ui/ConfirmationDialog.js";
import progressManager from "../ProgressManager.js";

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
        
        
        this.canPlayerInteract = false;

        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        
        this.boundHandleInput = this.handleInput.bind(this);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        
        // --- ИЗМЕНЕНИЕ: Удалены дублирующиеся обработчики. Теперь они определяются только в enter() ---

        this.boundOnResume = () => this.togglePause(false);
        this.boundShowConfirm = this.showConfirmation.bind(this);
        this.boundHideConfirm = this.hideConfirmation.bind(this);

        // Инициализируем свойства для обработчиков, которые будут созданы в enter()
        this.boundOnWin = null;
        this.boundOnLose = null;
        this.boundConfirmExit = null;
        this.boundStartLoseSeq = null;
        this.boundHandleTrophyCollected = null;
        this.boundStartVictoryFade = null; // <-- Для починки победы
    }

    // --- Метод handleInput без изменений ---
    handleInput(pos, eventName) {
        if (this.confirmationDialog && this.confirmationDialog.isVisible) {
            this.confirmationDialog.handleInput(eventName, pos);
            return; 
        }
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleInput(eventName, pos);
            return;
        }
        if (!this.isPaused && this.canPlayerInteract) {
            if (eventName === 'input:down' && this.playerInputSystem) {
                this.playerInputSystem.handleGameClick(pos);
            }
        }
    }

    // --- Метод setupGrid без изменений ---
    setupGrid() {
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.game.renderer.VIRTUAL_HEIGHT;
        const gridAreaX = V_WIDTH * 0.10;
        const gridAreaWidth = V_WIDTH * 0.80;
        const gridAreaY = V_HEIGHT * 0.15;
        const gridAreaHeight = V_HEIGHT * 0.70;
        this.grid = new Grid(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight, 5, 9);
        
        if (this.loseSequenceSystem) this.loseSequenceSystem.grid = this.grid;
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
        
        // --- 1. Создание систем и UI (без изменений) ---
        this.cameraSystem = new CameraSystem();
        this.loseSequenceSystem = new LoseSequenceSystem(this.cameraSystem);
        this.victorySystem = new VictorySystem();
        const levelsData = this.game.assetLoader.getJSON('levels');
        const levelData = levelsData[`level_${this.levelId}`] || levelsData.level_1;
        this.game.factory = new Factory(this.game.world, this.game.assetLoader, entityPrototypes, null);
        this.game.world.factory = this.game.factory;
        this.hud.initialize(entityPrototypes, ['peashooter', 'sunflower'], this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.renderSystem = new RenderSystem(this.game.renderer, this.game.assetLoader);
        this.pauseMenu = new PauseMenu(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.confirmationDialog = new ConfirmationDialog(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.playerInputSystem = new PlayerInputSystem(this.game, null, this.hud);
        this.playerInputSystem.factory = this.game.factory;
        this.gridAlignmentSystem = new GridAlignmentSystem(null);
        this.sunSpawningSystem = new SunSpawningSystem(null, null);
        this.setupGrid();
        this.background = new Background(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT, this.grid);
        this.waveSystem = new WaveSystem(levelData, entityPrototypes, this.game.factory);
        const damageSystem = new DamageSystem(this.waveSystem);

        let musicKey = 'music_level_1'; // Тема по умолчанию
        switch (this.levelId) {
            case 1:
            case 3:
                musicKey = 'music_level_1';
                break;
            case 2:
            case 4:
                musicKey = 'music_level_2';
                break;
            case 5:
                musicKey = 'music_level_3';
                break;
        }
        soundManager.playMusic(musicKey);

        // --- 2. Добавление систем в мир (без изменений) ---
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
        this.game.world.addSystem(new ZombieSoundSystem());
        this.createLawnmowers();
        this.game.world.grid = this.grid;

        // --- 3. Создание и привязка всех обработчиков событий (ОБНОВЛЕНО) ---
        
        // --- ДОБАВЛЯЕМ НОВЫЙ ОБРАБОТЧИК ЗВУКА ВЫСТРЕЛА ---
        this.boundOnProjectileFired = () => soundManager.playSoundEffect('pea_shoot', 0.6);
        
        eventBus.subscribe('projectile:fired', this.boundOnProjectileFired);
        // --- ИЗМЕНЕНИЕ: Единое и правильное определение обработчиков ---
        this.boundOnWin = () => {
            // Больше не нужно проигрывать звук здесь
            this.game.transitionManager.startTransition(() => {
                progressManager.completeLevel(this.levelId);
                this.game.stateManager.changeState(new MainMenuState(this.game));
            });
        };
        this.boundOnLose = () => {
            soundManager.playJingle('lose_scream');
            setTimeout(() => soundManager.playSoundEffect('chomp_soft'), 500);
            this.game.transitionManager.startTransition(() => {
                this.game.stateManager.changeState(new MainMenuState(this.game));
            });
        };
        this.boundConfirmExit = () => {
            this.game.transitionManager.startTransition(() => {
                this.game.stateManager.changeState(new MainMenuState(this.game));
            });
        };
        
        this.boundStartLoseSeq = this.loseSequenceSystem.start.bind(this.loseSequenceSystem);
        this.boundHandleTrophyCollected = this.victorySystem.handleTrophyCollected.bind(this.victorySystem);

        // --- КЛЮЧЕВОЙ ФИКС: Создаем обработчик для начала затухания при победе ---
        this.boundStartVictoryFade = () => {
            // 1. Создаем сущность по префабу
            const fadeEntityId = this.game.factory.create('screen_fade_effect', {});
            
            // 2. Если сущность создалась, находим ее компонент и меняем свойство
            if (fadeEntityId !== null) {
                const fadeComponent = this.game.world.getComponent(fadeEntityId, 'FadeEffectComponent');
                if (fadeComponent) {
                    fadeComponent.onCompleteEvent = 'game:win';
                    Debug.log(`Victory fade effect (entity ${fadeEntityId}) configured to publish 'game:win' on complete.`);
                }
            }
        };
        
        // --- 4. Подписка на все события (ОБНОВЛЕНО) ---
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

        // --- КЛЮЧЕВОЙ ФИКС: Подписываемся на событие от VictorySystem ---
        eventBus.subscribe('victory:start_fade', this.boundStartVictoryFade);
        this.canPlayerInteract = false; // Блокируем управление в начале
        this.hud.startIntroSequence();
        // --- Обработчики звуков (без изменений) ---
        this.boundOnSunCollected = () => soundManager.playSoundEffect('sun_collect');
        this.boundOnPeaHit = (data) => {
            const armor = this.game.world.getComponent(data.targetId, 'ArmorComponent');
            if (armor && armor.currentHealth > 0) {
                 // Если есть броня, играем звук удара по пластику/металлу
                 const armorType = armor.initialAttachment;
                 if (armorType.includes('bucket')) {
                     soundManager.playSoundEffect('shield_hit_metal');
                 } else {
                     soundManager.playRandomSound('shield_hit', 2);
                 }
            } else {
                // Если брони нет, играем звук попадания по плоти
                soundManager.playRandomSound('pea_hit', 2, 0.7);
            }
        };
        this.boundOnPlant = () => soundManager.playRandomSound('plant', 2);
        this.boundOnChomp = () => soundManager.playRandomSound('chomp', 2, 0.8);
        this.boundOnPlantDeath = () => soundManager.playSoundEffect('gulp'); // Звук съедания растения
        this.boundOnZombieDefeated = () => soundManager.playRandomSound('zombie_groan', 6);
        this.boundOnLawnmower = () => {
            soundManager.playSoundEffect('lawnmower');
            // setTimeout(() => soundManager.playSoundEffect('explosion', 0.8), 200); 
            vibrationManager.vibrate(500);
        };
        this.boundOnHugeWave = () => {
            soundManager.playSoundEffect('siren');
            setTimeout(() => soundManager.playSoundEffect('huge_wave'), 500);
            vibrationManager.vibrate([100, 50, 100, 50, 100]);
        };
        this.boundOnArmorOrLimbBroken = () => soundManager.playRandomSound('zombie_falling', 2);
        this.boundOnCardSelected = () => soundManager.playSoundEffect('seedlift');
        
        eventBus.subscribe('sun:collected', this.boundOnSunCollected);
        eventBus.subscribe('collision:detected', this.boundOnPeaHit);
        eventBus.subscribe('plant:placed', this.boundOnPlant);
        eventBus.subscribe('melee:hit', this.boundOnChomp);
        eventBus.subscribe('zombie:defeated', this.boundOnZombieDefeated);
        eventBus.subscribe('lawnmower:activated', this.boundOnLawnmower);
        eventBus.subscribe('hud:show_huge_wave_announcement', this.boundOnHugeWave);
        eventBus.subscribe('armor:broken', this.boundOnArmorOrLimbBroken);
        eventBus.subscribe('limb:lost', this.boundOnArmorOrLimbBroken);
        eventBus.subscribe('plant:death', this.boundOnPlantDeath); 
        eventBus.subscribe('card:selected', this.boundOnCardSelected);
    }

    exit() {
        Debug.log('Exiting GameplayState...');
        
        if (this.waveSystem) this.waveSystem.reset();
        if (this.loseSequenceSystem) this.loseSequenceSystem.reset();
        if (this.cameraSystem) this.cameraSystem.reset();
        if (this.victorySystem) this.victorySystem.reset();

        window.removeEventListener('resize', this.resize);
        this.game.gameLoop.setTimeScale(1.0);
        
        // Отписка от всех событий
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
        eventBus.unsubscribe('victory:start_fade', this.boundStartVictoryFade);
        eventBus.unsubscribe('sun:collected', this.boundOnSunCollected);
        eventBus.unsubscribe('collision:detected', this.boundOnPeaHit);
        eventBus.unsubscribe('plant:placed', this.boundOnPlant);
        eventBus.unsubscribe('melee:hit', this.boundOnChomp);
        eventBus.unsubscribe('zombie:defeated', this.boundOnZombieDefeated);
        eventBus.unsubscribe('lawnmower:activated', this.boundOnLawnmower);
        eventBus.unsubscribe('hud:show_huge_wave_announcement', this.boundOnHugeWave);
        eventBus.unsubscribe('armor:broken', this.boundOnArmorOrLimbBroken);
        eventBus.unsubscribe('limb:lost', this.boundOnArmorOrLimbBroken);
        eventBus.unsubscribe('plant:death', this.boundOnPlantDeath);
        eventBus.unsubscribe('card:selected', this.boundOnCardSelected);
        eventBus.unsubscribe('projectile:fired', this.boundOnProjectileFired);

        this.game.world.systems = [];
        this.game.world.entities.clear();
        this.game.world.nextEntityID = 0;
    }

    

    // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ VVV ---
    update(deltaTime) {
        if (!this.canPlayerInteract && this.hud.isIntroFinished()) {
            this.canPlayerInteract = true;
            Debug.log("GameplayState: Intro finished. Player interaction enabled.");
        }

        if (!this.isPaused) {
            this.game.world.deltaTime = deltaTime; 
            
            if (this.canPlayerInteract) {
                this.game.world.update(deltaTime);
            }
        }

        // HUD обновляется всегда, он сам управляет своей анимацией
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
        
        const ctx = this.game.renderer.ctx;
        ctx.save();
        ctx.translate(camOffset * this.game.renderer.scale, 0);
        if (this.background) this.background.drawBack(this.game.renderer);
        ctx.restore();

        const renderSystem = this.game.world.systems.find(s => s instanceof RenderSystem);
        if (renderSystem) {
            renderSystem.update(camOffset);
        }
        
        // --- УДАЛЕНА ЛОГИКА ОТРИСОВКИ ТЕКСТА ИНТРО ---
        // Теперь HUD рисует всё, включая текст интро
        const selectedPlant = this.playerInputSystem ? this.playerInputSystem.selectedPlant : null;
        this.hud.draw(this.game.renderer, selectedPlant);
        
        if (this.pauseMenu) this.pauseMenu.draw(this.game.renderer);
        if (this.confirmationDialog) this.confirmationDialog.draw(this.game.renderer);
        
        this.debugOverlay.draw(this.game.renderer)
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
        if (this.isPaused === pauseState) return;
        this.isPaused = pauseState;
        this.pauseMenu.toggle(this.isPaused);
        this.game.gameLoop.setTimeScale(this.isPaused ? 0.0 : 1.0);
        if (this.isPaused) {
            soundManager.playSoundEffect('pause');
        }
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