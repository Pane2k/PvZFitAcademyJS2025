
export default class ShootsProjectilesComponent {
    // --- VVV ИЗМЕНЯЕМ КОНСТРУКТОР VVV ---
    constructor(projectileName, fireRate, projectileSpeed, burstCount = 1, burstDelay = 0) {
        this.projectileName = projectileName;
        this.fireRate = fireRate;
        this.projectileSpeed = projectileSpeed;
        this.fireCooldown = 0;

        // Новые свойства для стрельбы очередями
        this.burstCount = burstCount;
        this.burstDelay = burstDelay;
        
        // Внутренние таймеры для управления очередью
        this.shotsFiredInBurst = 0;
        this.burstCooldown = 0;
    }
}