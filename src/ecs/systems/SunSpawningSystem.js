import Debug from "../../core/Debug.js";
import GridLocationComponent from "../components/GridLocationComponent.js";
import LifetimeComponent from "../components/LifetimeComponent.js";
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
    spawnSun(){
        const randomCol = Math.floor(Math.random()* this.grid.cols)
        const randomRow = Math.floor(Math.random()* this.grid.rows)
        
        if (this.grid.isCellOccupied(randomRow, randomCol)) {
            // Если занята, просто пропустим этот спавн
            return; 
        }

        const targetPos = this.grid.getWorldPos(randomRow, randomCol);

        const sunProto = this.factory.prototypes.sun;
        const sunScale = sunProto.components.PositionComponent.scale || 1.0;
        const sunWidth = 80 * sunScale; 
        const sunHeight = 80 * sunScale;
        const startX = targetPos.x - sunWidth / 2; // <-- Коррекция по X
        const startY = this.grid.offsetY - sunHeight;

        const entityID = this.factory.create('sun', { x: startX, y: startY });
        if (entityID !== null) {
            // Даем солнцу "цель" в виде GridLocationComponent
            this.world.addComponent(entityID, new GridLocationComponent(randomRow, randomCol));
            // Отмечаем ячейку как (временно) занятую, чтобы два солнца не падали в одну
            this.grid.placeEntity(randomRow, randomCol, entityID);
        }
    }
    stopFallingSuns(){
        const suns = this.world.getEntitiesWithComponents('VelocityComponent', 'GridLocationComponent', 'CollectibleComponent')
        for(const entityID of suns){
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            const gridLoc = this.world.getComponent(entityID, 'GridLocationComponent');
            const vel = this.world.getComponent(entityID, 'VelocityComponent')
            // Если у солнца нет скорости или оно уже остановилось, пропускаем
            if (!vel || vel.vy === 0) continue; 

            // Получаем Y-координату центра целевой ячейки
            const targetY = this.grid.getWorldPos(gridLoc.row, gridLoc.col).y;

            // Рассчитываем Y-координату центра самого солнца
            const sunCenterY = pos.y + pos.height / 2;

            // Если центр солнца достиг или пересек центр целевой ячейки
            if (sunCenterY >= targetY) {
                vel.vy = 0; // Останавливаем движение
                pos.y = targetY - pos.height / 2; // Точно выравниваем по центру ячейки
                this.world.addComponent(entityID, new LifetimeComponent(10))
                // Таймер исчезновения мы добавим позже, когда эта часть заработает
                Debug.log(`Sun (entity ${entityID}) has landed at [${gridLoc.row}, ${gridLoc.col}].`);
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