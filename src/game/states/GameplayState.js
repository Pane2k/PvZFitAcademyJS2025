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

import Grid from "../Grid.js";
import Factory from "../Factory.js";
import eventBus from "../../core/EventBus.js";
import HUD from "../../ui/HUD.js"


export default class GameplayState extends BaseState{
    constructor(game){
        super()
        this.game = game
        this.hud = new HUD()
        this.debugOverlay = new DebugOverlay()
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
    }
    setupGrid() {
        const canvas = this.game.renderer.canvas
        const marginX = canvas.width * 0.05
        const marginY = canvas.height * 0.10
        const gridAreaX = marginX
        const gridAreaY = marginY
        const gridAreaWidth = canvas.width - (marginX * 2)
        const gridAreaHeight = canvas.height - (marginY * 2)

        this.grid = new Grid(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight, 5, 9)
        
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
        this.game.factory = new Factory(this.game.world, this.game.assetLoader, entityPrototypes, null);

        const availablePlants = ['peashooter']
        this.hud.initializeCards(entityPrototypes, availablePlants, this.game.assetLoader);

        this.renderSystem = new RenderSystem(this.game.renderer)
        this.playerInputSystem = new PlayerInputSystem(this.game, null, this.hud)
        this.playerInputSystem.factory = this.game.factory

        this.gridAlignmentSystem = new GridAlignmentSystem(null)
        this.movementSystem = new MovementSystem();
        this.sunSpawningSystem = new SunSpawningSystem(null, null);
        this.waveSystem = new WaveSystem(levelData, entityPrototypes, this.game.factory)

        
        


        this.game.world.addSystem(this.renderSystem)
        this.game.world.addSystem(this.playerInputSystem)
        this.game.world.addSystem(this.gridAlignmentSystem)
        this.game.world.addSystem(this.sunSpawningSystem)
        this.game.world.addSystem(this.movementSystem)
        this.game.world.addSystem(new CleanupSystem())
        this.game.world.addSystem(new LifetimeSystem())
        this.game.world.addSystem(this.waveSystem)

        this.setupGrid();
        this.game.world.grid = this.grid;
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
        this.debugOverlay.update(deltaTime);
        
    }
    
    
    render(){
        this.game.renderer.clear('#2c3e50');

        if (this.grid) {
            this.grid.draw(this.game.renderer);
        }
        if(this.renderSystem){
            this.renderSystem.update()
        }
        this.debugOverlay.draw(this.game.renderer);

        if(this.hud){
            const selectedPlant = this.playerInputSystem ? this.playerInputSystem.selectedPlant : null;
            this.hud.draw(this.game.renderer, selectedPlant);
        }
    }

    handleKeyDown(data) {
        if (data.key.toLowerCase() === 'i') {
            this.debugOverlay.toggleVisibility();
        }
    }
}


