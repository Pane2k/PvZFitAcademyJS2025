// src/ecs/systems/ZombieSoundSystem.js
import soundManager from "../../core/SoundManager.js";
import DyingComponent from "../components/DyingComponent.js";

export default class ZombieSoundSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        // Ищем только "живых" зомби
        const entities = this.world.getEntitiesWithComponents('RandomSoundComponent')
            .filter(id => !this.world.getComponent(id, 'DyingComponent'));

        for (const entityId of entities) {
            const soundComp = this.world.getComponent(entityId, 'RandomSoundComponent');
            soundComp.timer -= deltaTime;

            if (soundComp.timer <= 0) {
                // Воспроизводим случайный звук из группы
                soundManager.playRandomSound(soundComp.baseKey, soundComp.count, 0.4); // Громкость пониже
                
                // Сбрасываем таймер на новое случайное значение
                soundComp.timer = soundComp.getRandomInterval();
            }
        }
    }
}