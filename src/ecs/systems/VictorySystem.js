import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import FadeEffectComponent from "../components/FadeEffectComponent.js";
import UITravelComponent from "../components/UITravelComponent.js";

export default class VictorySystem {
    constructor() {
        this.world = null;
        this.sequenceState = 'idle'; // idle -> animating -> fading
        this.trophyId = null;
        
        // --- VVV ИЗМЕНЕНИЕ: УДАЛЯЕМ ПОДПИСКУ ИЗ КОНСТРУКТОРА VVV ---
        // this.boundOnTrophyCollected = this.onTrophyCollected.bind(this);
        // eventBus.subscribe('trophy:collected', this.boundOnTrophyCollected);
        // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^ ---
    }
    
    // --- ИЗМЕНЕНИЕ: Метод теперь называется handleTrophyCollected для ясности ---
    handleTrophyCollected(data) {
        if (this.sequenceState !== 'idle') return;

        this.trophyId = data.entityId;
        const trophyPos = this.world.getComponent(this.trophyId, 'PositionComponent');

        if (trophyPos) {
            const targetX = 640;
            const targetY = 360;
            
            const distance = Math.sqrt(Math.pow(targetX - trophyPos.x, 2) + Math.pow(targetY - trophyPos.y, 2));
            const speed = distance / 1.5;
            
            this.world.addComponent(this.trophyId, new UITravelComponent(targetX, targetY, speed));

            this.sequenceState = 'animating';
            Debug.log("VictorySystem: Trophy collected. Waiting for flight animation to finish.");
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
            
            // --- ИЗМЕНЕНИЕ: УДАЛЯЕМ ОТПИСКУ ИЗ UPDATE ---
            // eventBus.unsubscribe('trophy:collected', this.boundOnTrophyCollected);
            
            const fadeConfig = { 
                duration: 1.5, 
                startAlpha: 0, 
                targetAlpha: 1, 
                onCompleteEvent: 'game:win'
            };
            
            // Мы не можем здесь создать сущность, так как не знаем, существует ли мир.
            // Вместо этого, просто публикуем событие, а GameplayState создаст эффект.
            // Это более чистое разделение ответственности.
            eventBus.publish('victory:start_fade');
        }
    }

    // --- НОВЫЙ МЕТОД ДЛЯ СБРОСА ---
    reset() {
        this.sequenceState = 'idle';
        this.trophyId = null;
    }
}