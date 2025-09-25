export default class ShootsProjectilesComponent {
    constructor(projectileName, fireRate, projectileSpeed) {
        this.projectileName = projectileName;
        this.fireRate = fireRate;
        this.projectileSpeed = projectileSpeed;
        this.fireCooldown = 0; // Внутренний таймер перезарядки
    }
}