import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import VelocityComponent from "../components/VelocityComponent.js";
import OutOfBoundsRemovalComponent from "../components/OutOfBoundsRemovalComponent.js";
import eventBus from "../../core/EventBus.js";
import ArcMovementComponent from "../components/ArcMovementComponent.js";
import DyingComponent from "../components/DyingComponent.js";
// --- VVV НОВЫЙ ИМПОРТ VVV ---
import LifetimeComponent from "../components/LifetimeComponent.js";

export default class LawnmowerSystem {
    // ... (конструктор без изменений)
    constructor(waveSystem) {
        this.world = null;
        this.waveSystem = waveSystem;
    }

    update() {
        // ... (update до handleCollision без изменений)
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent');
        if (zombies.length === 0) return;

        const allMowers = this.world.getEntitiesWithComponents('LawnmowerComponent', 'PositionComponent', 'HitboxComponent');
        const inactiveMowers = allMowers.filter(id => !this.world.getComponent(id, 'LawnmowerComponent').isActivated);
        const activeMowers = allMowers.filter(id => this.world.getComponent(id, 'LawnmowerComponent').isActivated);

        const handleCollision = (mowerId, zombieId) => {
            const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');
            if (zombiePos) {
                this.waveSystem.checkForVictoryCondition(zombieId, zombiePos);
            }

            eventBus.publish('zombie:run_over', { zombieId });

            this.world.removeComponent(zombieId, 'VelocityComponent');
            this.world.removeComponent(zombieId, 'HitboxComponent');
            this.world.removeComponent(zombieId, 'MeleeAttackComponent');
            this.world.removeComponent(zombieId, 'AttackingComponent');
            this.world.removeComponent(zombieId, 'ArmorComponent');
            this.world.removeComponent(zombieId, 'LimbLossComponent');
            this.world.removeComponent(zombieId, 'RandomSoundComponent');

            // --- VVV КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ VVV ---
            // 1. Запускаем анимацию смерти
            this.world.addComponent(zombieId, new DyingComponent(2.5));

            // 2. Запускаем движение по дуге, чтобы зомби приземлился на свою линию
            this.world.addComponent(zombieId, new ArcMovementComponent(
                80,       // vx: Небольшая скорость полета вправо
                -300,     // vy: Начальная скорость вверх (подбрасываем выше)
                1000,     // gravity: Сила притяжения
                zombiePos.y + 0 // targetY: Приземляемся чуть ниже исходной позиции на той же линии
            ));

            // 3. Заменяем OutOfBounds на Lifetime, чтобы зомби удалился по таймеру, а не по координатам
            
            // --- ^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^ ---
        };

        // ... (остальной код update, activateLawnmower, checkCollision без изменений)
        if (inactiveMowers.length > 0) {
            for (const mowerId of inactiveMowers) {
                for (const zombieId of zombies) {
                    if (this.checkCollision(mowerId, zombieId)) {
                        this.activateLawnmower(mowerId);
                        handleCollision(mowerId, zombieId);
                        break; 
                    }
                }
            }
        }

        if (activeMowers.length > 0) {
            for (const mowerId of activeMowers) {
                for (const zombieId of zombies) {
                    // Проверяем, что зомби еще не "умирает" от другой косилки
                    if (this.world.getComponent(zombieId, 'RemovalComponent') || this.world.getComponent(zombieId, 'DyingComponent')) continue;
                    
                    if (this.checkCollision(mowerId, zombieId)) {
                        Debug.log(`Active lawnmower ${mowerId} destroyed zombie ${zombieId}`);
                        handleCollision(mowerId, zombieId);
                    }
                }
            }
        }
    }

    activateLawnmower(mowerId) {
        Debug.log(`Lawnmower ${mowerId} activated!`);
        const mowerComponent = this.world.getComponent(mowerId, 'LawnmowerComponent');
        if (mowerComponent.isActivated) return;
        eventBus.publish('lawnmower:activated', { mowerId: mowerId });
        mowerComponent.isActivated = true;
        
        this.world.addComponent(mowerId, new VelocityComponent(350, 0));
        this.world.addComponent(mowerId, new OutOfBoundsRemovalComponent());
    }

    checkCollision(entityA, entityB) {
        const posA = this.world.getComponent(entityA, 'PositionComponent');
        const hitboxA = this.world.getComponent(entityA, 'HitboxComponent');
        const posB = this.world.getComponent(entityB, 'PositionComponent');
        const hitboxB = this.world.getComponent(entityB, 'HitboxComponent');

        if (!posA || !hitboxA || !posB || !hitboxB) return false;

        const leftA = posA.x + hitboxA.offsetX;
        const rightA = leftA + hitboxA.width;
        const topA = posA.y + hitboxA.offsetY;
        const bottomA = topA + hitboxA.height;

        const leftB = posB.x + hitboxB.offsetX;
        const rightB = leftB + hitboxB.width;
        const topB = posB.y + hitboxB.offsetY;
        const bottomB = topB + hitboxB.height;

        return leftA < rightB && rightA > leftB && topA < bottomB && bottomA > topB;
    }
}