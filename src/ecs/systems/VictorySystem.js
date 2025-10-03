import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import UITravelComponent from "../components/UITravelComponent.js";
// --- НОВЫЙ ИМПОРТ ---
import soundManager from "../../core/SoundManager.js";

export default class VictorySystem {
    constructor() {
        this.world = null;
        this.sequenceState = 'idle';
        this.trophyId = null;
    }
    
    handleTrophyCollected(data) {
        if (this.sequenceState !== 'idle') return;
        
        // --- VVV КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: ЗВУК ВОСПРОИЗВОДИТСЯ ЗДЕСЬ VVV ---
        soundManager.stopMusic();
        soundManager.playJingle('win_jingle');
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---

        this.trophyId = data.entityId;
        const trophyPos = this.world.getComponent(this.trophyId, 'PositionComponent');

        if (trophyPos) {
            const targetX = 640;
            const targetY = 360;
            
            const distance = Math.sqrt(Math.pow(targetX - trophyPos.x, 2) + Math.pow(targetY - trophyPos.y, 2));
            const speed = distance / 1.5; // Скорость полета трофея
            
            this.world.addComponent(this.trophyId, new UITravelComponent(targetX, targetY, speed));

            this.sequenceState = 'animating';
            Debug.log("VictorySystem: Trophy collected, jingle played. Waiting for flight animation.");
        }
    }

    update() {
        if (this.sequenceState !== 'animating' || this.trophyId === null) {
            return;
        }

        const isStillFlying = this.world.getComponent(this.trophyId, 'UITravelComponent');

        if (!isStillFlying) {
            this.sequenceState = 'fading';
            Debug.log("VictorySystem: Flight finished. Starting screen fade.");
            
            eventBus.publish('victory:start_fade');
        }
    }

    reset() {
        this.sequenceState = 'idle';
        this.trophyId = null;
    }
}