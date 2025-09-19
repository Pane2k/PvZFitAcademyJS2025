import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";

export default class PlayerInputSystem{
    constructor(game, grid){
        this.game = game
        this.world = null
        this.factory = null
        this.grid = grid

        eventBus.subscribe('input:click', this.handleClick.bind(this))
        Debug.log('PlayerInputSystem subscribed to input:click event.')
    }

    handleClick(position) {
        if (!this.factory || !this.grid) return;
        
        const collectibles = this.world.getEntitiesWithComponents('CollectibleComponent', 'PositionComponent');
        for (const entityID of collectibles) {
            const pos = this.world.getComponent(entityID, 'PositionComponent')
            if (position.x >= pos.x && position.x <= pos.x + pos.width &&
                position.y >= pos.y && position.y <= pos.y + pos.height)
            {
                Debug.log(`Collected sun (entity ${entityID})!`)

                const sunValue = 25 
                eventBus.publish('sun:collected', { value: sunValue })
                
                this.world.addComponent(entityID, new RemovalComponent())
                
                
                
                return
            }
        }


        const gridCoords = this.grid.getCoords(position.x, position.y)
        
        if (gridCoords) {
            if (this.grid.isCellOccupied(gridCoords.row, gridCoords.col)) {
                Debug.log('Cell is already occupied.')
                return
            }
            const plantToPlace = 'peashooter'
            const plantData = this.factory.prototypes[plantToPlace]
            if (!plantData) {
                Debug.error(`No prototype found for: ${plantToPlace}`)
                return
            }
            const plantCost = plantData.cost || 0

            const hud = this.game.stateManager.currentState.hud
            if (!hud) {
                Debug.error('HUD not found in current state.')
                return
            }

            // Просто передаем gridCoords в фабрику
            if (hud.sunCount >= plantCost) {
                // 4. Если да - тратим "солнце"
                hud.sunCount -= plantCost;
                Debug.log(`Spent ${plantCost} sun. Remaining: ${hud.sunCount}`);

                // 5. Создаем и размещаем растение
                const entityId = this.factory.create(plantToPlace, { gridCoords: gridCoords });
                if (entityId !== null) {
                    this.grid.placeEntity(gridCoords.row, gridCoords.col, entityId);
                }
            } else {
                // 6. Если нет - сообщаем в консоль
                Debug.log(`Not enough sun to plant ${plantToPlace}. Need ${plantCost}, have ${hud.sunCount}`);
            }
        }
    }
}