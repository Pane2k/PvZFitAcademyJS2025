import Debug from "../../core/Debug.js";
import DyingComponent from "../components/DyingComponent.js";
import RemovalComponent from "../components/RemovalComponent.js";

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
                const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');
                
                if (limbLoss.breakEffect && limbLoss.breakEffect.spawnEntity) {
                    this.spawnEffectForBone(entityId, limbLoss.breakEffect);
                }
                
                // --- VVV ОБНОВЛЕННАЯ ЛОГИКА VVV ---
                // 1. Скрываем все спрайты в указанных слотах
                if (limbLoss.slotsToHide && Array.isArray(limbLoss.slotsToHide)) {
                    for (const slotName of limbLoss.slotsToHide) {
                        dbComp.setAttachment(slotName, null);
                    }
                }
                
                // 2. Заменяем спрайт в целевом слоте
                if (limbLoss.slotToReplace) {
                    dbComp.setAttachment(limbLoss.slotToReplace.slotName, limbLoss.slotToReplace.attachmentName);
                }
                // --- ^^^ КОНЕЦ ЛОГИКИ ^^^ ---
                
                Debug.log(`Limb lost for entity ${entityId}`);
            }
        }

        const dyingEntities = this.world.getEntitiesWithComponents('DyingComponent');
        for (const entityId of dyingEntities) {
            const dying = this.world.getComponent(entityId, 'DyingComponent');
            dying.timer += deltaTime;
            if (dying.timer >= dying.duration) {
                this.world.addComponent(entityId, new RemovalComponent());
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
            // --- VVV ВАЖНОЕ ИСПРАВЛЕНИЕ ПОЗИЦИИ ЭФФЕКТА VVV ---
            // Y-координата эффекта должна учитывать опорную точку (anchor) зомби
            const spawnY = (entityPos.y + dbComp.anchorOffsetY) + boneTransform.y * dbComp.scale;
            // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---
            this.world.factory.create(breakEffect.spawnEntity, { x: spawnX, y: spawnY });
        } else {
            Debug.warn(`Anchor bone "${breakEffect.anchorBone}" not found for break effect on entity ${entityId}`);
            this.world.factory.create(breakEffect.spawnEntity, { x: entityPos.x, y: entityPos.y });
        }
    }
}   