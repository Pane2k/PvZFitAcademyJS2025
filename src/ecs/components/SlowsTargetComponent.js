export default class SlowsTargetComponent {
    constructor(config) {
        const safeConfig = config || {};
        
        this.slowFactor = safeConfig.slowFactor ?? 0.5; 
        this.duration = safeConfig.duration ?? 3.0;     
    }
}