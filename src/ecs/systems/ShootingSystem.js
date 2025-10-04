import Debug from "../../core/Debug.js";
import eventBus from "../../core/EventBus.js";

export default class ShootingSystem {
    constructor(factory) {
        this.world = null;
        this.factory = factory;
    }

    update(deltaTime) {
        const shooters = this.world.getEntitiesWithComponents('ShootsProjectilesComponent', 'PositionComponent', 'GridLocationComponent');
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent');

        if (zombies.length === 0) {
            // Если зомби нет, сбрасываем состояние стрельбы у всех растений
            for (const shooterId of shooters) {
                const shooter = this.world.getComponent(shooterId, 'ShootsProjectilesComponent');
                shooter.shotsFiredInBurst = 0;
                shooter.burstCooldown = 0;
            }
            return;
        }

        for (const shooterId of shooters) {
            const shooter = this.world.getComponent(shooterId, 'ShootsProjectilesComponent');
            const shooterPos = this.world.getComponent(shooterId, 'PositionComponent');
            const shooterGridLoc = this.world.getComponent(shooterId, 'GridLocationComponent');

            // Если мы сейчас стреляем очередью, обновляем таймер паузы между выстрелами
            if (shooter.shotsFiredInBurst > 0) {
                shooter.burstCooldown -= deltaTime;
                if (shooter.burstCooldown <= 0) {
                    this.fire(shooterId, shooter); // Стреляем следующей горошиной в очереди
                }
                continue;
            }

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
                shooter.fireCooldown -= deltaTime;
                if (shooter.fireCooldown <= 0) {
                    // Начинаем стрельбу (первый выстрел в очереди)
                    this.fire(shooterId, shooter);
                }
            }
        }
    }

    fire(shooterId, shooterComponent) {
        const pos = this.world.getComponent(shooterId, 'PositionComponent');
        if (!pos) return;

        eventBus.publish('projectile:fired', { shooterId: shooterId });
        const spawnX = pos.x + pos.width * 0.3; 
        const spawnY = pos.y - pos.height * 0.3;

        const projectileId = this.factory.create(shooterComponent.projectileName, { x: spawnX, y: spawnY });
        
        if (projectileId !== null) {
            const vel = this.world.getComponent(projectileId, 'VelocityComponent');
            if (vel) {
                vel.vx = shooterComponent.projectileSpeed;
            }
        }

        shooterComponent.shotsFiredInBurst++;

        // Если мы еще не закончили очередь
        if (shooterComponent.shotsFiredInBurst < shooterComponent.burstCount) {
            // Устанавливаем таймер для следующего выстрела в очереди
            shooterComponent.burstCooldown = shooterComponent.burstDelay;
        } else {
            // Очередь закончена, сбрасываем счетчики и уходим на полную перезарядку
            shooterComponent.shotsFiredInBurst = 0;
            shooterComponent.fireCooldown = shooterComponent.fireRate;
        }
    }
}