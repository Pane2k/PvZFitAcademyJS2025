// src/ecs/systems/GameOverSystem.js
import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import LeadLosingZombieComponent from "../components/LeadLosingZombieComponent.js";

export default class GameOverSystem {
    constructor(housePositionX) {
        this.world = null;
        this.housePositionX = housePositionX;
        this.isGameOverSequenceStarted = false;
    }

    update() {
        if (this.isGameOverSequenceStarted) return;

        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent');
        if (zombies.length === 0) return;

        for (const zombieId of zombies) {
            const zPos = this.world.getComponent(zombieId, 'PositionComponent');
            const zHitbox = this.world.getComponent(zombieId, 'HitboxComponent');
            const zLeft = zPos.x - zHitbox.width / 2;

            if (zLeft <= this.housePositionX) {
                Debug.log(`GAME OVER SEQUENCE: Zombie ${zombieId} reached the house.`);
                this.isGameOverSequenceStarted = true;
                
                // --- НОВАЯ ЛОГИКА ---
                eventBus.publish('game:start_lose_sequence');
                
                // 1. Помечаем виновника
                this.world.addComponent(zombieId, new LeadLosingZombieComponent());
                
                // 2. Очищаем поле от всех остальных
                const allEntities = Array.from(this.world.entities.keys());
                for (const id of allEntities) {
                    if (id !== zombieId) {
                        const isUI = this.world.getComponent(id, 'UITravelComponent') || 
                                     this.world.getComponent(id, 'CursorAttachmentComponent');
                        if (!isUI) { // Не удаляем UI элементы
                           this.world.addComponent(id, new RemovalComponent());
                        }
                    }
                }
                
                // 3. Удаляем саму систему, чтобы не сработала снова
                this.world.removeSystem(this);
                break;
            }
        }
    }
}