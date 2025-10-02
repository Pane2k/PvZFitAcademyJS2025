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

import Grid from "../Grid.js";
import Factory from "../Factory.js";
import eventBus from "../../core/EventBus.js";
import HUD from "../../ui/HUD.js";
import Background from "../Background.js";
import GameOverSystem from "../../ecs/systems/GameOverSystem.js";
import WinState from "./WinState.js";
import LoseState from "./LoseState.js";

export default class GameplayState extends BaseState {
    constructor(game) {
        super();
        this.game = game;
        this.hud = new HUD();
        this.debugOverlay = new DebugOverlay();
        this.grid = null;
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        eventBus.subscribe('input:keydown', this.handleKeyDown.bind(this));
        eventBus.subscribe('game:win', () => this.game.stateManager.changeState(new WinState(this.game, this)));
        eventBus.subscribe('game:lose', () => this.game.stateManager.changeState(new LoseState(this.game, this)));
    }

    setupGrid() {
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.game.renderer.VIRTUAL_HEIGHT;
        const gridAreaX = V_WIDTH * 0.10;
        const gridAreaWidth = V_WIDTH * 0.80;
        const gridAreaY = V_HEIGHT * 0.15;
        const gridAreaHeight = V_HEIGHT * 0.70;
        this.grid = new Grid(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight, 5, 9);
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
        const levelData = this.game.assetLoader.getJSON('levels').level_1;

        this.game.factory = new Factory(this.game.world, this.game.assetLoader, entityPrototypes, null);
        this.game.world.factory = this.game.factory;

        this.hud.initialize(entityPrototypes, ['peashooter', 'sunflower'], this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT);
        this.renderSystem = new RenderSystem(this.game.renderer, this.game.assetLoader);
        this.playerInputSystem = new PlayerInputSystem(this.game, null, this.hud);
        this.playerInputSystem.factory = this.game.factory;
        this.gridAlignmentSystem = new GridAlignmentSystem(null);
        this.sunSpawningSystem = new SunSpawningSystem(null, null);
        
        this.setupGrid(); // Grid setup must happen after factory is created, but before systems that use it are updated.
        
        this.background = new Background(this.game.assetLoader, this.game.renderer.VIRTUAL_WIDTH, this.game.renderer.VIRTUAL_HEIGHT, this.grid);
        
        this.game.world.addSystem(this.renderSystem);
        this.game.world.addSystem(this.playerInputSystem);
        this.game.world.addSystem(this.gridAlignmentSystem);
        this.game.world.addSystem(this.sunSpawningSystem);
        this.game.world.addSystem(new MovementSystem());
        this.game.world.addSystem(new CleanupSystem());
        this.game.world.addSystem(new LifetimeSystem());
        this.game.world.addSystem(new WaveSystem(levelData, entityPrototypes, this.game.factory));
        this.game.world.addSystem(new ShootingSystem(this.game.factory));
        this.game.world.addSystem(new CollisionSystem());
        this.game.world.addSystem(new DamageSystem());
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

        this.createLawnmowers();
        this.game.world.grid = this.grid;
    }

    exit() {
        window.removeEventListener('resize', this.resize);
        eventBus.listeners = {}; // Clear all event listeners on exit
        Debug.log('Exiting GameplayState...');
    }

    update(deltaTime) {
        this.game.world.update(deltaTime);
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
        if (this.background) this.background.drawBack(this.game.renderer);
        if (this.renderSystem) {
            this.renderSystem.update(0, 99);
            const selectedPlant = this.playerInputSystem ? this.playerInputSystem.selectedPlant : null;
            this.hud.draw(this.game.renderer, selectedPlant);
            this.renderSystem.update(100, Infinity);
        }
        this.debugOverlay.draw(this.game.renderer);
    }

    handleKeyDown(data) {
        if (data.key.toLowerCase() === 'i') {
            this.debugOverlay.toggleVisibility();
        }
    }
}