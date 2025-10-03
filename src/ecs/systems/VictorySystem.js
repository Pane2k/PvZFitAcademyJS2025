// src/ecs/systems/VictorySystem.js
import eventBus from "../../core/EventBus.js";
import Debug from "../../core/Debug.js";
import FadeEffectComponent from "../components/FadeEffectComponent.js";
import UITravelComponent from "../components/UITravelComponent.js"; // <-- Импорт для проверки

export default class VictorySystem {
    constructor() {
        this.world = null;
        this.sequenceState = 'idle'; // idle -> animating -> fading
        this.trophyId = null;

        // Подписываемся на событие сбора трофея
        this.boundOnTrophyCollected = this.onTrophyCollected.bind(this);
        eventBus.subscribe('trophy:collected', this.boundOnTrophyCollected);
    }
    
    // Этот метод сработает, когда PlayerInputSystem опубликует событие
    onTrophyCollected(data) {
        if (this.sequenceState !== 'idle') return;

        this.trophyId = data.entityId;
        const trophyPos = this.world.getComponent(this.trophyId, 'PositionComponent');

        if (trophyPos) {
             // Задаем цель - центр экрана
            const targetX = 640;
            const targetY = 360;
            
            // Расчет скорости для полета длительностью ~1.5 секунды
            const distance = Math.sqrt(Math.pow(targetX - trophyPos.x, 2) + Math.pow(targetY - trophyPos.y, 2));
            const speed = distance / 1.5;
            
            // Добавляем анимацию полета
            this.world.addComponent(this.trophyId, new UITravelComponent(targetX, targetY, speed));

            this.sequenceState = 'animating';
            Debug.log("VictorySystem: Trophy collected. Waiting for flight animation to finish.");
        }
    }

    update() {
        // Система активна только в состоянии 'animating'
        if (this.sequenceState !== 'animating' || this.trophyId === null) {
            return;
        }

        // Проверяем, завершилась ли анимация полета.
        // UITravelSystem удаляет компонент UITravelComponent, когда цель достигнута.
        const isStillFlying = this.world.getComponent(this.trophyId, 'UITravelComponent');

        if (!isStillFlying) {
            // Анимация завершена! Запускаем затухание экрана.
            this.sequenceState = 'fading';
            Debug.log("VictorySystem: Flight finished. Starting screen fade.");
            
            const fadeConfig = { 
                duration: 1.5, 
                startAlpha: 0, 
                targetAlpha: 1, 
                onCompleteEvent: 'game:win' // Это событие вызовет переход в меню
            };
            
            const effectId = this.world.factory.create('screen_fade_effect', {});
            this.world.removeComponent(effectId, 'FadeEffectComponent');
            this.world.addComponent(effectId, new FadeEffectComponent(fadeConfig));

            // Отписываемся от события, чтобы избежать повторных срабатываний
            eventBus.unsubscribe('trophy:collected', this.boundOnTrophyCollected);
        }
    }
}