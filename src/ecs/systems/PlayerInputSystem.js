import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import RemovalComponent from "../components/RemovalComponent.js";
import UITravelComponent from "../components/UITravelComponent.js"
import PrefabComponent from "../components/PrefabComponent.js"
import GhostPlantComponent from "../components/GhostPlantComponent.js";

export default class PlayerInputSystem{
    constructor(game, grid, hud){
        this.game = game
        this.world = null
        this.factory = null
        this.grid = grid
        this.hud = hud

        this.selectedPlant = null
        this.ghostPlantId = null;

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
                    this._destroyGhostPlant(); // <-- Уничтожаем призрака
                } else {
                    this.selectedPlant = clickedCardName;
                    this._createGhostPlant(clickedCardName); // <-- Создаем призрака
                }
                Debug.log(`Selected plant is now: ${this.selectedPlant}`);
            } else {
                Debug.log(`Not enough sun for ${clickedCardName}.`);
                this.selectedPlant = null;
                this._destroyGhostPlant();
            }
            return true; // Клик поглощен UI
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
                
                // --- САМОЕ ПРАВИЛЬНОЕ РЕШЕНИЕ ---
                const collectibleComp = this.world.getComponent(entityID, 'CollectibleComponent');
                const resourceValue = collectibleComp.value;
                // ---

                eventBus.publish('sun:collected', { value: resourceValue });

                const targetPos = this.hud.getSunCounterPosition();
                // Мы передаем resourceValue в UITravelComponent, хотя он и не используется,
                // на случай, если в будущем захотим показывать цифры урона/сбора.
                this.world.addComponent(entityID, new UITravelComponent(targetPos.x, targetPos.y, 1200));

                this.world.removeComponent(entityID, 'CollectibleComponent');
                this.world.removeComponent(entityID, 'HitboxComponent');
                this.world.removeComponent(entityID, 'GridLocationComponent');
                this.world.removeComponent(entityID, 'LifetimeComponent');
                
                return true; // Клик поглощен сбором ресурса
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
                return false; // Клик по занятой ячейке не сбрасывает выбор
            }

            const plantData = this.factory.prototypes[this.selectedPlant];
            const plantCost = plantData.cost || 0;

            if (this.hud.sunCount >= plantCost) {
                eventBus.publish('sun:spent', { value: plantCost });

                const entityId = this.factory.create(this.selectedPlant, { gridCoords: gridCoords });
                if (entityId !== null) {
                    this.grid.placeEntity(gridCoords.row, gridCoords.col, entityId);
                    this.hud.startCooldown(this.selectedPlant); 
                    this.selectedPlant = null; // Сбрасываем выбор после успешной посадки
                    this._destroyGhostPlant();
                }
            } else {
                Debug.log(`Not enough sun to plant ${this.selectedPlant}.`);
                this.selectedPlant = null; // Сбрасываем, если денег не хватило
                this._destroyGhostPlant();
            }
            return true; // Клик был по сетке, он обработан
        }
        
        // Если кликнули мимо сетки, сбрасываем выбор растения
        this.selectedPlant = null;
        this._destroyGhostPlant();
        Debug.log('Clicked outside grid, selection cleared.');
        return true;
    }
    _createGhostPlant(plantName) {
        this._destroyGhostPlant(); // На всякий случай удаляем старого
        
        this.ghostPlantId = this.factory.create(plantName, { x: -100, y: -100 }); // Создаем за экраном
        if (this.ghostPlantId !== null) {
            this.world.addComponent(this.ghostPlantId, new GhostPlantComponent());
            // Удаляем ненужные для призрака компоненты
            this.world.removeComponent(this.ghostPlantId, 'HealthComponent');
            this.world.removeComponent(this.ghostPlantId, 'PlantComponent');
            this.world.removeComponent(this.ghostPlantId, 'HitboxComponent');
            this.world.removeComponent(this.ghostPlantId, 'SunProducerComponent');
            this.world.removeComponent(this.ghostPlantId, 'ShootsProjectilesComponent');
            this.world.removeComponent(this.ghostPlantId, 'GridLocationComponent');
        }
    }

    _destroyGhostPlant() {
        if (this.ghostPlantId !== null) {
            this.world.addComponent(this.ghostPlantId, new RemovalComponent());
            this.ghostPlantId = null;
        }
    }
}