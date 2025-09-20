import PositionComponent from "../ecs/components/PositionComponent.js";
import SpriteComponent from "../ecs/components/SpriteComponent.js";
import RenderableComponent from "../ecs/components/RenderableComponent.js";
import GridLocationComponent from '../ecs/components/GridLocationComponent.js';
import Debug from "../core/Debug.js";
import VelocityComponent from "../ecs/components/VelocityComponent.js";
import CollectibleComponent from "../ecs/components/CollectibleComponent.js";
import LifetimeComponent from "../ecs/components/LifetimeComponent.js";
import RemovalComponent from "../ecs/components/RemovalComponent.js";
import HealthComponent from "../ecs/components/HealthComponent.js";
import HitboxComponent from "../ecs/components/HitboxComponent.js";

const componentMap = {
    PositionComponent, 
    SpriteComponent, 
    RenderableComponent,
    GridLocationComponent,
    VelocityComponent, 
    CollectibleComponent, 
    LifetimeComponent, 
    RemovalComponent,
    HealthComponent, 
    HitboxComponent
}

export default class Factory{
    constructor(world, assetLoader, entityPrototypes, grid){
        this.world = world
        this.assetLoader = assetLoader
        this.prototypes = entityPrototypes
        this.grid = grid
    }

    create(name, initialData){
        const proto = this.prototypes[name]
        if(!proto){
            Debug.error(`No entity prototype found for name: ${name}`)
            return null
        }
        const entityID = this.world.createEntity()

        for (const compName in proto.components){
            const CompClass = componentMap[compName]
            if (!CompClass){
                Debug.warn(`Unknown component type: ${compName}`)
                continue
            }
            const protoData = proto.components[compName]
            let component

            if(compName === 'PositionComponent'){
                const scale = protoData.scale || 1.0
                const baseSize = this.grid ? this.grid.cellWidth : 80;
                const width = initialData.gridCoords ? baseSize * scale : 80 * scale;
                const height = initialData.gridCoords ? baseSize * scale : 100 * scale;
                
                const x = initialData.x || 0
                const y = initialData.y || 0

                component = new CompClass(x, y, width, height, scale)
            }

            else if(compName === 'SpriteComponent'){
                const sprite = this.assetLoader.getImage(protoData.assetKey)
                if (!sprite) {
                    Debug.error(`Sprite asset not found for key: ${protoData.assetKey}`)
                    continue
                }
                component = new CompClass(sprite)
            }

            else if (compName === 'GridLocationComponent' ){
                if(initialData.gridCoords){
                    component = new CompClass(initialData.gridCoords.row, initialData.gridCoords.col)
                }
            }
            
            else if (compName === 'VelocityComponent') {
                let vx = protoData.vx || 0;
                let vy = protoData.vy || 0;
                if (typeof protoData.baseSpeed !== 'undefined') {
                    const variance = protoData.speedVariance || 0;
                    vx = protoData.baseSpeed + (Math.random() * 2 - 1) * variance;
                }
                component = new CompClass(vx, vy);
            } else if (compName === 'HealthComponent') {
                component = new CompClass(protoData.maxHealth);
            } else if (compName === 'HitboxComponent') {
                component = new CompClass(protoData.offsetX, protoData.offsetY, protoData.width, protoData.height);
            }
            else {
                component = new CompClass()
            }

            if(component){
                this.world.addComponent(entityID, component)
            }
        }
        if (this.world.getComponent(entityID, 'PositionComponent') && !this.world.getComponent(entityID, 'HitboxComponent')) {
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            this.world.addComponent(entityID, new HitboxComponent(0, 0, pos.width, pos.height));
        }
        Debug.log(`Entity '${name}' created with ID: ${entityID}`)
        return entityID
    }
    updateGrid(newGrid) {
        this.grid = newGrid
    }
}