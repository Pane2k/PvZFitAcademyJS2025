// src/ecs/systems/ArmingSystem.js
import HitboxComponent from "../components/HitboxComponent.js";
import ExplodesOnContactComponent from "../components/ExplodesOnContactComponent.js";
import soundManager from "../../core/SoundManager.js";

export default class ArmingSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('ArmingComponent', 'SpriteComponent');

        for (const entityId of entities) {
            const arming = this.world.getComponent(entityId, 'ArmingComponent');
            arming.timer -= deltaTime;

            if (arming.timer <= 0) {
                // Вооружаем мину!
                const sprite = this.world.getComponent(entityId, 'SpriteComponent');
                const newImage = this.world.factory.assetLoader.getImage(arming.armedSpriteKey);
                if (newImage) {
                    sprite.image = newImage;
                }
                
                // Добавляем компоненты для взрыва и хитбокс
                const explosionData = { damage: 1800, radius: 150 }; // Данные из entities.json
                this.world.addComponent(entityId, new ExplodesOnContactComponent(explosionData));
                this.world.addComponent(entityId, new HitboxComponent(0, 0, 60, 60));

                // Удаляем компонент вооружения
                this.world.removeComponent(entityId, 'PlantComponent');
                this.world.removeComponent(entityId, 'ArmingComponent');

                // Звук "вооружения"
                soundManager.playSoundEffect('potato_mine');
            }
        }
    }
}