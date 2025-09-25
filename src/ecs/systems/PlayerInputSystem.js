import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import UITravelComponent from "../components/UITravelComponent.js"

export default class PlayerInputSystem{
    constructor(game, grid, hud){
        this.game = game
        this.world = null
        this.factory = null
        this.grid = grid
        this.hud = hud

        this.selectedPlant = null

        eventBus.subscribe('input:click', this.handleClick.bind(this))
        Debug.log('PlayerInputSystem subscribed to input:click event.')
    }

    handleClick(position) {
        if (!this.factory || !this.grid || !this.hud) return;

        // 1. ПРОВЕРКА КЛИКА ПО UI (КАРТОЧКАМ) - САМЫЙ ВЫСОКИЙ ПРИОРИТЕТ
        const clickedCardName = this.hud.checkClick(position.x, position.y);
        if (clickedCardName) {
            const plantData = this.factory.prototypes[clickedCardName];
            if (this.hud.sunCount >= plantData.cost) {
                // Если кликнули по той же карточке, снимаем выделение
                this.selectedPlant = (this.selectedPlant === clickedCardName) ? null : clickedCardName;
                Debug.log(`Selected plant is now: ${this.selectedPlant}`);
            } else {
                Debug.log(`Not enough sun for ${clickedCardName}.`);
                this.selectedPlant = null; // Сбрасываем выбор, если не хватает денег
            }
            return; // Завершаем обработку клика, т.к. он был поглощен UI
        }

        // 2. ПРОВЕРКА СБОРА РЕСУРСОВ
        const collectibles = this.world.getEntitiesWithComponents('CollectibleComponent', 'PositionComponent');
        for (const entityID of collectibles) {
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            if (position.x >= pos.x && position.x <= pos.x + pos.width &&
                position.y >= pos.y && position.y <= pos.y + pos.height) {
                
                Debug.log(`Collected sun (entity ${entityID})! Starting animation.`);
                
                // --- НОВАЯ ЛОГИКА ---
                const sunValue = 25; // Можно будет вынести в компонент, если нужно

                // 1. МОМЕНТАЛЬНО ПУБЛИКУЕМ СОБЫТИЕ
                eventBus.publish('sun:collected', { value: sunValue });

                // 2. ЗАПУСКАЕМ АНИМАЦИЮ
                const targetPos = this.hud.getSunCounterPosition();
                this.world.addComponent(entityID, new UITravelComponent(targetPos.x, targetPos.y, 2000)); // <-- Возвращаем скорость!

                // 3. УДАЛЯЕМ КОМПОНЕНТЫ, ЧТОБЫ СОЛНЦЕ НЕЛЬЗЯ БЫЛО СОБРАТЬ ДВАЖДЫ
                this.world.removeComponent(entityID, 'CollectibleComponent');
                this.world.removeComponent(entityID, 'HitboxComponent');
                this.world.removeComponent(entityID, 'GridLocationComponent');
                this.world.removeComponent(entityID, 'LifetimeComponent');
                // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

                return; // Завершаем обработку
            }
        }

        // 3. ПРОВЕРКА ПОСАДКИ РАСТЕНИЯ (ТОЛЬКО ЕСЛИ ЧТО-ТО ВЫБРАНО)
        if (this.selectedPlant) {
            const gridCoords = this.grid.getCoords(position.x, position.y);
            if (gridCoords) {
                if (this.grid.isCellOccupied(gridCoords.row, gridCoords.col)) {
                    Debug.log('Cell is already occupied.');
                    return;
                }

                const plantData = this.factory.prototypes[this.selectedPlant];
                const plantCost = plantData.cost || 0;

                if (this.hud.sunCount >= plantCost) {
                    this.hud.sunCount -= plantCost;
                    Debug.log(`Spent ${plantCost} sun. Remaining: ${this.hud.sunCount}`);

                    const entityId = this.factory.create(this.selectedPlant, { gridCoords: gridCoords });
                    if (entityId !== null) {
                        this.grid.placeEntity(gridCoords.row, gridCoords.col, entityId);
                        this.selectedPlant = null; // Сбрасываем выбор после успешной посадки
                    }
                } else {
                    Debug.log(`Not enough sun to plant ${this.selectedPlant}.`);
                }
            }
        }
    }
}