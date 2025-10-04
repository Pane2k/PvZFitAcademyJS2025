import eventBus from "../../core/EventBus.js";
import RemovalComponent from "../components/RemovalComponent.js";
import Debug from "../../core/Debug.js";

export default class LoseSequenceSystem {
    constructor(cameraSystem) {
        this.world = null;
        this.cameraSystem = cameraSystem;
        this.grid = null;
        this.sequenceState = 'inactive'; // inactive -> setup -> wait_zombie_exit -> text_hold -> fade_out -> done
        this.timer = 0;
    }

    update(deltaTime) {
        if (this.sequenceState === 'inactive' || this.sequenceState === 'done') return;

        if (this.sequenceState === 'setup') {
            const zombieId = this.world.getEntitiesWithComponents('LeadLosingZombieComponent')[0];
            if (!zombieId) { 
                this.startTextHold(); 
                return; 
            }
            
            const pos = this.world.getComponent(zombieId, 'PositionComponent');
            const gridLoc = this.world.getComponent(zombieId, 'GridLocationComponent');
            
            if (this.grid && pos) {
                const targetY = this.world.grid.getWorldPos(3, 0).y;
                pos.y = targetY;
                if (gridLoc) gridLoc.row = 3;
            }

            this.sequenceState = 'wait_zombie_exit';
            Debug.log(`LoseSequence: Zombie ${zombieId} moved to row 4. Waiting for exit.`);
        }

        if (this.sequenceState === 'wait_zombie_exit') {
            const zombieId = this.world.getEntitiesWithComponents('LeadLosingZombieComponent')[0];
            if (!zombieId) { this.startTextHold(); return; }
            
            const pos = this.world.getComponent(zombieId, 'PositionComponent');
            if (pos.x < -pos.width) {
                this.world.addComponent(zombieId, new RemovalComponent());
                this.startTextHold();
            }
        }
        
        if (this.sequenceState === 'text_hold') {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.startFadeOut();
            }
        }

        if (this.sequenceState === 'fade_out') {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                eventBus.publish('game:lose');
                this.sequenceState = 'done';
            }
        }
    }
    
    startTextHold() {
        if (this.sequenceState === 'text_hold' || this.sequenceState === 'fade_out' || this.sequenceState === 'done') return;
        
        this.world.factory.create('game_over_text', {});
        this.sequenceState = 'text_hold';
        this.timer = 2.0; 
        Debug.log("LoseSequence: Zombie exited. Holding text for 2 seconds.");
    }

    start() {
        this.sequenceState = 'setup';
        Debug.log("LoseSequenceSystem started.");
    }
    
    startFadeOut() {
        if (this.sequenceState !== 'text_hold') return;
        this.sequenceState = 'fade_out';
        this.timer = 0.5;
        Debug.log("LoseSequence: Hold finished. Fading to white for 0.5 seconds.");
    }
    
    reset() {
        this.sequenceState = 'inactive';
        this.timer = 0;
    }
}