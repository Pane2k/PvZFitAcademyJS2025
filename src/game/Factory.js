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
import OutOfBoundsRemovalComponent from "../ecs/components/OutOfBoundsRemovalComponent.js";
import ShootsProjectilesComponent from "../ecs/components/ShootsProjectilesComponent.js";
import ProjectileComponent from "../ecs/components/ProjectileComponent.js";
import PlantComponent from "../ecs/components/PlantComponent.js";
import MeleeAttackComponent from "../ecs/components/MeleeAttackComponent.js";
import AttackingComponent from "../ecs/components/AttackingComponent.js";
import PrefabComponent from "../ecs/components/PrefabComponent.js"
import ZombieComponent from "../ecs/components/ZombieComponent.js"
import LawnmowerComponent from "../ecs/components/LawnmowerComponent.js"
import SunProducerComponent from "../ecs/components/SunProducerComponent.js";

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
    HitboxComponent, 
    ShootsProjectilesComponent,
    ProjectileComponent,
    OutOfBoundsRemovalComponent,
    PlantComponent, 
    MeleeAttackComponent,
    AttackingComponent,
    PrefabComponent,
    ZombieComponent,
    LawnmowerComponent,
    SunProducerComponent

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
        this.world.addComponent(entityID, new PrefabComponent(name))
        const spriteProto = proto.components.SpriteComponent;
        const sprite = this.assetLoader.getImage(spriteProto.assetKey);
        if (sprite) {
            this.world.addComponent(entityID, new SpriteComponent(sprite));
        }

        for (const compName in proto.components){
            if(compName === 'SpriteComponent') continue
            const CompClass = componentMap[compName]
            if (!CompClass){
                Debug.warn(`Unknown component type: ${compName}`)
                continue
            }
            const protoData = proto.components[compName]
            let component

            if(compName === 'PositionComponent'){
                let width = 0;
                let height = 0;

                if (sprite && sprite.width > 0) {
                    const aspectRatio = sprite.width / sprite.height;
                    if (protoData.height) { // Если в JSON задана высота
                        height = protoData.height;
                        width = height * aspectRatio;
                    } else if (protoData.width) { // Если в JSON задана ширина
                        width = protoData.width;
                        height = width / aspectRatio;
                    }
                }
                component = new CompClass(initialData.x || 0, initialData.y || 0, width, height);
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
            } else if (compName === 'ShootsProjectilesComponent') {
                component = new CompClass(protoData.projectileName, protoData.fireRate, protoData.projectileSpeed);
            } else if (compName === 'ProjectileComponent') {
                component = new CompClass(protoData.damage);
            } else if (compName === 'MeleeAttackComponent') {
                component = new CompClass(protoData.damage, protoData.attackRate);
            }else if (compName === 'SunProducerComponent') { 
                component = new CompClass(protoData.productionRate, protoData.sunValue);
            }
            else {
                component = new CompClass()
            }

            if(component){
                this.world.addComponent(entityID, component)
            }
        }
        const pos = this.world.getComponent(entityID, 'PositionComponent');
        if (pos && !this.world.getComponent(entityID, 'HitboxComponent')) {
            this.world.addComponent(entityID, new HitboxComponent(0, 0, pos.width, pos.height));
        }
        Debug.log(`Entity '${name}' created with ID: ${entityID}`)
        return entityID
    }
    updateGrid(newGrid) {
        this.grid = newGrid
    }
}