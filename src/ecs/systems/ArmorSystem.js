import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";
// Список всех возможных слотов, которые могут содержать части шлема.
const HELMET_SLOTS = [
    'cone_lowhp', 'cone_halfhp', 'cone_fullhp',
    'bucket_lowhp', 'bucket_halfhp', 'bucket_fullhp'
];

export default class ArmorSystem {
    constructor() {
        this.world = null;
    }

    /**
     * Скрывает все спрайты во всех слотах, связанных со шлемами.
     * @param {DragonBonesComponent} dbComp 
     */
    _hideAllHelmets(dbComp) {
        HELMET_SLOTS.forEach(slot => dbComp.setAttachment(slot, null));
    }

    update() {
        const entities = this.world.getEntitiesWithComponents('ArmorComponent', 'DragonBonesComponent');
        for (const entityId of entities) {
            const armor = this.world.getComponent(entityId, 'ArmorComponent');
            const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');

            // Если броня сломана, скрываем все шлемы и удаляем компонент.
            if (armor.currentHealth <= 0) {
                eventBus.publish('armor:broken', { entityId: entityId });
                if (armor.breakEffect && armor.breakEffect.spawnEntity) {
                    this.spawnEffectForBone(entityId, armor.breakEffect);
                }
                this._hideAllHelmets(dbComp);
                this.world.removeComponent(entityId, 'ArmorComponent');
                Debug.log(`Armor broken for entity ${entityId}`);
                continue;
            }

            const healthPercent = armor.currentHealth / armor.maxHealth;
            let newAttachmentName = armor.initialAttachment;
            let newIndex = -1;

            // Находим самое "поврежденное" состояние, которого достигла броня.
            for (let i = 0; i < armor.damageStates.length; i++) {
                if (healthPercent <= armor.damageStates[i].threshold) {
                    newAttachmentName = armor.damageStates[i].attachmentName;
                    newIndex = i;
                }
            }
            
            // Меняем спрайт, только если состояние изменилось на более поврежденное.
            if (newIndex > armor.currentStateIndex) {
                // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
                // 1. Прячем все возможные варианты шлемов.
                this._hideAllHelmets(dbComp);
                
                // 2. Извлекаем имя слота из имени спрайта.
                // Пример: "Zombie/cone_halfhp" -> "cone_halfhp"
                const slotName = newAttachmentName.split('/')[1];

                // 3. Устанавливаем нужный спрайт в правильный слот.
                dbComp.setAttachment(slotName, newAttachmentName);
                // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---
                
                armor.currentStateIndex = newIndex;
                Debug.log(`Armor for entity ${entityId} changed state to ${newAttachmentName}`);
            }
        }
    }

    spawnEffectForBone(entityId, breakEffect) {
        const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');
        const entityPos = this.world.getComponent(entityId, 'PositionComponent');
        if (!dbComp || !entityPos || !dbComp.armature) return;

        // Кость "slot_helmet" служит якорем для всех шлемов.
        const bone = dbComp.armature.getBone(breakEffect.anchorBone);
        if (bone) {
            const boneTransform = bone.worldTransform;
            const spawnX = entityPos.x + boneTransform.x * dbComp.scale;
            const spawnY = (entityPos.y + dbComp.anchorOffsetY) + boneTransform.y * dbComp.scale;
            this.world.factory.create(breakEffect.spawnEntity, { x: spawnX, y: spawnY });
        }
    }
}