import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import LeadLosingZombieComponent from "../components/LeadLosingZombieComponent.js";
import soundManager from "../../core/SoundManager.js";
import vibrationManager from "../../core/VibrationManager.js";
import VelocityComponent from "../components/VelocityComponent.js";
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

                soundManager.stopMusic();
                soundManager.playJingle('lose_jingle');
                vibrationManager.vibrate([200, 100, 500]);
                eventBus.publish('game:start_lose_sequence');
                
                // 1. Помечаем виновника
                this.world.addComponent(zombieId, new LeadLosingZombieComponent());
                
                const vel = this.world.getComponent(zombieId, 'VelocityComponent');
                if (vel) {
                    vel.vx *= 3; // Увеличиваем скорость в 3 раза
                } else {
                    // Если зомби атаковал, у него нет Velocity. Добавляем его.
                    this.world.addComponent(zombieId, new VelocityComponent(-60, 0));
                }
                this.world.removeComponent(zombieId, 'AttackingComponent')
                
                // 2. Очищаем поле от всех остальных
                const allZombies = this.world.getEntitiesWithComponents('ZombieComponent');
                for (const id of allZombies) {
                    if (id !== zombieId) {
                        this.world.removeComponent(id, 'VelocityComponent');
                        this.world.removeComponent(id, 'AttackingComponent');
                    }
                }
                
                // 3. Удаляем саму систему, чтобы не сработала снова
                this.world.removeSystem(this);
                break;
            }
        }
    }
}