import PositionComponent from "../ecs/components/PositionComponent.js";
import SpriteComponent from "../ecs/components/SpriteComponent.js";
import RenderableComponent from "../ecs/components/RenderableComponent.js";
import GridLocationComponent from '../ecs/components/GridLocationComponent.js';
import Debug from "../core/Debug.js";
import VelocityComponent from "../ecs/components/VelocityComponent.js";
import CollectibleComponent from "../ecs/components/CollectibleComponent.js";
import LifetimeComponent from "../ecs/components/LifetimeComponent.js";
import RemovalComponent from "../ecs/components/RemovalComponent.js";

const componentMap = {
    PositionComponent,
    SpriteComponent,
    RenderableComponent,
    GridLocationComponent,
    VelocityComponent,
    CollectibleComponent,
    LifetimeComponent,
    RemovalComponent
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
                const width = initialData.gridCoords ? this.grid.cellWidth * scale : 80 * scale
                const height = initialData.gridCoords ? this.grid.cellHeight * scale : 80 * scale
                
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
                component = new CompClass(protoData.vx, protoData.vy)
            }

            else {
                component = new CompClass()
            }

            if(component){
                this.world.addComponent(entityID, component)
            }
        }
        Debug.log(`Entity '${name}' created with ID: ${entityID}`)
        return entityID
    }
    updateGrid(newGrid) {
        this.grid = newGrid
    }
}