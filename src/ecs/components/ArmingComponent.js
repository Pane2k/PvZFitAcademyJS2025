export default class ArmingComponent {
    constructor(config) {
        const safeConfig = config || {};
        // Используем значения из конфига или значения по умолчанию
        this.timer = safeConfig.armingTime ?? 10.0;
        this.armedSpriteKey = safeConfig.armedSpriteKey ?? 'potato_mine_armed'; // Исправляем ключ по умолчанию
    }
}