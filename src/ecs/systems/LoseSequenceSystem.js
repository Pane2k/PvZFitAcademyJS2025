
import eventBus from "../../core/EventBus.js";
import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";

export default class LoseSequenceSystem {
    constructor(cameraSystem) {
        this.world = null;
        this.cameraSystem = cameraSystem;
        this.sequenceState = 'inactive'; // inactive -> setup -> wait_zombie_exit -> text_hold -> fade_out -> done
        this.timer = 0;
    }

    update(deltaTime) {
        if (this.sequenceState === 'inactive' || this.sequenceState === 'done') return;

        // --- Этап 1: Настройка зомби ---
        if (this.sequenceState === 'setup') {
            const zombieId = this.world.getEntitiesWithComponents('LeadLosingZombieComponent')[0];
            if (!zombieId) { this.startTextHold(); return; }
            
            const pos = this.world.getComponent(zombieId, 'PositionComponent');
            const gridLoc = this.world.getComponent(zombieId, 'GridLocationComponent');
            const targetY = this.world.grid.getWorldPos(3, 0).y;
            if (gridLoc) gridLoc.row = 3;
            pos.y = targetY;

            this.sequenceState = 'wait_zombie_exit';
            Debug.log(`LoseSequence: Zombie moved. Waiting for exit.`);
        }

        // --- Этап 2: Ожидание ухода зомби ---
        if (this.sequenceState === 'wait_zombie_exit') {
            const zombieId = this.world.getEntitiesWithComponents('LeadLosingZombieComponent')[0];
            if (!zombieId) { this.startTextHold(); return; }
            
            const pos = this.world.getComponent(zombieId, 'PositionComponent');
            if (pos.x < 0) { 
                this.world.addComponent(zombieId, new RemovalComponent());
                this.startTextHold();
            }
        }
        
        // --- Этап 3: Показ текста и ожидание ---
        if (this.sequenceState === 'text_hold') {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.startFadeOut();
            }
        }

        // --- Этап 4: Ожидание завершения фейда ---
        if (this.sequenceState === 'fade_out') {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                eventBus.publish('game:lose');
                this.sequenceState = 'done';
            }
        }
    }
    
    startTextHold() {
        if (this.sequenceState !== 'wait_zombie_exit') return;
        
        this.world.factory.create('game_over_text', {});
        this.sequenceState = 'text_hold';
        // --- ИЗМЕНЕНИЕ: Убираем время на фейд, только время на чтение ---
        this.timer = 2.0; 
        Debug.log("LoseSequence: Zombie exited. Holding text for 2 seconds.");
    }

    start() {
        this.sequenceState = 'wait_zombie_exit';
        Debug.log("LoseSequenceSystem started.");
    }
    
    startFadeOut() {
        if (this.sequenceState !== 'text_hold') return;

        this.world.factory.create('white_screen_fade', {});
        this.sequenceState = 'fade_out';
        this.timer = 0.5; // Длительность анимации затухания
        Debug.log("LoseSequence: Hold finished. Fading to white for 0.5 seconds.");
    }
    
    reset() {
        this.sequenceState = 'inactive';
        this.timer = 0;
    }
}