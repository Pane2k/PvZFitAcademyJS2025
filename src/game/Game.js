import GameLoop from '../core/GameLoop.js'
import Renderer from '../core/Renderer.js'
import AssetLoader from '../core/AssetLoader.js'
import World from '../ecs/World.js'

// Системы
import RenderSystem from '../ecs/systems/RenderSystem.js'

// Компоненты
import PositionComponent from '../ecs/components/PositionComponent.js'
import SpriteComponent from '../ecs/components/SpriteComponent.js'
import RenderableComponent from '../ecs/components/RenderableComponent.js'
import Debug from '../core/Debug.js'

export default class Game{
    constructor(){
        this.renderSystem = null
        this.canvas = document.getElementById('game-canvas')
        this.renderer = new Renderer(this.canvas)
        this.assetLoader = new AssetLoader()
        this.world = new World()
        
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this))
        
    }
    async start(){
        await this.loadAssets()
        this.setupECS()
        this.createTestEntity()
        this.gameLoop.start()
    }
    async loadAssets(){
        Debug.log('Loading assets...')
        await this.assetLoader.loadImage('peashooter', 'assets/images/peashooter.png')
        Debug.log('Assets loaded.')
    }
    setupECS(){
        this.renderSystem = new RenderSystem(this.renderer)
        this.world.addSystem(this.renderSystem)
    
    }
    createTestEntity(){
        const peashooterSprite = this.assetLoader.getImage('peashooter')
        const peashooter = this.world.createEntity()
        this.world.addComponent(peashooter, new PositionComponent(100, 100, 80, 80))
        this.world.addComponent(peashooter, new SpriteComponent(peashooterSprite))
        this.world.addComponent(peashooter, new RenderableComponent())

        Debug.log(`Test entity created with ID: ${peashooter}`)
    }

    update(deltaTime){
        this.world.update(deltaTime)
    }
    render(){
        this.renderer.clear('#2c3e50')
        if(this.renderSystem){
            this.renderSystem.update()
        }
    }
}