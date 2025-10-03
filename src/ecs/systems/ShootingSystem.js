import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js"

export default class ShootingSystem {
    constructor(factory) {
        this.world = null;
        this.factory = factory;
    }

    update(deltaTime) {
        const shooters = this.world.getEntitiesWithComponents('ShootsProjectilesComponent', 'PositionComponent', 'GridLocationComponent');
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent');

        if (zombies.length === 0) {
            return;
        }

        for (const shooterId  of shooters) {
            const shooterPos = this.world.getComponent(shooterId, 'PositionComponent');
            const shooterGridLoc = this.world.getComponent(shooterId, 'GridLocationComponent');
            
            let hasTargetOnLane = false;
            for (const zombieId of zombies) {
                const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');

                if (zombiePos.x > shooterPos.x) {
                    const zombieGridCoords = this.world.grid.getCoords(zombiePos.x, zombiePos.y);
                    
                    if (zombieGridCoords && zombieGridCoords.row === shooterGridLoc.row) {
                        hasTargetOnLane = true;
                        break;
                    }
                }
            }
            if (hasTargetOnLane) {
                const shooter = this.world.getComponent(shooterId, 'ShootsProjectilesComponent');
                shooter.fireCooldown -= deltaTime;

                if (shooter.fireCooldown <= 0) {
                    shooter.fireCooldown = shooter.fireRate;
                    this.fire(shooterId, shooter);
                }
            }
        }
    }

    fire(shooterId, shooterComponent) {
        const pos = this.world.getComponent(shooterId, 'PositionComponent');
        if (!pos) return;
        eventBus.publish('projectile:fired', { shooterId: shooterId });
        // NOTE: Точка спавна снаряда относительно центра
        const spawnX = pos.x + pos.width * 0.3; 
        const spawnY = pos.y - pos.height * 0.3;

        const projectileId = this.factory.create(shooterComponent.projectileName, { x: spawnX, y: spawnY });
        
        if (projectileId !== null) {
            const vel = this.world.getComponent(projectileId, 'VelocityComponent');
            if (vel) {
                vel.vx = shooterComponent.projectileSpeed;
            }
        }
    }
}