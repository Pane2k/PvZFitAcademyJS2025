import GameLoop from '../core/GameLoop.js'
import Renderer from '../core/Renderer.js'
import AssetLoader from '../core/AssetLoader.js'
import World from '../ecs/World.js'
import InputHandler from '../core/InputHandler.js'

import StateManager from './StateManager.js'
import GameplayState from './states/GameplayState.js'

import Factory from './Factory.js'
// Системы
import RenderSystem from '../ecs/systems/RenderSystem.js'

// Компоненты
import PositionComponent from '../ecs/components/PositionComponent.js'
import SpriteComponent from '../ecs/components/SpriteComponent.js'
import RenderableComponent from '../ecs/components/RenderableComponent.js'
import Debug from '../core/Debug.js'
import eventBus from '../core/EventBus.js'

export default class Game{
    constructor(){
        const VIRTUAL_WIDTH = 1280; // Ширина нашего игрового мира
        const VIRTUAL_HEIGHT = 720; // Высота
        this.canvas = document.getElementById('game-canvas')
        this.renderer = new Renderer(this.canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT)
        this.assetLoader = new AssetLoader()
        this.world = new World()
        this.inputHandler = new InputHandler(this.canvas, this.renderer)
        this.stateManager = new StateManager()
        this.factory = null

        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this))
    }
    async start(){
        eventBus.subscribe('time:toggle_speed', () => {
            if (this.gameLoop.timeScale === 1.0) {
                this.gameLoop.setTimeScale(3.0);
            } else {
                this.gameLoop.setTimeScale(1.0);
            }
        });

        await this.loadAssets()
        this.stateManager.changeState(new GameplayState(this))
        this.gameLoop.start()
    }
    async loadAssets(){
        Debug.log('Loading assets...')
        await Promise.all([
            this.assetLoader.loadImage('peashooter', 'assets/images/peashooter.png'),
            this.assetLoader.loadImage('sun', 'assets/images/sun.png'),
            this.assetLoader.loadImage('zombie_basic', 'assets/images/zombie.png'), 
            this.assetLoader.loadImage('pea', 'assets/images/pea.png'),
            this.assetLoader.loadImage('sunflower', 'assets/images/sunflower.png'),
            this.assetLoader.loadImage('lawnmower', 'assets/images/lawnmower.png'),
            

            this.assetLoader.loadImage('ui_progress_bar', 'assets/images/progress_bar.png'),
            this.assetLoader.loadImage('ui_progress_flag', 'assets/images/progress_flag.png'),
            this.assetLoader.loadImage('ui_zombie_head', 'assets/images/zombie_head.png'),
            this.assetLoader.loadImage('ui_panel', 'assets/images/ui_panel.png'),

            this.assetLoader.loadImage('card_background', 'assets/images/card_bg.png'),
            this.assetLoader.loadImage('sun_icon', 'assets/images/sun.png'),

            this.assetLoader.loadImage('bg_sky', 'assets/images/bg_sky.png'),
            this.assetLoader.loadImage('bg_lawn', 'assets/images/bg_lawn.png'),
            this.assetLoader.loadImage('bg_house', 'assets/images/bg_house.png'),
            this.assetLoader.loadImage('bg_bushes', 'assets/images/bg_bushes.png'),
            this.assetLoader.loadImage('bg_road', 'assets/images/bg_road.png'),

            this.assetLoader.loadJSON('entities', 'data/entities.json'),
            this.assetLoader.loadJSON('levels', 'data/levels.json'),
            
        ])
        
        Debug.log('Assets loaded.')
    }

    update(deltaTime){
        this.stateManager.update(deltaTime)
    }
    render(){
        this.stateManager.render()
        // this.renderer.clear('#2c3e50')
        // if(this.renderSystem){
        //     this.renderSystem.update()
        // }
    }
}