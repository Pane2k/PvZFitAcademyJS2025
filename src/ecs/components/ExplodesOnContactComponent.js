export default class ExplodesOnContactComponent {
    constructor(config) {
        const safeConfig = config || {};
        
        // Получаем значения из объекта config или используем значения по умолчанию
        this.damage = safeConfig.damage ?? 500;
        this.radius = safeConfig.radius ?? 80;
    }
}