import Debug from '../core/Debug.js'

export default class World {
    constructor(){
        this.entities = new Map()
        this.systems = []
        this.nextEntityID = 0
    }
    createEntity(){
        const entityID = this.nextEntityID++
        this.entities.set(entityID, new Map())
        return entityID
    }
    removeEntity(entityID){
    
        const isCollectible = this.getComponent(entityID, 'CollectibleComponent');

        if (this.grid) { 
            const gridLoc = this.getComponent(entityID, 'GridLocationComponent');
            if (gridLoc && !isCollectible) {
                this.grid.removeEntity(gridLoc.row, gridLoc.col);
            }
        }
        this.entities.delete(entityID);
        Debug.log(`Entity ${entityID} removed.`);
    }
    removeComponent(entityID, componentName) {
        const entityComponents = this.entities.get(entityID);
        if (entityComponents) {
            entityComponents.delete(componentName);
        }
    }
    addComponent(entityID, component){
        const entityComponents = this.entities.get(entityID)
        entityComponents.set(component.constructor.name, component)
    }
    addSystem(system){
        this.systems.push(system)
        system.world = this
        Debug.log(`System ${system.constructor.name} added.`)
    }
    getEntitiesWithComponents(...componentNames){
        const result = []
        for (const [entityID, components] of this.entities.entries()) {
            if(componentNames.every(name => components.has(name))){
                result.push(entityID)
            }
        }
        return result
    }
    getComponent(entityID, componentName){
        return this.entities.get(entityID)?.get(componentName)
    }
    update(deltaTime){
        for(const system of this.systems){
            if(system.constructor.name === 'RenderSystem') continue
            if(system.update){
                system.update(deltaTime)
            }
        }
    }

}