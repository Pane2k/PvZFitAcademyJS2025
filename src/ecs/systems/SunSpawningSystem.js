import Debug from "../../core/Debug.js";
import GridLocationComponent from "../components/GridLocationComponent.js";
import CollectibleComponent from "../components/CollectibleComponent.js"

export default class SunSpawningSystem {
    constructor(grid, factory){
        this.world = null
        this.grid = grid
        this.factory = factory

        this.spawnInterval = 5
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

        const randomCol = Math.floor(Math.random() * this.grid.cols);
        const randomRow = Math.floor(Math.random() * this.grid.rows);
        const targetPos = this.grid.getWorldPos(randomRow, randomCol);

        const sunProto = this.factory.prototypes.sun;
        const sunImage = this.factory.assetLoader.getImage(sunProto.components.SpriteComponent.assetKey);

        if (!sunImage || sunImage.height === 0) return;

        const sunTargetHeight = sunProto.components.PositionComponent.height;
        const aspectRatio = sunImage.width / sunImage.height;
        const actualSunWidth = sunTargetHeight * aspectRatio;
        
        const startX = targetPos.x 
        const startY = -sunTargetHeight / 2; 

        const entityID = this.factory.create('sun', { x: startX, y: startY });
        if (entityID !== null) {
            this.world.addComponent(entityID, new GridLocationComponent(randomRow, randomCol));
            const sunProto = this.factory.prototypes.sun;
            const sunValue = sunProto.value || 25; 
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

            const sunCenterY = pos.y 

            if (sunCenterY >= targetY) {
                this.world.removeComponent(entityID, 'VelocityComponent');
                
                pos.y = targetY 
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