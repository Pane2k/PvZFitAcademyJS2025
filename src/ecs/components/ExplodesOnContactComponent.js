export default class ExplodesOnContactComponent {
    constructor(config) {
        const safeConfig = config || {};
        
        this.damage = safeConfig.damage ?? 500;
        this.radius = safeConfig.radius ?? 80;
    }
}