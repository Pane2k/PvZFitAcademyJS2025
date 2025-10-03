import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import VelocityComponent from "../components/VelocityComponent.js";
import OutOfBoundsRemovalComponent from "../components/OutOfBoundsRemovalComponent.js";
import eventBus from "../../core/EventBus.js";
export default class LawnmowerSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent');
        if (zombies.length === 0) return;

        // Разделяем косилки на активные и неактивные для оптимизации
        const allMowers = this.world.getEntitiesWithComponents('LawnmowerComponent', 'PositionComponent', 'HitboxComponent');
        const inactiveMowers = allMowers.filter(id => !this.world.getComponent(id, 'LawnmowerComponent').isActivated);
        const activeMowers = allMowers.filter(id => this.world.getComponent(id, 'LawnmowerComponent').isActivated);

        // 1. Проверяем активацию неактивных косилок
        if (inactiveMowers.length > 0) {
            for (const mowerId of inactiveMowers) {
                for (const zombieId of zombies) {
                    if (this.checkCollision(mowerId, zombieId)) {
                        this.activateLawnmower(mowerId);
                        // Зомби, который активировал косилку, тоже должен быть немедленно удален
                        this.world.addComponent(zombieId, new RemovalComponent());
                        break; // Одна косилка может быть активирована только раз
                    }
                }
            }
        }

        // 2. Обрабатываем столкновения для уже активных косилок
        if (activeMowers.length > 0) {
            for (const mowerId of activeMowers) {
                for (const zombieId of zombies) {
                    if (this.checkCollision(mowerId, zombieId)) {
                        Debug.log(`Active lawnmower ${mowerId} destroyed zombie ${zombieId}`);
                        this.world.addComponent(zombieId, new RemovalComponent());
                    }
                }
            }
        }
    }

    activateLawnmower(mowerId) {
        Debug.log(`Lawnmower ${mowerId} activated!`);
        const mowerComponent = this.world.getComponent(mowerId, 'LawnmowerComponent');
        if (mowerComponent.isActivated) return; // Двойная проверка
        eventBus.publish('lawnmower:activated', { mowerId: mowerId });
        mowerComponent.isActivated = true;
        
        // Даем косилке скорость для движения вправо
        this.world.addComponent(mowerId, new VelocityComponent(350, 0));
        // Добавляем компонент, чтобы система очистки удалила ее за экраном
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