// src/game/Factory.js
import Debug from "../core/Debug.js";
import dragonBones from "../core/DragonBones.js";
import PositionComponent from "../ecs/components/PositionComponent.js";
import SpriteComponent from "../ecs/components/SpriteComponent.js";
import RenderableComponent from "../ecs/components/RenderableComponent.js";
// ... (все остальные импорты)
import GridLocationComponent from '../ecs/components/GridLocationComponent.js';
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
import PrefabComponent from "../ecs/components/PrefabComponent.js";
import ZombieComponent from "../ecs/components/ZombieComponent.js";
import LawnmowerComponent from "../ecs/components/LawnmowerComponent.js";
import SunProducerComponent from "../ecs/components/SunProducerComponent.js";
import ArcMovementComponent from "../ecs/components/ArcMovementComponent.js";
import TintEffectComponent from "../ecs/components/TintEffectComponent.js";
import GhostPlantComponent from "../ecs/components/GhostPlantComponent.js";
import HiddenComponent from "../ecs/components/HiddenComponent.js";
import CursorAttachmentComponent from "../ecs/components/CursorAttachmentComponent.js";
import DragonBonesComponent from "../ecs/components/DragonBonesComponent.js";
import ArmorComponent from "../ecs/components/ArmorComponent.js";
import FlagComponent from "../ecs/components/FlagComponent.js";
import LimbLossComponent from "../ecs/components/LimbLossComponent.js";
import DyingComponent from "../ecs/components/DyingComponent.js";
import TextComponent from "../ecs/components/TextComponent.js";
import FadeEffectComponent from "../ecs/components/FadeEffectComponent.js";
import BounceAnimationComponent from "../ecs/components/BounceAnimationComponent.js";
import ScaleAnimationComponent from "../ecs/components/ScaleAnimationComponent.js";
import VictoryTrophyComponent from "../ecs/components/VictoryTrophyComponent.js";
import DropsTrophyOnDeathComponent from "../ecs/components/DropsTrophyOnDeathComponent.js";
import LeadLosingZombieComponent from "../ecs/components/LeadLosingZombieComponent.js";
import UITravelComponent from "../ecs/components/UITravelComponent.js";
import FillColorComponent from "../ecs/components/FillColorComponent.js";
import RandomSoundComponent from "../ecs/components/RandomSoundComponent.js";

const componentMap = {
    PositionComponent, SpriteComponent, RenderableComponent, GridLocationComponent,
    VelocityComponent, CollectibleComponent, LifetimeComponent, RemovalComponent,
    HealthComponent, HitboxComponent, OutOfBoundsRemovalComponent, ShootsProjectilesComponent,
    ProjectileComponent, PlantComponent, MeleeAttackComponent, AttackingComponent,
    PrefabComponent, ZombieComponent, LawnmowerComponent, SunProducerComponent,
    ArcMovementComponent, TintEffectComponent, GhostPlantComponent, HiddenComponent,
    CursorAttachmentComponent, DragonBonesComponent, ArmorComponent, FlagComponent,
    LimbLossComponent, DyingComponent, TextComponent, FadeEffectComponent,
    BounceAnimationComponent, ScaleAnimationComponent, VictoryTrophyComponent,
    DropsTrophyOnDeathComponent, LeadLosingZombieComponent, UITravelComponent, FillColorComponent,RandomSoundComponent
};


export default class Factory {
    // constructor и _parseAllDragonBones без изменений
    constructor(world, assetLoader, entityPrototypes, grid) {
        this.world = world;
        this.assetLoader = assetLoader;
        this.prototypes = entityPrototypes;
        this.grid = grid;
        this.dbFactory = new dragonBones.Factory();
        this._parseAllDragonBones(entityPrototypes);
    }
    _parseAllDragonBones(prototypes) {
        const parsed = new Set();
        for (const key in prototypes) {
            const dbProto = prototypes[key].components.DragonBonesComponent;
            if (dbProto && !parsed.has(dbProto.skeKey)) {
                const skeData = this.assetLoader.getJSON(dbProto.skeKey);
                const texData = this.assetLoader.getJSON(dbProto.texKey);
                if (skeData && texData) {
                    this.dbFactory.parse(skeData, texData, dbProto.skeKey);
                    parsed.add(dbProto.skeKey);
                }
            }
        }
    }
    create(name, initialData = {}) {
        const proto = this.prototypes[name];
        if (!proto) { Debug.error(`No entity prototype found for name: ${name}`); return null; }

        const entityID = this.world.createEntity();
        this.world.addComponent(entityID, new PrefabComponent(name));

        for (const compName in proto.components) {
            const protoData = proto.components[compName];
            const component = this.createGenericComponent(compName, protoData, initialData, name);
            if (component) {
                this.world.addComponent(entityID, component);
            }
        }

        const dbComp = this.world.getComponent(entityID, 'DragonBonesComponent');
        if (dbComp) {
            const HELMET_SLOTS = ['cone_lowhp', 'cone_halfhp', 'cone_fullhp', 'bucket_lowhp', 'bucket_halfhp', 'bucket_fullhp'];
            HELMET_SLOTS.forEach(slot => dbComp.setAttachment(slot, null));
            const armor = this.world.getComponent(entityID, 'ArmorComponent');
            if (armor) {
                const slotName = armor.initialAttachment.split('/')[1];
                dbComp.setAttachment(slotName, armor.initialAttachment);
            }
        }

        Debug.log(`Entity '${name}' created with ID: ${entityID}`);
        return entityID;
    }

    createGenericComponent(compName, protoData, initialData, name) {
        const CompClass = componentMap[compName];
        if (!CompClass) {
            Debug.warn(`Unknown component type in factory: ${compName}`);
            return null;
        }

        if (compName === 'PositionComponent') {
            const finalData = { ...protoData, ...initialData };
            let width = finalData.width || 0;
            let height = finalData.height || 0;
            if (width === 0 || height === 0) {
                const spriteProto = this.prototypes[name]?.components?.SpriteComponent;
                if (spriteProto) {
                    const img = this.assetLoader.getImage(spriteProto.assetKey);
                    if (img && img.height > 0) {
                        const aspectRatio = img.width / img.height;
                        if (height) width = height * aspectRatio;
                        else if (width) height = width / aspectRatio;
                    }
                }
            }
            return new PositionComponent(finalData.x || 0, finalData.y || 0, width, height, finalData.scale ?? 1.0);
        }
        else if (compName === 'SpriteComponent') {
            const sprite = this.assetLoader.getImage(protoData.assetKey);
            if (!sprite) { 
                Debug.warn(`Asset not found for SpriteComponent: ${protoData.assetKey}`);
                return null;
            }
            let regionData = null;
            if (protoData.region) {
                const atlasKey = protoData.assetKey.includes('_img') ? protoData.assetKey.replace('_img', '_tex') : `${protoData.assetKey}_tex`;
                const atlasData = this.assetLoader.getJSON(atlasKey);
                if (atlasData) { regionData = atlasData.SubTexture.find(st => st.name === protoData.region.name); }
            }
            return new SpriteComponent(sprite, regionData);
        }
        else if (compName === 'DragonBonesComponent') {
            return new CompClass(this.dbFactory, protoData.skeKey, protoData.initialAnimation, protoData.scale, protoData.anchorOffsetY || 0);
        }
        else if (compName === 'VelocityComponent') {
            let vx = protoData.vx ?? 0;
            let vy = protoData.vy ?? 0;
            if (protoData.baseSpeed !== undefined) {
                vx = protoData.baseSpeed + (Math.random() * 2 - 1) * (protoData.speedVariance || 0);
            }
            return new VelocityComponent(vx, vy);
        }
        else if (compName === 'GridLocationComponent') {
            return initialData.gridCoords ? new GridLocationComponent(initialData.gridCoords.row, initialData.gridCoords.col) : new GridLocationComponent();
        }
        else if (compName === 'HealthComponent') {
            return new HealthComponent(protoData.maxHealth);
        }
        else if (compName === 'HitboxComponent') {
            return new HitboxComponent(protoData.offsetX, protoData.offsetY, protoData.width, protoData.height);
        }
        else if (compName === 'ShootsProjectilesComponent') {
            return new ShootsProjectilesComponent(protoData.projectileName, protoData.fireRate, protoData.projectileSpeed);
        }
        else if (compName === 'ProjectileComponent') {
            return new ProjectileComponent(protoData.damage);
        }
        else if (compName === 'MeleeAttackComponent') {
            return new MeleeAttackComponent(protoData.damage, protoData.attackRate);
        }
        else if (compName === 'SunProducerComponent') {
            return new SunProducerComponent(protoData.productionRate);
        }
        else if (compName === 'CollectibleComponent') {
            return new CollectibleComponent(this.prototypes[name].value || 0);
        }
        
        // --- VVV ВОТ ОНО, ИСПРАВЛЕНИЕ!!! VVV ---
        else if (compName === 'RenderableComponent') {
            return new RenderableComponent(protoData.layer || 0);
        }
        // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---
        
        else if (compName === 'LifetimeComponent') {
            return new LifetimeComponent(protoData.duration);
        }
        else if (compName === 'ArcMovementComponent') {
            return new ArcMovementComponent(protoData.vx, protoData.vy, protoData.gravity, protoData.targetY);
        }
        else if (['TextComponent', 'FadeEffectComponent', 'BounceAnimationComponent', 'ScaleAnimationComponent', 'ArmorComponent', 'FlagComponent', 'LimbLossComponent', 'TintEffectComponent', 'FillColorComponent', 'RandomSoundComponent'].includes(compName)) {
            return new CompClass(protoData);
        }
        else {
            return new CompClass();
        }
    }

    updateGrid(newGrid) { 
        this.grid = newGrid; 
    }
}