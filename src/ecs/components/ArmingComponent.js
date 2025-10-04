export default class ArmingComponent {
    constructor(config) {
        const safeConfig = config || {};
        this.timer = safeConfig.armingTime ?? 10.0;
        this.armedSpriteKey = safeConfig.armedSpriteKey ?? 'potato_mine_armed'; 
    }
}