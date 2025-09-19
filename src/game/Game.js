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

export default class Game{
    constructor(){
        this.canvas = document.getElementById('game-canvas')
        this.renderer = new Renderer(this.canvas)
        this.assetLoader = new AssetLoader()
        this.world = new World()
        this.inputHandler = new InputHandler(this.canvas)
        this.stateManager = new StateManager()
        this.factory = null

        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this))
    }
    async start(){
        await this.loadAssets()
        this.stateManager.changeState(new GameplayState(this))
        this.gameLoop.start()
    }
    async loadAssets(){
        Debug.log('Loading assets...')
        await Promise.all([
            this.assetLoader.loadImage('peashooter', 'assets/images/peashooter.png'),
            this.assetLoader.loadImage('sun', 'assets/images/sun.png'), 
            this.assetLoader.loadJSON('entities', 'data/entities.json')
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