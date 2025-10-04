
export default class ShootsProjectilesComponent {
    constructor(projectileName, fireRate, projectileSpeed, burstCount = 1, burstDelay = 0) {
        this.projectileName = projectileName;
        this.fireRate = fireRate;
        this.projectileSpeed = projectileSpeed;
        this.fireCooldown = 0;

        this.burstCount = burstCount;
        this.burstDelay = burstDelay;

        this.shotsFiredInBurst = 0;
        this.burstCooldown = 0;
    }
}