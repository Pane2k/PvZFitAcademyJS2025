import Debug from "../../core/Debug.js";
import GridLocationComponent from "../components/GridLocationComponent.js";
import LifetimeComponent from "../components/LifetimeComponent.js";
import CollectibleComponent from "../components/CollectibleComponent.js"

export default class SunSpawningSystem {
    constructor(grid, factory){
        this.world = null
        this.grid = grid
        this.factory = factory

        this.spawnInterval = 1
        this.timer = this.spawnInterval / 2
    }
    update(deltaTime){
        if(!this.grid || !this.factory) return
        this.timer += deltaTime
        if(this.timer >= this.spawnInterval){
            this.timer = 0
            this.spawnSun()
        }
        this.stopFallingSuns()
    }
    spawnSun() {
        if (!this.factory || !this.grid) return;

        // 1. Выбираем целевую ячейку, куда солнце приземлится
        const randomCol = Math.floor(Math.random() * this.grid.cols);
        const randomRow = Math.floor(Math.random() * this.grid.rows);
        const targetPos = this.grid.getWorldPos(randomRow, randomCol);

        // --- НОВАЯ, ПРАВИЛЬНАЯ ЛОГИКА РАСЧЕТА РАЗМЕРОВ ---
        const sunProto = this.factory.prototypes.sun;
        const sunImage = this.factory.assetLoader.getImage(sunProto.components.SpriteComponent.assetKey);

        // Если ассет еще не загружен (маловероятно, но для безопасности)
        if (!sunImage || sunImage.height === 0) return;

        const sunTargetHeight = sunProto.components.PositionComponent.height;
        const aspectRatio = sunImage.width / sunImage.height;
        // Рассчитываем АКТУАЛЬНУЮ ширину, как это делает Factory
        const actualSunWidth = sunTargetHeight * aspectRatio;
        // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

        // Теперь используем правильные размеры для вычисления стартовой позиции
        const startX = targetPos.x 
        const startY = -sunTargetHeight / 2; // Используем правильную высоту

        const entityID = this.factory.create('sun', { x: startX, y: startY });
        if (entityID !== null) {
            // Добавляем GridLocationComponent, чтобы система знала, куда солнце должно приземлиться
            this.world.addComponent(entityID, new GridLocationComponent(randomRow, randomCol));
            const sunProto = this.factory.prototypes.sun;
            const sunValue = sunProto.value || 25; // Запасной вариант
            this.world.addComponent(entityID, new CollectibleComponent(sunValue));
        }
    }
    stopFallingSuns(){
        const suns = this.world.getEntitiesWithComponents(
            'VelocityComponent', 
            'GridLocationComponent', 
            'CollectibleComponent'
        )
        for(const entityID of suns){
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            const gridLoc = this.world.getComponent(entityID, 'GridLocationComponent');

            const targetY = this.grid.getWorldPos(gridLoc.row, gridLoc.col).y;

            const sunCenterY = pos.y + pos.height / 2;

            // Если центр солнца достиг или пересек центр целевой ячейки
            if (sunCenterY >= targetY) {
                this.world.removeComponent(entityID, 'VelocityComponent');
                this.world.addComponent(entityID, new LifetimeComponent(10));
                pos.y = targetY - pos.height / 2;
                Debug.log(`Sun (entity ${entityID}) landed at [${gridLoc.row}, ${gridLoc.col}]. VelocityComponent removed.`);
            }
        }
    }
    updateGrid(newGrid){
        this.grid = newGrid
    }
    updateFactory(newFactory){
        this.factory = newFactory
    }
}