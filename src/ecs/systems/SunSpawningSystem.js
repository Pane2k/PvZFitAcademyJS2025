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
        
       

        const targetPos = this.grid.getWorldPos(randomRow, randomCol);

        const sunProto = this.factory.prototypes.sun;
        const sunScale = sunProto.components.PositionComponent.scale || 1.0;
        const sunHeight = this.grid.cellHeight * sunScale;
        const sunWidth = this.grid.cellWidth * sunScale;
        const startX = targetPos.x - sunWidth / 2; // <-- Коррекция по X
        const startY = this.grid.offsetY - sunHeight;

        const entityID = this.factory.create('sun', { x: startX, y: startY });
        if (entityID !== null) {
            this.world.addComponent(entityID, new GridLocationComponent(randomRow, randomCol));
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