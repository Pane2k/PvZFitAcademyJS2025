import RemovalComponent from "../components/RemovalComponent.js";
export default class LifetimeComponent {
    constructor(duration){
        this.duration = duration
        this.timer = 0
    }
    update(deltaTime){
        for(const entityID of entities){
            const lifetime = this.world.getComponent(entityID, 'LifetimeComponent')
            lifetime.timer += deltaTime
            if(lifetime.timer >= lifetime.duration){
                this.world.addComponent(entityID, new RemovalComponent())
            }
        }
    }
}