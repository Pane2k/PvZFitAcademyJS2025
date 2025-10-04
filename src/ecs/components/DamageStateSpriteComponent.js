// src/ecs/components/DamageStateSpriteComponent.js

export default class DamageStateSpriteComponent {
    constructor(config) {
        // damageStates - это массив объектов: [{ threshold: 0.66, assetKey: 'wallnut_half' }, ...]
        this.damageStates = config.damageStates;
        this.currentStateIndex = -1; // Индекс текущего состояния повреждения
    }
}