// src/game/TransitionManager.js

import eventBus from "../core/EventBus.js";
import Debug from "../core/Debug.js";
import FillColorComponent from "../ecs/components/FillColorComponent.js";
import RenderableComponent from "../ecs/components/RenderableComponent.js";
import PositionComponent from "../ecs/components/PositionComponent.js";
import FadeEffectComponent from "../ecs/components/FadeEffectComponent.js";

class TransitionManager {
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        this.transitionEntityId = null;
        this.onTransitionMidpoint = null;
        this.onTransitionComplete = null; // <-- ДОБАВИТЬ СВОЙСТВО
    }

    startTransition(onMidpoint, onComplete) { // <-- ДОБАВИТЬ ВТОРОЙ АРГУМЕНТ
        Debug.log("TransitionManager: Starting full screen transition.");
        this.onTransitionMidpoint = onMidpoint;
        this.onTransitionComplete = onComplete; // <-- СОХРАНИТЬ КОЛБЭК

        if (this.transitionEntityId !== null) {
            this.world.removeEntity(this.transitionEntityId);
        }

        this.transitionEntityId = this.world.createEntity();
        
        const V_WIDTH = this.renderer.VIRTUAL_WIDTH;
        const V_HEIGHT = this.renderer.VIRTUAL_HEIGHT;

        this.world.addComponent(this.transitionEntityId, new PositionComponent(V_WIDTH / 2, V_HEIGHT / 2, V_WIDTH, V_HEIGHT));
        this.world.addComponent(this.transitionEntityId, new RenderableComponent(200));
        this.world.addComponent(this.transitionEntityId, new FillColorComponent('white'));
        
        const fadeInConfig = {
            duration: 0.5, // <-- Ускорим для удобства
            startAlpha: 0,
            targetAlpha: 1,
            onCompleteEvent: 'transition:fade_in_complete'
        };
        this.world.addComponent(this.transitionEntityId, new FadeEffectComponent(fadeInConfig));

        const onFadeInComplete = () => {
            this.handleFadeInComplete();
            eventBus.unsubscribe('transition:fade_in_complete', onFadeInComplete);
        };
        eventBus.subscribe('transition:fade_in_complete', onFadeInComplete);
    }
    
    handleFadeInComplete() {
        Debug.log("TransitionManager: Fade in complete. Holding and changing state.");
        
        setTimeout(() => {
            if (this.onTransitionMidpoint) {
                this.onTransitionMidpoint();
            }
            this.startFadeOut();
        }, 100); // Уменьшим задержку
    }

    startFadeOut() {
        Debug.log("TransitionManager: Starting fade out.");
        
        // --- VVV ИЗМЕНЕНИЕ ЗДЕСЬ VVV ---
        const fadeOutConfig = {
            duration: 0.5,
            startAlpha: 1,
            targetAlpha: 0,
            onCompleteEvent: 'transition:fade_out_complete' // <-- Добавляем событие завершения
        };
        
        // Подписываемся на событие ОДИН РАЗ
        const onFadeOutComplete = () => {
            if (this.onTransitionComplete) {
                this.onTransitionComplete(); // Вызываем колбэк
            }
            // Удаляем слушатель, чтобы он не сработал снова
            eventBus.unsubscribe('transition:fade_out_complete', onFadeOutComplete);
            Debug.log("TransitionManager: Transition finished.");
        };
        eventBus.subscribe('transition:fade_out_complete', onFadeOutComplete);

        this.world.removeComponent(this.transitionEntityId, 'FadeEffectComponent');
        this.world.addComponent(this.transitionEntityId, new FadeEffectComponent(fadeOutConfig));
    }
}

export default TransitionManager;