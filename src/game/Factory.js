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
import dragonBones from "../core/DragonBones.js";

const componentMap = {
    PositionComponent, SpriteComponent, RenderableComponent, GridLocationComponent,
    VelocityComponent, CollectibleComponent, LifetimeComponent, RemovalComponent,
    HealthComponent, HitboxComponent, OutOfBoundsRemovalComponent, ShootsProjectilesComponent,
    ProjectileComponent, PlantComponent, MeleeAttackComponent, AttackingComponent,
    PrefabComponent, ZombieComponent, LawnmowerComponent, SunProducerComponent,
    ArcMovementComponent, TintEffectComponent, GhostPlantComponent, HiddenComponent,
    CursorAttachmentComponent, DragonBonesComponent, ArmorComponent, FlagComponent,
    LimbLossComponent, DyingComponent
};

const HELMET_SLOTS = [
    'cone_lowhp', 'cone_halfhp', 'cone_fullhp',
    'bucket_lowhp', 'bucket_halfhp', 'bucket_fullhp'
];

export default class Factory {
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
    
    create(name, initialData) {
        const proto = this.prototypes[name];
        if (!proto) { Debug.error(`No entity prototype found for name: ${name}`); return null; }
        const entityID = this.world.createEntity();
        this.world.addComponent(entityID, new PrefabComponent(name));

        for (const compName in proto.components) {
            const CompClass = componentMap[compName];
            if (!CompClass) { Debug.warn(`Unknown component type: ${compName}`); continue; }
            const protoData = proto.components[compName];
            let component;

            if (compName === 'DragonBonesComponent') {
                component = new CompClass(this.dbFactory, protoData.skeKey, protoData.initialAnimation, protoData.scale, protoData.anchorOffsetY || 0);
            } else if (['ArmorComponent', 'FlagComponent', 'LimbLossComponent'].includes(compName)) {
                component = new CompClass(protoData);
            } else {
                // Все остальные компоненты создаются по старой логике
                const otherComp = this.createGenericComponent(compName, protoData, initialData, name);
                if (otherComp) component = otherComp;
            }

            if (component) this.world.addComponent(entityID, component);
        }

        const dbComp = this.world.getComponent(entityID, 'DragonBonesComponent');
        if (dbComp) {
            // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
            // 1. Скрываем все возможные шлемы и флаг по умолчанию
            HELMET_SLOTS.forEach(slot => dbComp.setAttachment(slot, null));
            dbComp.setAttachment('slot_flag', null);

            // 2. Включаем броню, только если она есть
            const armor = this.world.getComponent(entityID, 'ArmorComponent');
            if (armor) {
                const slotName = armor.initialAttachment.split('/')[1];
                dbComp.setAttachment(slotName, armor.initialAttachment);
            }
            
            // 3. Включаем флаг, только если он есть
            const flag = this.world.getComponent(entityID, 'FlagComponent');
            if (flag) {
                dbComp.setAttachment(flag.flagSlot, flag.attachmentName);
            }
            // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---
        }

        const pos = this.world.getComponent(entityID, 'PositionComponent');
        if (pos && !this.world.getComponent(entityID, 'HitboxComponent')) {
            this.world.addComponent(entityID, new HitboxComponent(0, 0, pos.width, pos.height));
        }
        Debug.log(`Entity '${name}' created with ID: ${entityID}`);
        return entityID;
    }

    createGenericComponent(compName, protoData, initialData, name) {
        if (compName === 'SpriteComponent') {
            const sprite = this.assetLoader.getImage(protoData.assetKey);
            if (sprite) {
                let regionData = null;
                if (protoData.region) {
                    const atlasKey = protoData.assetKey.includes('_img') ? protoData.assetKey.replace('_img', '_tex') : `${protoData.assetKey}_tex`;
                    const atlasData = this.assetLoader.getJSON(atlasKey);
                    if (atlasData) { regionData = atlasData.SubTexture.find(st => st.name === protoData.region.name); }
                }
                return new SpriteComponent(sprite, regionData);
            }
        } else if (compName === 'PositionComponent') {
            let width = 0, height = protoData.height || 0;
            const spriteProto = this.prototypes[name].components.SpriteComponent;
            if (spriteProto) {
                const img = this.assetLoader.getImage(spriteProto.assetKey);
                if (img && img.height > 0) { width = height * (img.width / img.height); }
            } else if (this.prototypes[name].components.DragonBonesComponent) {
                width = height * 0.75;
            }
            return new PositionComponent(initialData.x || 0, initialData.y || 0, width, height);
        } else if (compName === 'VelocityComponent') {
            let vx = protoData.vx ?? 0, vy = protoData.vy ?? 0;
            if (protoData.baseSpeed !== undefined) {
                vx = protoData.baseSpeed + (Math.random() * 2 - 1) * (protoData.speedVariance || 0);
            }
            return new VelocityComponent(vx, vy);
        } else if (compName === 'GridLocationComponent' && initialData.gridCoords) {
            return new GridLocationComponent(initialData.gridCoords.row, initialData.gridCoords.col);
        } else if (compName === 'ArcMovementComponent') {
            return new ArcMovementComponent(protoData.vx, protoData.vy, protoData.gravity, protoData.targetY);
        } else if (compName === 'HealthComponent') {
            return new HealthComponent(protoData.maxHealth);
        } else if (compName === 'HitboxComponent') {
            return new HitboxComponent(protoData.offsetX, protoData.offsetY, protoData.width, protoData.height);
        } else if (compName === 'ShootsProjectilesComponent') {
            return new ShootsProjectilesComponent(protoData.projectileName, protoData.fireRate, protoData.projectileSpeed);
        } else if (compName === 'ProjectileComponent') {
            return new ProjectileComponent(protoData.damage);
        } else if (compName === 'MeleeAttackComponent') {
            return new MeleeAttackComponent(protoData.damage, protoData.attackRate);
        } else if (compName === 'SunProducerComponent') {
            return new SunProducerComponent(protoData.productionRate);
        } else if (compName === 'CollectibleComponent') {
            return new CollectibleComponent(this.prototypes[name].value || 0);
        } else if (compName === 'RenderableComponent') {
            return new RenderableComponent(protoData.layer || 0);
        } else if (compName === 'LifetimeComponent') {
            return new LifetimeComponent(protoData.duration);
        }
        // Для компонентов без параметров
        const CompClass = componentMap[compName];
        if (CompClass) return new CompClass();
        return null;
    }

    updateGrid(newGrid) { this.grid = newGrid; }
}