import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import VelocityComponent from "../components/VelocityComponent.js";

export default class GameOverSystem {
    constructor(housePositionX) {
        this.world = null;
        // X-координата, достижение которой означает немедленный проигрыш.
        this.housePositionX = housePositionX;
        this.isGameOver = false;
    }

    update() {
        if (this.isGameOver) return;

        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent');
        if (zombies.length === 0) return;

        for (const zombieId of zombies) {
            const zPos = this.world.getComponent(zombieId, 'PositionComponent');
            const zHitbox = this.world.getComponent(zombieId, 'HitboxComponent');
            const zLeft = zPos.x + zHitbox.offsetX;

            // Единственная проверка: дошел ли зомби до дома
            if (zLeft <= this.housePositionX) {
                Debug.log(`GAME OVER: Zombie ${zombieId} reached the house.`);
                eventBus.publish('game:lose');
                this.isGameOver = true; // Устанавливаем флаг
                break; // Выходим из цикла, одного зомби достаточно
            }
        }
    }


}