export default class SlowsTargetComponent {
    constructor(config) {
        // Добавляем проверку, чтобы код не падал, если config не передан
        const safeConfig = config || {};
        
        // Используем оператор ?? (nullish coalescing) для безопасного присвоения
        // Он сработает корректно, даже если slowFactor будет равен 0
        this.slowFactor = safeConfig.slowFactor ?? 0.5; // Множитель скорости (0.5 = 50% скорости)
        this.duration = safeConfig.duration ?? 3.0;     // Длительность замедления в секундах
    }
}