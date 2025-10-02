// src/ecs/components/FlagComponent.js
export default class FlagComponent {
    constructor(config) {
        this.flagSlot = config.flagSlot;
        this.attachmentName = config.attachmentName;
        this.animationOverrides = config.animationOverrides || {};
    }
}