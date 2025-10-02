import Debug from "../../core/Debug.js";
import DebugOverlay from "../../ui/DebugOverlay.js";
import BaseState from "./BaseState.js";
import PositionComponent from "../../ecs/components/PositionComponent.js";
import SpriteComponent from "../../ecs/components/SpriteComponent.js";
import RenderableComponent from "../../ecs/components/RenderableComponent.js";
import LifetimeComponent from "../../ecs/components/LifetimeComponent.js";

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
import BoundarySystem from "../../ecs/systems/BoundarySystem.js"
import MeleeAttackSystem from "../../ecs/systems/MeleeAttackSystem.js"
import LawnmowerSystem from "../../ecs/systems/LawnmowerSystem.js"
import SunProductionSystem from "../../ecs/systems/SunProductionSystem.js";
import UITravelSystem from "../../ecs/systems/UITravelSystem.js"
import ArcMovementSystem from "../../ecs/systems/ArcMovementSystem.js"
import EffectSystem from "../../ecs/systems/EffectSystem.js"
import MouseFollowingSystem from "../../ecs/systems/MouseFollowingSystem.js"
import CursorFollowingSystem from "../../ecs/systems/CursorFollowingSystem.js"
import AnimationSystem from "../../ecs/systems/AnimationSystem.js"

import Grid from "../Grid.js";
import Factory from "../Factory.js";
import eventBus from "../../core/EventBus.js";
import HUD from "../../ui/HUD.js"
import Background from "../Background.js"

import GameOverSystem from "../../ecs/systems/GameOverSystem.js"
import WinState from "./WinState.js"
import LoseState from "./LoseState.js"
export default class GameplayState extends BaseState{
    constructor(game){
        super()
        this.game = game
        this.hud = new HUD()
        this.debugOverlay = new DebugOverlay()
        this.background = null
        this.waveSystem = null
        this.grid = null
        this.renderSystem = null
        this.playerInputSystem = null
        this.gridAlignmentSystem = null

        this.sunSpawningSystem = null
        this.movementSystem = null

        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize)
        eventBus.subscribe('input:keydown', this.handleKeyDown.bind(this));
        eventBus.subscribe('sun:collected', (data) => {
            if (this.hud) {
                this.hud.sunCount += data.value;
            }
        });
        eventBus.subscribe('game:win', () => this.game.stateManager.changeState(new WinState(this.game, this)));
        eventBus.subscribe('game:lose', () => this.game.stateManager.changeState(new LoseState(this.game, this)));
    }
    setupGrid() {
        const V_WIDTH = this.game.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.game.renderer.VIRTUAL_HEIGHT;

        // Отступ 5% слева, 10% справа для UI и спавна зомби
        const gridAreaX = V_WIDTH * 0.10; 
        const gridAreaWidth = V_WIDTH * 0.80;
        
        // Отступ 15% сверху для HUD, 15% снизу
        const gridAreaY = V_HEIGHT * 0.15;
        const gridAreaHeight = V_HEIGHT * 0.70;

        this.grid = new Grid(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight, 5, 9);
        
        if (this.playerInputSystem) {
            this.playerInputSystem.grid = this.grid
        }
        if (this.gridAlignmentSystem) {
            this.gridAlignmentSystem.updateGrid(this.grid)
        }
        if (this.sunSpawningSystem) {
            this.sunSpawningSystem.updateGrid(this.grid)
            this.sunSpawningSystem.updateFactory(this.game.factory)
        }
        if (this.game.factory) {
            this.game.factory.updateGrid(this.grid)
        }
    }
    resize() {
        Debug.log("GameplayState detected resize. Re-creating grid.");
        this.setupGrid();
    }
    enter() {
        Debug.log('Entering GameplayState...')
        
        const entityPrototypes = this.game.assetLoader.getJSON('entities');
        const levelData = this.game.assetLoader.getJSON('levels').level_1;
        this.game.factory = new Factory(
            this.game.world, 
            this.game.assetLoader, 
            entityPrototypes, 
            null, 
            this.game.canvas // <-- ПЕРЕДАЕМ ССЫЛКУ НА CANVAS
        );
        this.game.world.factory = this.game.factory

        const availablePlants = ['peashooter', 'sunflower']
        this.hud.initialize(
            entityPrototypes,
            availablePlants,
            this.game.assetLoader,
            this.game.renderer.VIRTUAL_WIDTH,
            this.game.renderer.VIRTUAL_HEIGHT
        );

        this.renderSystem = new RenderSystem(this.game.renderer)
        this.playerInputSystem = new PlayerInputSystem(this.game, null, this.hud)
        this.playerInputSystem.factory = this.game.factory

        this.gridAlignmentSystem = new GridAlignmentSystem(null)
        this.movementSystem = new MovementSystem();
        this.sunSpawningSystem = new SunSpawningSystem(null, null);
        this.waveSystem = new WaveSystem(levelData, entityPrototypes, this.game.factory)
        this.shootingSystem = new ShootingSystem(this.game.factory);
        this.collisionSystem = new CollisionSystem();
        this.damageSystem = new DamageSystem();
        this.boundarySystem = new BoundarySystem(this.game.renderer)
        this.meleeAttackSystem = new MeleeAttackSystem()
        this.lawnmowerSystem = new LawnmowerSystem();
        this.sunProductionSystem = new SunProductionSystem();
        this.uiTravelSystem = new UITravelSystem();
        this.arcMovementSystem = new ArcMovementSystem()
        this.effectSystem = new EffectSystem()
        this.cursorFollowingSystem = new CursorFollowingSystem()
        this.animationSystem = new AnimationSystem();

        this.setupGrid();
        this.gameOverSystem = new GameOverSystem(this.grid.offsetX - 30)
        this.mouseFollowingSystem = new MouseFollowingSystem(this.grid)

        this.game.world.addSystem(this.renderSystem)
        this.game.world.addSystem(this.playerInputSystem)
        this.game.world.addSystem(this.gridAlignmentSystem)
        this.game.world.addSystem(this.sunSpawningSystem)
        this.game.world.addSystem(this.movementSystem)
        this.game.world.addSystem(new CleanupSystem())
        this.game.world.addSystem(new LifetimeSystem())
        this.game.world.addSystem(this.waveSystem)
        this.game.world.addSystem(this.shootingSystem);
        this.game.world.addSystem(this.collisionSystem);
        this.game.world.addSystem(this.damageSystem);
        this.game.world.addSystem(this.boundarySystem)
        this.game.world.addSystem(this.meleeAttackSystem)
        this.game.world.addSystem(this.gameOverSystem)
        this.game.world.addSystem(this.lawnmowerSystem);
        this.game.world.addSystem(this.sunProductionSystem);
        this.game.world.addSystem(this.uiTravelSystem);
        this.game.world.addSystem(this.arcMovementSystem)
        this.game.world.addSystem(this.effectSystem)
        this.game.world.addSystem(this.mouseFollowingSystem)
        this.game.world.addSystem(this.cursorFollowingSystem);
        this.game.world.addSystem(this.animationSystem)

        this.createLawnmowers()
        this.game.world.grid = this.grid;
        this.background = new Background(
            this.game.assetLoader,
            this.game.renderer.VIRTUAL_WIDTH,
            this.game.renderer.VIRTUAL_HEIGHT,
            this.grid
        );
    }
    exit(){
        window.removeEventListener('resize', this.resize);
        eventBus.listeners['input:keydown'] = eventBus.listeners['input:keydown'].filter(
            callback => callback !== this.handleKeyDown.bind(this)
        );
        eventBus.listeners['sun:collected'] = [];
        Debug.log('Exiting GameplayState...')
    }
    update(deltaTime){
        this.game.world.update(deltaTime)
        this.hud.update(deltaTime)
        this.debugOverlay.update(deltaTime, this.game.world);
        
    }
     createLawnmowers() {
        if (!this.grid || !this.game.factory) return;

        for (let row = 0; row < this.grid.rows; row++) {
            const worldPos = this.grid.getWorldPos(row, 0); // Позиция центра ячейки
            const lawnmowerSize = 70;
            
            // NOTE: Рассчитываем центральную точку для косилки
            const x = this.grid.offsetX - lawnmowerSize / 2 + 15;
            const y = worldPos.y; // Y уже является центром

            this.game.factory.create('lawnmower', { x, y });
        }
        Debug.log(`${this.grid.rows} lawnmowers created.`);
    }
    
    render(){
        // Шаг 1 Отчистка поля перед перересовкой
        this.game.renderer.clear('#2c3e50');

        // Шаг 2 Рисование слоя заднего фона
        if (this.background) {
            this.background.drawBack(this.game.renderer);
        }
        // Необязательно, дальше закоментировать
        // Рисование сетки
        if (this.grid) {
            // this.grid.draw(this.game.renderer);
        }
        // Шаг 3 Основной рендер из системы рендеринга
        if (this.renderSystem) {
            this.renderSystem.update(0, 99);
        }
        if (this.hud) {
            const selectedPlant = this.playerInputSystem ? this.playerInputSystem.selectedPlant : null;
            this.hud.draw(this.game.renderer, selectedPlant);
        }
        if (this.renderSystem) {
            this.renderSystem.update(100, Infinity);
        }
        
        // Шаг 4 Рисование UI в последнюю очередь
        this.debugOverlay.draw(this.game.renderer);
        
    }

    handleKeyDown(data) {
        if (data.key.toLowerCase() === 'i') {
            this.debugOverlay.toggleVisibility();
        }
    }
}


