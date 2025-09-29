import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import UITravelComponent from "../components/UITravelComponent.js"
import PrefabComponent from "../components/PrefabComponent.js"
import GhostPlantComponent from "../components/GhostPlantComponent.js";
import CursorAttachmentComponent from "../components/CursorAttachmentComponent.js"

export default class PlayerInputSystem{
    constructor(game, grid, hud){
        this.game = game
        this.world = null
        this.factory = null
        this.grid = grid
        this.hud = hud

        this.selectedPlant = null
        this.ghostPlantId = null
        this.cursorPlantId = null

        eventBus.subscribe('input:click', this.handleClick.bind(this))
        Debug.log('PlayerInputSystem subscribed to input:click event.')
    }

    handleClick(position) {
        if (!this.factory || !this.grid || !this.hud) return;

        // Обрабатываем клик поочередно. Если какая-то часть UI
        // его "поглотила", прекращаем дальнейшую обработку.
        if (this._handleClickOnUI(position)) return;
        if (this._handleClickOnCollectible(position)) return;
        if (this._handleClickOnGrid(position)) return;
    }

    _handleClickOnUI(position) {
        const clickedCardName = this.hud.checkClick(position.x, position.y);
        if (clickedCardName) {
            const plantData = this.factory.prototypes[clickedCardName];
            if (this.hud.sunCount >= plantData.cost) {
                if (this.selectedPlant === clickedCardName) {
                    this.selectedPlant = null;
                    this._destroySelectionVisuals(); // <-- ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ МЕТОД
                } else {
                    this.selectedPlant = clickedCardName;
                    this._createSelectionVisuals(clickedCardName); // <-- ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ МЕТОД
                }
                Debug.log(`Selected plant is now: ${this.selectedPlant}`);
            } else {
                Debug.log(`Not enough sun for ${clickedCardName}.`);
                this.selectedPlant = null;
                this._destroySelectionVisuals(); // <-- ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ МЕТОД
            }
            return true;
        }
        return false;
    }

    _handleClickOnCollectible(position) {
        const collectibles = this.world.getEntitiesWithComponents('CollectibleComponent', 'PositionComponent');
        for (const entityID of collectibles) {
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            if (position.x >= pos.x && position.x <= pos.x + pos.width &&
                position.y >= pos.y && position.y <= pos.y + pos.height) {
                
                Debug.log(`Collected resource (entity ${entityID})! Starting animation.`);
                
                const collectibleComp = this.world.getComponent(entityID, 'CollectibleComponent');
                const resourceValue = collectibleComp.value;

                eventBus.publish('sun:collected', { value: resourceValue });

                const targetPos = this.hud.getSunCounterPosition();
                this.world.addComponent(entityID, new UITravelComponent(targetPos.x, targetPos.y, 1200));

                this.world.removeComponent(entityID, 'CollectibleComponent');
                this.world.removeComponent(entityID, 'HitboxComponent');
                this.world.removeComponent(entityID, 'GridLocationComponent');
                this.world.removeComponent(entityID, 'LifetimeComponent');
                
                return true;
            }
        }
        return false;
    }

    _handleClickOnGrid(position) {
        if (!this.selectedPlant) return false;

        const gridCoords = this.grid.getCoords(position.x, position.y);
        if (gridCoords) {
            if (this.grid.isCellOccupied(gridCoords.row, gridCoords.col)) {
                Debug.log('Cell is already occupied.');
                return false;
            }

            const plantData = this.factory.prototypes[this.selectedPlant];
            const plantCost = plantData.cost || 0;

            if (this.hud.sunCount >= plantCost) {
                eventBus.publish('sun:spent', { value: plantCost });

                const entityId = this.factory.create(this.selectedPlant, { gridCoords: gridCoords });
                if (entityId !== null) {
                    this.grid.placeEntity(gridCoords.row, gridCoords.col, entityId);
                    this.hud.startCooldown(this.selectedPlant); 
                    this.selectedPlant = null;
                    this._destroySelectionVisuals(); // <-- ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ МЕТОД
                }
            } else {
                Debug.log(`Not enough sun to plant ${this.selectedPlant}.`);
                this.selectedPlant = null;
                this._destroySelectionVisuals(); // <-- ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ МЕТОД
            }
            return true;
        }
        
        this.selectedPlant = null;
        this._destroySelectionVisuals(); // <-- ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ МЕТОД
        Debug.log('Clicked outside grid, selection cleared.');
        return true;
    }

    _createSelectionVisuals(plantName) {
        this._destroySelectionVisuals(); // Уничтожаем старые визуалы

        // 1. Создаем "призрака" для сетки (как и раньше)
        this.ghostPlantId = this.factory.create(plantName, { x: -200, y: -200 });
        if (this.ghostPlantId !== null) {
            this.world.addComponent(this.ghostPlantId, new GhostPlantComponent());
            // Убираем лишние компоненты
            this.world.removeComponent(this.ghostPlantId, 'HealthComponent');
            this.world.removeComponent(this.ghostPlantId, 'PlantComponent');
            this.world.removeComponent(this.ghostPlantId, 'HitboxComponent');
            this.world.removeComponent(this.ghostPlantId, 'SunProducerComponent');
            this.world.removeComponent(this.ghostPlantId, 'ShootsProjectilesComponent');
            this.world.removeComponent(this.ghostPlantId, 'GridLocationComponent');
        }

        // 2. Создаем "растение-курсор"
        this.cursorPlantId = this.factory.create(plantName, { x: -200, y: -200 });
        if (this.cursorPlantId !== null) {
            // Добавляем наш новый компонент-маркер
            this.world.addComponent(this.cursorPlantId, new CursorAttachmentComponent());
            
            // Уменьшаем его размер для лучшего вида
            const pos = this.world.getComponent(this.cursorPlantId, 'PositionComponent');
            if (pos) {
                pos.width *= 0.8;
                pos.height *= 0.8;
            }
            
            // Ставим его поверх всего, включая UI
            const renderable = this.world.getComponent(this.cursorPlantId, 'RenderableComponent');
            if (renderable) {
                renderable.layer = 100;
            }
             // Убираем лишние компоненты так же, как и у призрака
            this.world.removeComponent(this.cursorPlantId, 'HealthComponent');
            this.world.removeComponent(this.cursorPlantId, 'PlantComponent');
            this.world.removeComponent(this.cursorPlantId, 'HitboxComponent');
            this.world.removeComponent(this.cursorPlantId, 'SunProducerComponent');
            this.world.removeComponent(this.cursorPlantId, 'ShootsProjectilesComponent');
            this.world.removeComponent(this.cursorPlantId, 'GridLocationComponent');
        }
    }

    _destroySelectionVisuals() {
        if (this.ghostPlantId !== null) {
            this.world.addComponent(this.ghostPlantId, new RemovalComponent());
            this.ghostPlantId = null;
        }
        if (this.cursorPlantId !== null) {
            this.world.addComponent(this.cursorPlantId, new RemovalComponent());
            this.cursorPlantId = null;
        }
    }
    
}