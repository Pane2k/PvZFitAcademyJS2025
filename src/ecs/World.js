import Debug from '../core/Debug.js'

export default class World {
    constructor(){
        this.entites = new Map()
        this.systems = []
        this.nextEntityID = 0
    }
    createEntity(){
        const entityID = this.nextEntityID++
        this.entites.set(entityID, new Map())
        return entityID
    }

    addComponent(entityID, component){
        const entityComponents = this.entites.get(entityID)
        entityComponents.set(component.constructor.name, component)
    }
    addSystem(system){
        this.systems.push(system)
        system.world = this
        Debug.log(`System ${system.constructor.name} added.`)
    }
    getEntitiesWithComponents(...componentNames){
        const result = []
        for (const [entityID, components] of this.entites.entries()) {
            if(componentNames.every(name => components.has(name))){
                result.push(entityID)
            }
        }
        return result
    }
    getComponent(entityID, componentName){
        return this.entites.get(entityID)?.get(componentName)
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