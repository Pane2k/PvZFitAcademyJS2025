import Debug from "../../core/Debug.js";
import DyingComponent from "../components/DyingComponent.js";
import RemovalComponent from "../components/RemovalComponent.js";
import eventBus from "../../core/EventBus.js";

export default class HealthMonitorSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const limblossEntities = this.world.getEntitiesWithComponents('HealthComponent', 'LimbLossComponent', 'DragonBonesComponent');
        for (const entityId of limblossEntities) {
            const limbLoss = this.world.getComponent(entityId, 'LimbLossComponent');
            if (limbLoss.isLimbLost) continue;

            const health = this.world.getComponent(entityId, 'HealthComponent');
            const healthPercent = health.currentHealth / health.maxHealth;

            if (healthPercent <= limbLoss.threshold) {
                limbLoss.isLimbLost = true;
                eventBus.publish('limb:lost', { entityId: entityId });
                const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');
                
                if (limbLoss.breakEffect && limbLoss.breakEffect.spawnEntity) {
                    this.spawnEffectForBone(entityId, limbLoss.breakEffect);
                }
                
                if (limbLoss.slotsToHide && Array.isArray(limbLoss.slotsToHide)) {
                    for (const slotName of limbLoss.slotsToHide) {
                        dbComp.setAttachment(slotName, null);
                    }
                }
                
                if (limbLoss.slotToReplace) {
                    dbComp.setAttachment(limbLoss.slotToReplace.slotName, limbLoss.slotToReplace.attachmentName);
                }
                
                Debug.log(`Limb lost for entity ${entityId}`);
            }
        }

        const dyingEntities = this.world.getEntitiesWithComponents('DyingComponent');
        for (const entityId of dyingEntities) {
            const dying = this.world.getComponent(entityId, 'DyingComponent');
            dying.timer += deltaTime;

            const renderable = this.world.getComponent(entityId, 'RenderableComponent');
            if (renderable) {
                const fadeDuration = 1.0;
                const timeRemaining = dying.duration - dying.timer;

                if (timeRemaining < fadeDuration) {
                    const fadeProgress = timeRemaining / fadeDuration;
                    renderable.alpha = Math.max(0, fadeProgress);
                }
            }

            if (dying.timer >= dying.duration) {
                if(this.world.getComponent(entityId, 'ZombieComponent')) {
                    eventBus.publish('zombie:defeated', { entityId });
                }
                this.world.addComponent(entityId, new RemovalComponent());
                this.world.removeComponent(entityId, 'DyingComponent');
            }
        }
    }

    spawnEffectForBone(entityId, breakEffect) {
        const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');
        const entityPos = this.world.getComponent(entityId, 'PositionComponent');
        if (!dbComp || !entityPos || !dbComp.armature) return;
        const bone = dbComp.armature.getBone(breakEffect.anchorBone);

        if (bone) {
            const boneTransform = bone.worldTransform;
            const spawnX = entityPos.x + boneTransform.x * dbComp.scale;
            const spawnY = (entityPos.y + dbComp.anchorOffsetY) + boneTransform.y * dbComp.scale;
            this.world.factory.create(breakEffect.spawnEntity, { x: spawnX, y: spawnY });
        } else {
            Debug.warn(`Anchor bone "${breakEffect.anchorBone}" not found for break effect on entity ${entityId}`);
            this.world.factory.create(breakEffect.spawnEntity, { x: entityPos.x, y: entityPos.y });
        }
    }
}