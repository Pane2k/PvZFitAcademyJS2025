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
                const sprite = this.world.getComponent(entityId, 'SpriteComponent');
                const newImage = this.world.factory.assetLoader.getImage(arming.armedSpriteKey);
                if (newImage) {
                    sprite.image = newImage;
                }
                
                const explosionData = { damage: 5000, radius: 150 }; 
                this.world.addComponent(entityId, new ExplodesOnContactComponent(explosionData));
                this.world.addComponent(entityId, new HitboxComponent(0, 0, 60, 60));

                this.world.removeComponent(entityId, 'PlantComponent');
                this.world.removeComponent(entityId, 'ArmingComponent');

                soundManager.playSoundEffect('potato_mine');
            }
        }
    }
}