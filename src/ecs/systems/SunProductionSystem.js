import Debug from "../../core/Debug.js";
import LifetimeComponent from "../components/LifetimeComponent.js";
import ArcMovementComponent from "../components/ArcMovementComponent.js"
import TintEffectComponent from "../components/TintEffectComponent.js"
import CollectibleComponent from "../components/CollectibleComponent.js"

export default class SunProductionSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const producers = this.world.getEntitiesWithComponents('SunProducerComponent', 'PositionComponent');
        if (producers.length === 0) return;
        const GLOW_DURATION = 2.0
        const FADE_IN_TIME = 1.0;

        for (const entityId of producers) {
            const producer = this.world.getComponent(entityId, 'SunProducerComponent');
            producer.timer += deltaTime;

            const timeLeft = producer.productionRate - producer.timer;
            const isGlowing = this.world.getComponent(entityId, 'TintEffectComponent');

            if (timeLeft <= GLOW_DURATION && !isGlowing) {
                this.world.addComponent(entityId, new TintEffectComponent(
                    '255, 255, 0',    // Базовый желтый цвет
                    0.4,              // Максимальная яркость
                    GLOW_DURATION,    // Длительность 2 сек
                    FADE_IN_TIME      // Появление за 1 сек
                ));
                Debug.log(`Sunflower ${entityId} started glowing (fade-in).`);
            }

            if (producer.timer >= producer.productionRate) {
                producer.timer = 0; // Сбрасываем таймер
                this.spawnSunNearProducer(entityId);
                this.world.removeComponent(entityId, 'TintEffectComponent'); 
                
                const FADE_OUT_TIME = 0.25;
                this.world.addComponent(entityId, new TintEffectComponent(
                    '255, 255, 0',
                    0.4,
                    FADE_OUT_TIME,
                    0, // Без появления
                    FADE_OUT_TIME // Только затухание
                ));
                Debug.log(`Sunflower ${entityId} started cooling down (fade-out).`);
            }
        }
    }

    spawnSunNearProducer(producerId, sunValue) {
        const pos = this.world.getComponent(producerId, 'PositionComponent');
        if (!pos) return;

        // Создаем солнце рядом с растением со случайным смещением
        const offsetX = (Math.random() - 0.5) * pos.width * 0.5;
        const offsetY = (Math.random() - 0.5) * pos.height * 0.5;
        
        const sunX = pos.x + offsetX;
        const sunY = pos.y + offsetY;

       
        const sunId = this.world.factory.create('sun', { x: sunX, y: sunY });
         if (sunId !== null) {
            // Удаляем компоненты, которые не нужны солнцу от подсолнуха
            this.world.removeComponent(sunId, 'VelocityComponent');
            
            // --- VVV ВОТ ИСПРАВЛЕНИЕ VVV ---
            // Это солнце не должно привязываться к сетке, поэтому удаляем компонент.
            this.world.removeComponent(sunId, 'GridLocationComponent');
            // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---

            const initialVy = -20;
            const initialVx = (Math.random() - 0.5) * 100;
            const gravity = 200;
            const landingOffsetY = 30; 
            const targetY = pos.y + landingOffsetY;

            this.world.addComponent(sunId, new ArcMovementComponent(initialVx, initialVy, gravity, targetY));
            
            const sunProto = this.world.factory.prototypes.sun;
            const sunValue = sunProto.value || 25;
            this.world.addComponent(sunId, new CollectibleComponent(sunValue));
            this.world.addComponent(sunId, new LifetimeComponent(10));
            Debug.log(`Sunflower ${producerId} produced sun ${sunId}.`);
        }
    }
}