export default class AnimationSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('DragonBonesComponent');

        for (const entityId of entities) {
            const dbComponent = this.world.getComponent(entityId, 'DragonBonesComponent');
            
            // Обновляем внутреннее состояние анимации
            dbComponent.renderer.update(deltaTime);

            // Проверяем, есть ли у зомби VelocityComponent
            const velocity = this.world.getComponent(entityId, 'VelocityComponent');
            if (velocity) {
                // Если есть скорость, проигрываем анимацию ходьбы
                dbComponent.playAnimation('walk');
            } else {
                // Если скорости нет (атакует или стоит), проигрываем анимацию ожидания
                dbComponent.playAnimation('stand');
            }
        }
    }
}