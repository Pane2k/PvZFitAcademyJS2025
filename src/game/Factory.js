// src/game/Factory.js

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
import ArcMovementComponent from "../ecs/components/ArcMovementComponent.js"
import TintEffectComponent from "../ecs/components/TintEffectComponent.js"
import GhostPlantComponent from "../ecs/components/GhostPlantComponent.js"
import HiddenComponent from "../ecs/components/HiddenComponent.js"
import CursorAttachmentComponent from "../ecs/components/CursorAttachmentComponent.js"
import DragonBonesComponent from "../ecs/components/DragonBonesComponent.js";

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
    SunProducerComponent,
    ArcMovementComponent,
    TintEffectComponent,
    GhostPlantComponent,
    HiddenComponent,
    CursorAttachmentComponent,
    DragonBonesComponent
}

export default class Factory{
    constructor(world, assetLoader, entityPrototypes, grid, canvas){
        this.world = world
        this.assetLoader = assetLoader
        this.prototypes = entityPrototypes
        this.grid = grid
        this.canvas = canvas;
    }

    create(name, initialData){
        const proto = this.prototypes[name]
        if(!proto){
            Debug.error(`No entity prototype found for name: ${name}`)
            return null
        }
        const entityID = this.world.createEntity()
        this.world.addComponent(entityID, new PrefabComponent(name))
        
        for (const compName in proto.components){
            const CompClass = componentMap[compName]
            if (!CompClass){
                Debug.warn(`Unknown component type: ${compName}`)
                continue
            }
            const protoData = proto.components[compName]
            let component

            if (compName === 'DragonBonesComponent') {
                const skeData = this.assetLoader.getJSON(protoData.skeKey);
                const texData = this.assetLoader.getJSON(protoData.texKey);
                const imgData = this.assetLoader.getImage(protoData.imgKey);

                if (skeData && texData && imgData) {
                    // VVV ПЕРЕДАЕМ НОВЫЙ ПАРАМЕТР anchorOffsetY VVV
                    component = new CompClass(
                        this.canvas, 
                        skeData, 
                        texData, 
                        imgData, 
                        protoData.initialAnimation, 
                        protoData.scale, 
                        protoData.anchorOffsetY // <-- ИЗВЛЕКАЕМ ИЗ JSON
                    );
                } else {
                    Debug.error(`Assets for DragonBonesComponent '${name}' not found!`);
                    continue;
                }
            }
            else if (compName === 'SpriteComponent') {
                const sprite = this.assetLoader.getImage(protoData.assetKey);
                if (sprite) {
                    component = new SpriteComponent(sprite);
                }
            }
            else if (compName === 'PositionComponent') {
                let width = 0;
                let height = 0;
                const spriteProto = proto.components.SpriteComponent;
                const dbProto = proto.components.DragonBonesComponent;

                if (spriteProto) {
                    const sprite = this.assetLoader.getImage(spriteProto.assetKey);
                    if (sprite && sprite.width > 0) {
                        const aspectRatio = sprite.width / sprite.height;
                        if (protoData.height) {
                            height = protoData.height;
                            width = height * aspectRatio;
                        } else if (protoData.width) {
                            width = protoData.width;
                            height = width / aspectRatio;
                        }
                    }
                } else if (dbProto) {
                    height = protoData.height || 100;
                    width = protoData.width || (height * 0.75);
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
            }else if (compName === 'CollectibleComponent') {
                const proto = this.prototypes[name];
                component = new CompClass(proto.value || 0);
            }else if (compName === 'RenderableComponent') {
                component = new CompClass(protoData.layer || 0);
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